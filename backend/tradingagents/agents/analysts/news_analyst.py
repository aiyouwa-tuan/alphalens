from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import get_news, get_global_news
from tradingagents.dataflows.config import get_config


def create_news_analyst(llm):
    async def news_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]

        tools = [
            get_news,
            get_global_news,
        ]

        system_message = (
            "You are a news researcher tasked with analyzing recent news and trends over the past week. Please write a highly focused, professional report (equivalent to 1-2 PDF pages) of the current state of the world that is relevant for trading and macroeconomics. Use the available tools: get_news(query, start_date, end_date) for company-specific or targeted news searches, and get_global_news(curr_date, look_back_days, limit) for broader macroeconomic news. Do not simply state the trends are mixed, provide detailed, academic-level, and finegrained analysis and insights that may help traders make decisions concisely."
            + "\n\nCRITICAL LENGTH REQUIREMENT: Your output MUST be extremely detailed and long (around 10-20 pages if printed). Break down your analysis into multiple deep-dive sections, exploring macro contexts, micro metrics, socio-political impacts, and forward-looking projections in exhaustive detail."
            + "\n\nIMPORTANT: ALL your thoughts, responses, and reports MUST be written in Chinese (简体中文). Make sure to append a Markdown table at the end of the report to organize key points in the report, organized and easy to read."
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
                    "For your reference, the current date is {current_date}. We are looking at the company {ticker}",
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
            "news_report": report,
        }

    return news_analyst_node
