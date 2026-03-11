import os
import asyncio
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv("../.env")

async def test():
    # Try different model names
    models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.5-flash", "gemini-flash"]
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("NO GOOGLE_API_KEY")
        return
        
    for m in models:
        print(f"\n--- Testing {m} ---")
        try:
            llm = ChatGoogleGenerativeAI(model=m, google_api_key=api_key)
            resp = await llm.ainvoke("say hi")
            print(f"  [SUCCESS] {m}: {resp.content}")
            break # if we find one that works, stop
        except Exception as e:
            print(f"  [FAIL] {m}: {e}")

if __name__ == "__main__":
    asyncio.run(test())
