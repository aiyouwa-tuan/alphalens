import os
from dotenv import load_dotenv

load_dotenv()
if "GEMINI_API_KEY" in os.environ and "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

print("GOOGLE_API_KEY:", os.environ.get("GOOGLE_API_KEY"))

from tradingagents.llm_clients.factory import create_llm_client
client = create_llm_client(provider="google", model="gemini-3-pro-preview")
llm = client.get_llm()
print("LLM built ok. type:", type(llm))

# Try generating
print(llm.invoke("Hello, say 'Test'"))
