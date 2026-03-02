import os
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# We need to map GEMINI_API_KEY to GOOGLE_API_KEY for langchain compatibility
if os.environ.get("GEMINI_API_KEY") and not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

app = FastAPI(title="TradingAgents API")

# Adjust CORS for Render & Next.js compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://www.neurynx.com",
        "https://alpha-lens-pi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    """Root endpoint for Render health checks"""
    return {"status": "ok", "message": "AlphaLens API is running natively."}

class DebateRequest(BaseModel):
    ticker: str
    provider: str = "google" # "google" or "doubao"
    api_key: str = ""        # optional, pass dynamically
    model: str = "gemini-3-pro-preview" # e.g. "ep-202xxx-xxx" for doubao

def format_sse(data: dict) -> dict:
    """Format dictionary into SSE standard payload."""
    return {"data": json.dumps(data)}

@app.post("/api/debate")
async def start_debate(request: Request, body: DebateRequest):
    """
    Starts the TradingAgents workflow for the given ticker and streams back the execution thought process via SSE.
    """
    ticker = body.ticker.upper()
    current_date = datetime.now().strftime("%Y-%m-%d")

    # Configure AlphaLens / TradingAgents
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = body.provider
    config["deep_think_llm"] = body.model
    config["quick_think_llm"] = body.model
    config["max_debate_rounds"] = 1
    config["data_vendors"] = {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance",
    }
    
    # Inject API Keys temporarily into environ so factory/clients pick them up
    if body.api_key:
        if body.provider == "google":
            os.environ["GOOGLE_API_KEY"] = body.api_key
        elif body.provider == "doubao":
            os.environ["DOUBAO_API_KEY"] = body.api_key

    try:
        # Initialize graph
        ta = TradingAgentsGraph(debug=True, config=config)
        
        # We need to stream the graph execution instead of calling `propagate`.
        # Taking logic from `tradingagents.graph.trading_graph.py` -> propagate() debug mode:
        init_agent_state = ta.propagator.create_initial_state(ticker, current_date)
        args = ta.propagator.get_graph_args()

    except Exception as e:
        return {"error": f"Failed to initialize graph: {str(e)}"}

    async def sse_generator():
        try:
            yield format_sse({"type": "status", "message": f"Starting analysis for {ticker}..."})
            
            # Use asyncio to run the synchronous stream generator without blocking the event loop
            # But the langgraph `graph.stream` is a synchronous generator. 
            # We iterate over it in a thread pool using asyncio.to_thread
            def run_stream():
                args = ta.propagator.get_graph_args()
                args["stream_mode"] = "updates"
                for chunk in ta.graph.stream(ta.propagator.create_initial_state(ticker, current_date), **args):
                    yield chunk

            # We'll adapt it by extracting data safely 
            stream_gen = run_stream()
            
            _SENTINEL = object()
            while True:
                # Get next chunk in a background thread to prevent blocking
                try:
                    chunk = await asyncio.to_thread(next, stream_gen, _SENTINEL)
                    if chunk is _SENTINEL:
                        break
                except Exception as e:
                    yield format_sse({"type": "error", "message": str(e)})
                    break
                
                # We extract the newly added messages or relevant state updates
                if getattr(chunk, "get", None):
                    # The chunk maps NodeName -> NodeState or StateChannel -> Value
                    for node_name, node_state in chunk.items():
                        payload = {"type": "update", "node": node_name}
                        
                        if isinstance(node_state, dict):
                            # Extract final reports if they exist
                            for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report", "investment_plan", "final_trade_decision"]:
                                if key in node_state and node_state[key]:
                                    payload[key] = node_state[key]
                            
                            content = None
                            
                            # Extract content from typical messages array
                            if "messages" in node_state and node_state["messages"]:
                                last_msg = node_state["messages"][-1]
                                if hasattr(last_msg, "content") and last_msg.content:
                                    content = last_msg.content
                                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                                    payload["tool_calls"] = last_msg.tool_calls
                            
                            # Or extract from investment_debate_state
                            elif "investment_debate_state" in node_state:
                                deb_state = node_state["investment_debate_state"]
                                if node_name == "Research Manager" and "judge_decision" in deb_state:
                                    content = deb_state["judge_decision"]
                                elif "current_response" in deb_state:
                                    content = deb_state["current_response"]
                            
                            # Or extract from risk_debate_state
                            elif "risk_debate_state" in node_state:
                                risk_state = node_state["risk_debate_state"]
                                speaker = risk_state.get("latest_speaker")
                                if speaker == "Aggressive":
                                    content = risk_state.get("current_aggressive_response")
                                elif speaker == "Conservative":
                                    content = risk_state.get("current_conservative_response")
                                elif speaker == "Neutral":
                                    content = risk_state.get("current_neutral_response")
                                elif speaker == "Judge":
                                    content = risk_state.get("judge_decision")
                            
                            # Or extract from trader node
                            elif "trader_investment_plan" in node_state and node_name == "Trader":
                                content = node_state["trader_investment_plan"]
                            
                            if content:
                                payload["content"] = content
                                
                        elif isinstance(node_state, list) and node_state:
                            last_msg = node_state[-1]
                            if hasattr(last_msg, "content") and last_msg.content:
                                payload["content"] = last_msg.content
                            if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                                payload["tool_calls"] = last_msg.tool_calls
                                
                        yield format_sse(payload)
                        await asyncio.sleep(0.01) # Yield control to async loop
                    
            yield format_sse({"type": "done", "message": "Analysis complete!"})
            
        except asyncio.CancelledError:
            # Client disconnected
            print(f"Client disconnected during {ticker} analysis.")
            
    return EventSourceResponse(sse_generator())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
