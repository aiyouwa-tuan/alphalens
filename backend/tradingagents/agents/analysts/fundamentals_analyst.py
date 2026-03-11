from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import get_fundamentals, get_balance_sheet, get_cashflow, get_income_statement, get_insider_transactions
from tradingagents.dataflows.config import get_config


def create_fundamentals_analyst(llm):
    async def fundamentals_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        company_name = state["company_of_interest"]

        tools = [
            get_fundamentals,
            get_balance_sheet,
            get_cashflow,
            get_income_statement,
        ]

        system_message = (
            "You are a researcher tasked with analyzing fundamental information over the past week about a company. Please write an extremely comprehensive and lengthy report (equivalent to 10-20 PDF pages) of the company's fundamental information such as financial documents, company profile, basic company financials, and company financial history to gain a full view of the company's fundamental information to inform traders. Make sure to include as much detail as possible. Do not simply state the trends are mixed, provide detailed, academic-level, and finegrained analysis and insights that may help traders make decisions. Expand on every single data point."
            + "\n\nCRITICAL LENGTH REQUIREMENT: Your final output MUST be very detailed (equivalent to 1-2 PDF pages). Expand on EVERY point, include exhaustive context, detail the counter-arguments, explain the precise financial reasoning derived from the analysts, and do not summarize briefly. Break down your analysis into multiple deep-dive sections, exploring macro contexts, micro metrics, competitive landscape, and forward-looking projections in exhaustive detail."
            + "\n\nMake sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
            + " Use the available tools: `get_fundamentals` for comprehensive company analysis, `get_balance_sheet`, `get_cashflow`, and `get_income_statement` for specific financial statements."
            + "\n\nCRITICAL INSTRUCTION: You are strictly limited to 1 or 2 tool calls! Fetch everything you need simultaneously using parallel tool calls. Once you receive data from tools, YOU MUST STOP CALLING TOOLS and immediately generate your final comprehensive report in Chinese!"
        )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are a helpful AI assistant, collaborating with other assistants. IMPORTANT: ALL your thoughts, responses, and reports MUST be written in Chinese (简体中文)."
                    " Use the provided tools to progress towards answering the question."
                    " If you are unable to fully answer, that's OK; another assistant with different tools"
                    " will help where you left off. Execute what you can to make progress."
                    " If you or any other assistant has the FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** or deliverable,"
                    " prefix your response with FINAL TRANSACTION PROPOSAL: **BUY/HOLD/SELL** so the team knows to stop."
                    " You have access to the following tools: {tool_names}.\n{system_message}"
                    "For your reference, the current date is {current_date}. The company we want to look at is {ticker}",
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )

        prompt = prompt.partial(system_message=system_message)
        prompt = prompt.partial(tool_names=", ".join([tool.name for tool in tools]))
        prompt = prompt.partial(current_date=current_date)
        prompt = prompt.partial(ticker=ticker)

        chain = prompt | llm.bind_tools(tools)

        result = await chain.ainvoke(state["messages"])

        report = ""

        tool_iterations = sum(1 for m in state["messages"] if hasattr(m, "tool_calls") and m.tool_calls)
        
        if len(result.tool_calls) == 0:
            report = result.content
        elif tool_iterations >= 2:
            # Emergency fallback: If it insists on calling tools at the iteration limit, we force text out.
            report = result.content if result.content else "该分析师获取数据完成，未能生成详细的文字总结，但已将数据传递给下游。" 

        return {
            "messages": [result],
            "fundamentals_report": report,
        }

    return fundamentals_analyst_node
