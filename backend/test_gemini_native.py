import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from dotenv import load_dotenv

load_dotenv()

async def test_gemini():
    llm = ChatGoogleGenerativeAI(
        model="gemini-3-pro-preview",
        temperature=0,
        google_api_key=os.environ.get("GEMINI_API_KEY")
    )
    
    try:
        print("Invoking Gemini 3...")
        response = llm.invoke([HumanMessage(content="Write a 1 paragraph argument on why AAPL is a good buy in 2026.")])
        print("Raw Type:", type(response.content))
        print("Raw Content:", repr(response.content))
    except Exception as e:
        print(f"Failed: {type(e).__name__} - {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
