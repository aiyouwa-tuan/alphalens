import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from tradingagents.agents.researchers.bull_researcher import create_bull_researcher
from dotenv import load_dotenv

load_dotenv()

class DummyMemory:
    def get_memories(self, text, n_matches=2):
        return []

async def test():
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-pro-preview",
        temperature=0,
        google_api_key=os.environ.get("GEMINI_API_KEY")
    )
    
    bull_node = create_bull_researcher(llm, DummyMemory())
    
    state = {
        "investment_debate_state": {"count": 0},
        "market_report": "market",
        "sentiment_report": "sentiment",
        "news_report": "news",
        "fundamentals_report": "fundamentals"
    }
    
    try:
        res = bull_node(state)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
