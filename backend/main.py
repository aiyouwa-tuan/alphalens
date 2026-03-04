import os
import json
import asyncio
import uuid
from datetime import datetime, timezone
import pytz
from collections import defaultdict
from pydantic import BaseModel
from fastapi import FastAPI, Request, HTTPException
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

# In-memory Task tracking for reconnectable background jobs
# Structure: { "task_id": { "task": asyncio.Task, "events": list, "status": "running"|"completed"|"error", "queues": list_of_asyncio_Queues } }
ACTIVE_TASKS = {}

# In-memory IP usage tracker
# Structure: { ip: { "date": "2024-03-04", "count": 2 } }
IP_ANALYSIS_USAGE = defaultdict(lambda: {"date": "", "count": 0})
DAILY_LIMIT = 3
BEIJING_TZ = pytz.timezone('Asia/Shanghai')

def get_beijing_date_str():
    now_utc = datetime.now(timezone.utc)
    return now_utc.astimezone(BEIJING_TZ).strftime("%Y-%m-%d")

def get_client_ip(request: Request) -> str:
    # First check x-forwarded-for which Vercel/Render might set
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"

app = FastAPI(title="TradingAgents API")

# Adjust CORS for Render & Next.js compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://www.neurynx.com",
        "https://neurynx.com",
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

class StopRequest(BaseModel):
    task_id: str

def format_sse(data: dict) -> dict:
    """Format dictionary into SSE standard payload."""
    return {"data": json.dumps(data)}

@app.get("/api/debate/limit")
async def get_remaining_limit(request: Request):
    """Returns the remaining analysis limit for the current IP."""
    ip = get_client_ip(request)
    current_date = get_beijing_date_str()
    usage = IP_ANALYSIS_USAGE[ip]
    
    if usage["date"] != current_date:
        usage["date"] = current_date
        usage["count"] = 0
        
    remaining = max(0, DAILY_LIMIT - usage["count"])
    return {"ip": ip, "used": usage["count"], "remaining": remaining, "limit": DAILY_LIMIT}

@app.post("/api/debate/start")
async def start_debate(request: Request, body: DebateRequest):
    """
    Starts the TradingAgents workflow in the background and returns a task_id immediately.
    Clients can then connect to /stream/{task_id} to receive updates.
    """
    ip = get_client_ip(request)
    current_date = get_beijing_date_str()
    usage = IP_ANALYSIS_USAGE[ip]
    
    # Reset limit if new day
    if usage["date"] != current_date:
        usage["date"] = current_date
        usage["count"] = 0
        
    if usage["count"] >= DAILY_LIMIT:
        print(f"Rate limit exceeded for IP: {ip}. Used: {usage['count']}")
        return {"error": f"今日上限 {DAILY_LIMIT} 次已用完，请明天再来。"}

    # Increment usage count
    usage["count"] += 1
    print(f"IP {ip} used analysis {usage['count']} of {DAILY_LIMIT} for {current_date}")

    ticker = body.ticker.upper()
    current_graph_date = datetime.now().strftime("%Y-%m-%d")

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

    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Initialize task storage
    ACTIVE_TASKS[task_id] = {
        "events": [], # Store history for reconnections
        "queues": [], # List of client queues waiting for live updates
        "status": "running"
    }
    
    # Push an event immediately
    def _push_event(event_dict):
        formatted = format_sse(event_dict)
        ACTIVE_TASKS[task_id]["events"].append(formatted)
        for q in ACTIVE_TASKS[task_id]["queues"]:
            q.put_nowait(formatted)

    _push_event({"type": "status", "message": f"Initializing AI Agents to analyze {ticker}..."})

    # Background executor function
    async def graph_executor():
        try:
            # 1. Initialize Graph synchronously in a background thread to prevent blocking FastAPI async loop
            def _init_graph():
                graph = TradingAgentsGraph(debug=True, config=config)
                initial_state = graph.propagator.create_initial_state(ticker, current_graph_date)
                g_args = graph.propagator.get_graph_args()
                return graph, initial_state, g_args
                
            ta, init_agent_state, args = await asyncio.to_thread(_init_graph)
            
            _push_event({"type": "status", "message": f"Starting analysis for {ticker}..."})
            
            args["stream_mode"] = "updates"
            
            # Loop runs asynchronously
            async for chunk in ta.graph.astream(init_agent_state, **args):
                # Check for cancellation
                if ACTIVE_TASKS[task_id].get("status") == "canceled":
                    raise asyncio.CancelledError()
                    
                if getattr(chunk, "get", None):
                    for node_name, node_state in chunk.items():
                         payload = {"type": "update", "node": node_name}
                         
                         if isinstance(node_state, dict):
                             for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report", "investment_plan", "final_trade_decision"]:
                                 if key in node_state and node_state[key]:
                                     payload[key] = node_state[key]
                             
                             content = None
                             if "messages" in node_state and node_state["messages"]:
                                 last_msg = node_state["messages"][-1]
                                 if hasattr(last_msg, "content") and last_msg.content:
                                     content = last_msg.content
                                 if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                                     payload["tool_calls"] = last_msg.tool_calls
                             elif "investment_debate_state" in node_state:
                                 deb_state = node_state["investment_debate_state"]
                                 if node_name == "Research Manager" and "judge_decision" in deb_state:
                                     content = deb_state["judge_decision"]
                                 elif "current_response" in deb_state:
                                     content = deb_state["current_response"]
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
                                 
                         _push_event(payload)
                await asyncio.sleep(0.01)
                
            _push_event({"type": "done", "message": "Analysis complete!"})
            ACTIVE_TASKS[task_id]["status"] = "completed"
            
        except asyncio.CancelledError:
             print(f"Task {task_id} canceled.")
             _push_event({"type": "error", "message": "Analysis stopped by user."})
             ACTIVE_TASKS[task_id]["status"] = "canceled"
        except Exception as e:
             _push_event({"type": "error", "message": f"Fatal error: {str(e)}"})
             ACTIVE_TASKS[task_id]["status"] = "error"
             
        finally:
             # Free up queues and set sentinel values to unblock waiting clients
             for q in ACTIVE_TASKS.get(task_id, {}).get("queues", []):
                 q.put_nowait(None)
             ACTIVE_TASKS.get(task_id, {})["queues"] = []
    
    # Launch in background
    task = asyncio.create_task(graph_executor())
    ACTIVE_TASKS[task_id]["task"] = task
    
    return {"task_id": task_id}

@app.get("/api/debate/stream/{task_id}")
async def debate_stream(task_id: str):
    """
    Reconnectable SSE endpoint. Flushes past event history then tails live events.
    """
    if task_id not in ACTIVE_TASKS:
        async def err_gen():
            yield format_sse({"type": "error", "message": "Task not found"})
        return EventSourceResponse(err_gen())

    task_data = ACTIVE_TASKS[task_id]
    
    async def sse_generator():
        # First yield all historical events associated with this task
        for event in task_data["events"]:
            yield event
            
        # If task is already done/error/canceled, simply exit stream
        if task_data["status"] != "running":
            return
            
        # If still running, subscribe to the queue to get delta pushes
        client_queue = asyncio.Queue()
        task_data["queues"].append(client_queue)
        try:
            while True:
                # Wait for next live event pushed by graph_executor
                event = await client_queue.get()
                if event is None: # Sentinel value meaning task finished
                    break
                yield event
        except asyncio.CancelledError:
            # The client closed the connection (page refresh, unmount)
            # Safe disconnection. The background task keeps running!
            print(f"Client disconnected from stream for task {task_id}")
        finally:
            # Clean up queue
            if client_queue in task_data["queues"]:
                task_data["queues"].remove(client_queue)
                
    return EventSourceResponse(sse_generator())

@app.post("/api/debate/stop")
async def stop_debate(body: StopRequest):
    """
    Strongly terminates an active background analysis task.
    """
    task_id = body.task_id
    if task_id in ACTIVE_TASKS:
        task_data = ACTIVE_TASKS[task_id]
        if task_data["status"] == "running":
            task_data["status"] = "canceled"
            task_data["task"].cancel() # Cancel the actual Python thread
            return {"status": "success", "message": "Task canceled"}
    return {"status": "error", "message": "Task not active or not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
