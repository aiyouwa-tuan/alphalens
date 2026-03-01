import asyncio
import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from dotenv import load_dotenv

from google.api_core.gapic_v1.client_info import ClientInfo

load_dotenv()

@tool
def get_weather(location: str):
    """Get the weather for a location."""
    return "Sunny"

async def test_gemini():
    # Attempting to pass custom headers via client_info
    # x-goog-api-client is reserved for ClientInfo headers in google-api-core
    class CustomClientInfo(ClientInfo):
        def to_user_agent(self):
            base = super().to_user_agent()
            return f"{base} skip_thought_signature_validator"
            
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3-pro-preview",
            temperature=0,
            google_api_key=os.environ.get("GEMINI_API_KEY"),
            client_options={"api_endpoint": "generativelanguage.googleapis.com"},
            client_info=CustomClientInfo()
        )
        
        llm_with_tools = llm.bind_tools([get_weather])
        
        print("Invoking Gemini 3 with tools...")
        response = llm_with_tools.invoke([HumanMessage(content="What is the weather in Tokyo?")])
        print("Success!")
        print(response.tool_calls)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_gemini())
