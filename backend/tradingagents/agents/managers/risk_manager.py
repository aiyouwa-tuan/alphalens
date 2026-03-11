import time
import json


def create_risk_manager(llm, memory):
    async def risk_manager_node(state) -> dict:

        company_name = state["company_of_interest"]

        history = state["risk_debate_state"]["history"]
        risk_debate_state = state["risk_debate_state"]
        market_research_report = state["market_report"]
        news_report = state["news_report"]
        fundamentals_report = state["fundamentals_report"]
        sentiment_report = state["sentiment_report"]
        trader_plan = state["investment_plan"]

        curr_situation = f"{market_research_report}\n\n{sentiment_report}\n\n{news_report}\n\n{fundamentals_report}"
        past_memories = memory.get_memories(curr_situation, n_matches=2)

        past_memory_str = ""
        for i, rec in enumerate(past_memories, 1):
            past_memory_str += rec["recommendation"] + "\n\n"

        prompt = f"""As the Risk Management Judge and Debate Facilitator, your goal is to evaluate the debate between three risk analysts—Aggressive, Neutral, and Conservative—and determine the best course of action for the trader. Your decision must result in a clear recommendation: Buy, Sell, or Hold. Choose Hold only if strongly justified by specific arguments, not as a fallback when all sides seem valid. Strive for clarity and decisiveness.

Guidelines for Decision-Making:
1. **Summarize Key Arguments**: Extract the strongest points from each analyst, focusing on relevance to the context.
2. **Provide Rationale**: Support your recommendation with direct quotes and counterarguments from the debate.
3. **Refine the Trader's Plan**: Start with the trader's original plan, **{trader_plan}**, and adjust it based on the analysts' insights.
4. **Learn from Past Mistakes**: Use lessons from **{past_memory_str}** to address prior misjudgments and improve the decision you are making now to make sure you don't make a wrong BUY/SELL/HOLD call that loses money.

Deliverables:
- A clear and actionable recommendation: Buy, Sell, or Hold.
- Extremely detailed reasoning anchored in the debate, risk profiles, and past reflections.

CRITICAL LENGTH REQUIREMENT: Your final risk management output MUST be highly focused and clear (equivalent to 1-2 PDF pages). Provide a breakdown of key risk factors, quantitative exposures, qualitative uncertainties, and rationale efficiently without unnecessary filler.

---

**Analysts Debate History:**  
{history}

---

Focus on actionable insights and continuous improvement. Build on past lessons, critically evaluate all perspectives, and ensure each decision advances better outcomes.

IMPORTANT: ALL your thoughts, responses, and reports MUST be written in Chinese (简体中文).
DO NOT include fake project numbers (like RM-2023-AI-MEGA) or fake dates in your report headers. The current date is {state.get('trade_date', 'today')}."""

        response = await llm.ainvoke(prompt)

        final_decision_text = response.content
        
        # Ensure '[]' strings (rendered lists of empty tool calls) are not displayed as blank brackets
        def safe_report(rep):
            if not rep or str(rep).strip() == "[]" or str(rep).strip() == "":
                return "暂无可用分析数据"
            return rep

        market_report_clean = safe_report(market_research_report)
        fundamentals_report_clean = safe_report(fundamentals_report)
        news_report_clean = safe_report(news_report)
        sentiment_report_clean = safe_report(sentiment_report)

        # Manually assemble the 30-page "Master PDF" by injecting all the raw, unabstracted analysts' data directly into the final payload.
        # This completely bypasses the LLM's physical output token ceiling limiting it to ~5 pages.
        full_expanded_report = f"""
# AlphaLens 投资委员会最终报告：{company_name}

{final_decision_text}

---
# 📚 附录 1: 原始分析师报告 (完整版)
此部分包含我们自主分析师团队收集的准确、未经总结的多页数据。未做任何删减。

## 📊 市场与技术分析
{market_report_clean}

## 🏢 基本面数据
{fundamentals_report_clean}

## 📰 全球与公司新闻
{news_report_clean}

## 📱 社交媒体情绪
{sentiment_report_clean}

---
# 🗣️ 附录 2: 原始辩论记录
此部分包含AI委员会关于此次交易观点及风险的逐字、未编辑辩论记录，展现所有细节。

## 🐂🐻 牛熊委员会辩论
{state.get("investment_debate_state", {}).get("history", "暂无辩论记录。")}

## ⚖️ 风险管理委员会辩论
{state.get("risk_debate_state", {}).get("history", "暂无辩论记录。")}
"""

        new_risk_debate_state = {
            "judge_decision": final_decision_text,
            "history": risk_debate_state["history"],
            "aggressive_history": risk_debate_state["aggressive_history"],
            "conservative_history": risk_debate_state["conservative_history"],
            "neutral_history": risk_debate_state["neutral_history"],
            "latest_speaker": "Judge",
            "current_aggressive_response": risk_debate_state["current_aggressive_response"],
            "current_conservative_response": risk_debate_state["current_conservative_response"],
            "current_neutral_response": risk_debate_state["current_neutral_response"],
            "count": risk_debate_state["count"],
        }

        return {
            "risk_debate_state": new_risk_debate_state,
            "final_trade_decision": full_expanded_report,
        }

    return risk_manager_node
