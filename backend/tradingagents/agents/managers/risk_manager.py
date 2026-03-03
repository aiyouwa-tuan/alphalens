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

CRITICAL LENGTH REQUIREMENT: Your final risk management output MUST be extremely detailed and long (equivalent to 10-20 PDF pages). Provide an exhaustive breakdown of all risk factors, quantitative exposures, qualitative uncertainties, and expansive rationale. Do not output a short summary. Unpack every single sentence into paragraphs of deep analysis.

---

**Analysts Debate History:**  
{history}

---

Focus on actionable insights and continuous improvement. Build on past lessons, critically evaluate all perspectives, and ensure each decision advances better outcomes.

IMPORTANT: ALL your thoughts, responses, and reports MUST be written in Chinese (简体中文)."""

        response = await llm.ainvoke(prompt)

        final_decision_text = response.content
        
        # Manually assemble the 30-page "Master PDF" by injecting all the raw, unabstracted analysts' data directly into the final payload.
        # This completely bypasses the LLM's physical output token ceiling limiting it to ~5 pages.
        full_expanded_report = f"""
# AlphaLens Master Investment Committee Report: {company_name}

{final_decision_text}

---
# 📚 Appendix 1: Raw Analyst Reports (Unabridged)
This section contains the exact, unsummarized, multi-page data gathered by our autonomous analyst team. Nothing has been abstracted.

## 📊 Market & Technical Analysis
{market_research_report}

## 🏢 Fundamental Data
{fundamentals_report}

## 📰 Global & Company News
{news_report}

## 📱 Social Media Sentiment
{sentiment_report}

---
# 🗣️ Appendix 2: The Raw Debate Transcript
This section contains the verbatim, unedited transcript of the AI committee debating the merits and risks of the trade, exposing all nuances.

## 🐂🐻 Bull vs Bear Committee Debate
{state.get("investment_debate_state", {}).get("history", "No debate history.")}

## ⚖️ Risk Management Committee Debate
{state.get("risk_debate_state", {}).get("history", "No debate history.")}
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
