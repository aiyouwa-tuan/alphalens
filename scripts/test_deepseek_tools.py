import os
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

os.environ["DEEPSEEK_API_KEY"] = "sk-0f1e09df073945bbb6057c7e9cddc101" # Using a dummy key if user didn't provide one, wait, I can't do requests without a real key.
# But wait, we can just look at the python code or use the user's config if it's in .env.local

import dotenv
dotenv.load_dotenv(".env.local")

@tool
def get_weather(location: str) -> str:
    """Get the current weather in a given location"""
    return "Sunny and 75 degrees"

llm = ChatOpenAI(
    model="deepseek-chat",
    api_key=os.environ.get("DEEPSEEK_API_KEY", "dummy"),
    base_url="https://api.deepseek.com/v1",
    max_retries=1
)

llm_with_tools = llm.bind_tools([get_weather])

if __name__ == "__main__":
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("Missing DEEPSEEK_API_KEY in .env.local!")
    else:
        try:
            print("Sending query to DeepSeek...")
            res = llm_with_tools.invoke("What is the weather like in San Francisco?")
            print("Response:", res)
        except Exception as e:
            print("Error:", e)
