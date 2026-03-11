from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import time
import json
from tradingagents.agents.utils.agent_utils import get_news
from tradingagents.dataflows.config import get_config


def create_social_media_analyst(llm):
    async def social_media_analyst_node(state):
        current_date = state["trade_date"]
        ticker = state["company_of_interest"]
        company_name = state["company_of_interest"]

        tools = [
            get_news,
        ]

        system_message = (
            "You are a social media and company specific news researcher/analyst tasked with analyzing social media posts, recent company news, and public sentiment for a specific company over the past week. You will be given a company's name your objective is to write an extremely comprehensive and lengthy report (equivalent to 10-20 PDF pages) detailing your analysis, insights, and implications for traders and investors on this company's current state after looking at social media and what people are saying about that company, analyzing sentiment data of what people feel each day about the company, and looking at recent company news. Use the get_news(query, start_date, end_date) tool to search for company-specific news and social media discussions. Try to look at all sources possible from social media to sentiment to news. Do not simply state the trends are mixed, provide detailed, academic-level, and finegrained analysis and insights that may help traders make decisions. Expand on every single data point."
            + "\n\nCRITICAL LENGTH REQUIREMENT: Your final output MUST be very detailed (equivalent to 1-2 PDF pages). Expand on EVERY point, include exhaustive context, detail the counter-arguments, explain the precise financial reasoning derived from the analysts, and do not summarize briefly. Break down your analysis into multiple deep-dive sections, exploring sentiment shifts, viral topics, public perception nuances, and forward-looking projections in exhaustive detail."
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
                    "For your reference, the current date is {current_date}. The current company we want to analyze is {ticker}",
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
            "sentiment_report": report,
        }

    return social_media_analyst_node
