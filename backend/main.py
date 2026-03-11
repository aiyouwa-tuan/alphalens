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
import requests

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

# In-memory IP usage tracker backed by file for serverless deployments
USAGE_FILE = "/tmp/alphalens_usage.json"
DAILY_LIMIT = 3

def load_usage():
    if os.path.exists(USAGE_FILE):
        try:
            with open(USAGE_FILE, 'r') as f:
                data = json.load(f)
            # Use defaultdict to handle IPs not in the loaded data
            usage_dict = defaultdict(lambda: {"date": "", "count": 0})
            usage_dict.update(data)
            return usage_dict
        except Exception as e:
            print(f"Error loading usage: {e}")
    return defaultdict(lambda: {"date": "", "count": 0})

def save_usage(usage_dict):
    try:
        with open(USAGE_FILE, 'w') as f:
            json.dump(dict(usage_dict), f)
    except Exception as e:
        print(f"Error saving usage: {e}")

IP_ANALYSIS_USAGE = load_usage()
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
    allow_origin_regex=r"https://.*\.vercel\.app",
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
    admin_token: str = ""    # set by server-side Next.js proxy for admin sessions

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
        save_usage(IP_ANALYSIS_USAGE)
        
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

    # Admin token bypass: if the request carries a valid admin token, skip all IP rate-limiting
    ADMIN_SECRET_TOKEN = os.environ.get("ADMIN_SECRET_TOKEN", "alphalens-admin-secret-2026")
    is_admin = bool(body.admin_token and body.admin_token == ADMIN_SECRET_TOKEN)

    if not is_admin:
        usage = IP_ANALYSIS_USAGE[ip]

        # Reset limit if new day
        if usage["date"] != current_date:
            usage["date"] = current_date
            usage["count"] = 0
            save_usage(IP_ANALYSIS_USAGE)

        if usage["count"] >= DAILY_LIMIT:
            print(f"Rate limit exceeded for IP: {ip}. Used: {usage['count']}")
            return {"error": f"今日上限 {DAILY_LIMIT} 次已用完，请明天再来。"}

        usage["count"] += 1
        save_usage(IP_ANALYSIS_USAGE)
        print(f"IP {ip} used analysis {usage['count']} of {DAILY_LIMIT} for {current_date}")
    else:
        print(f"Admin request from IP {ip} – rate limit bypassed")

    raw_ticker = body.ticker.strip()
    ticker = raw_ticker.upper()

    # A-share auto-suffix: 6-digit code without exchange suffix
    # Shanghai: 6xxxxx, 9xxxxx → .SS   Shenzhen: 0xxxxx, 1xxxxx, 2xxxxx, 3xxxxx → .SZ
    import re as _re
    if _re.match(r'^\d{6}$', ticker):
        if ticker[0] in ('6', '9'):
            ticker = ticker + '.SS'
        elif ticker[0] in ('0', '1', '2', '3'):
            ticker = ticker + '.SZ'

    # Reject Chinese-character tickers (search failed to resolve)
    if _re.search(r'[\u4e00-\u9fa5]', ticker):
        return {"error": "无法识别股票代码，请输入股票代码（如：300750）或英文名称。"}

    current_graph_date = datetime.now().strftime("%Y-%m-%d")

    # Configure AlphaLens / TradingAgents
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = body.provider
    config["deep_think_llm"] = body.model
    # CRITICAL: quick_think_llm is used by ALL analyst nodes, Bull/Bear debate, and Trader.
    # Reasoning models (DeepSeek-R1, Gemini 3 Pro) are extremely slow (10-20 min per call).
    # Only deep_think_llm (Research Manager + Risk Judge) should use the heavy reasoning model.
    # All other nodes must use the fastest available model for the given provider.
    provider = body.provider.lower()
    if provider == "deepseek":
        # deepseek-chat (V3) is fast and supports tool calling; R1 does not
        config["quick_think_llm"] = "deepseek-chat"
    elif provider == "google":
        # Google: We use the selected model. The prompt length in analysts dictates the speed.
        config["quick_think_llm"] = body.model
    elif provider == "openai":
        # o1/o3 are reasoning models; fall back to gpt-4o for quick tasks
        if body.model.startswith("o1") or body.model.startswith("o3"):
            config["quick_think_llm"] = "gpt-4o"
        else:
            config["quick_think_llm"] = body.model
    else:
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
        elif body.provider == "deepseek":
            os.environ["DEEPSEEK_API_KEY"] = body.api_key

    # Generate unique task ID
    task_id = str(uuid.uuid4())
    
    # Initialize task storage
    ACTIVE_TASKS[task_id] = {
        "events": [], # Store history for reconnections
        "queues": [], # List of client queues waiting for live updates
        "status": "running",
        "task": None  # Will be set once asyncio task is created
    }
    
    # Push an event immediately
    def _push_event(event_dict):
        formatted = format_sse(event_dict)
        ACTIVE_TASKS[task_id]["events"].append(formatted)
        for q in ACTIVE_TASKS[task_id]["queues"]:
            q.put_nowait(formatted)

    _push_event({"type": "status", "message": f"Initializing AI Agents to analyze {ticker}..."})

    # Global task timeout in seconds (30 minutes for slow reasoner models)
    TASK_TIMEOUT = 1800

    # Background executor function
    async def graph_executor():
        try:
            await asyncio.wait_for(_run_graph(), timeout=TASK_TIMEOUT)
        except asyncio.TimeoutError:
            _push_event({"type": "error", "message": f"分析超时（超过 {TASK_TIMEOUT // 60} 分钟），请重试。"})
            ACTIVE_TASKS[task_id]["status"] = "error"
        except asyncio.CancelledError:
            pass
        finally:
            for q in ACTIVE_TASKS.get(task_id, {}).get("queues", []):
                q.put_nowait(None)
            ACTIVE_TASKS.get(task_id, {})["queues"] = []

    async def _run_graph():
        try:
            from langchain_core.callbacks import AsyncCallbackHandler
            
            class StreamingCallbackHandler(AsyncCallbackHandler):
                async def on_llm_new_token(self, token: str, **kwargs) -> None:
                    # Check if user pressed Stop — immediately abort mid-generation
                    if ACTIVE_TASKS.get(task_id, {}).get("status") == "canceled":
                        raise asyncio.CancelledError("User requested stop")
                    # Push every generation token to the SSE queue immediately
                    _push_event({"type": "token", "content": token})

            # 1. Initialize Graph synchronously in a background thread to prevent blocking FastAPI async loop
            def _init_graph():
                # We instantiate the callback here and pass it
                stream_handler = StreamingCallbackHandler()
                graph = TradingAgentsGraph(debug=True, config=config, callbacks=[stream_handler])
                initial_state = graph.propagator.create_initial_state(ticker, current_graph_date)
                g_args = graph.propagator.get_graph_args()
                return graph, initial_state, g_args
                
            ta, init_agent_state, args = await asyncio.to_thread(_init_graph)
            
            _push_event({"type": "status", "message": f"Starting analysis for {ticker}..."})
            
            args["stream_mode"] = "updates"
            
            # Dictionary to accumulate final reports for Supabase
            final_data = {
                "id": task_id,
                "ticker": ticker,
                "status": "completed",
                "ip_address": ip,
                "start_time": datetime.now(timezone.utc).isoformat(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "market_report": None,
                "fundamentals_report": None,
                "sentiment_report": None,
                "technical_report": None,
                "external_news": None,
                "markdown": None
            }

            # Loop runs asynchronously
            async for chunk in ta.graph.astream(init_agent_state, **args):
                # Check for cancellation
                if ACTIVE_TASKS[task_id].get("status") == "canceled":
                    raise asyncio.CancelledError()
                    
                if getattr(chunk, "get", None):
                    for node_name, node_state in chunk.items():
                         payload = {"type": "update", "node": node_name}
                         
                         if isinstance(node_state, dict):
                             for key in ["market_report", "sentiment_report", "news_report", "fundamentals_report", "technical_report", "investment_plan", "final_trade_decision"]:
                                 if key in node_state and node_state[key]:
                                     payload[key] = node_state[key]
                                     # Cache for DB
                                     if key == "market_report": final_data["market_report"] = node_state[key]
                                     elif key == "sentiment_report": final_data["sentiment_report"] = node_state[key]
                                     elif key == "news_report": final_data["external_news"] = node_state[key]
                                     elif key == "fundamentals_report": final_data["fundamentals_report"] = node_state[key]
                                     elif key == "technical_report": final_data["technical_report"] = node_state[key]
                                     elif key == "final_trade_decision": final_data["markdown"] = node_state[key]
                             
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
            final_data["end_time"] = datetime.now(timezone.utc).isoformat()
            
            # Save to Supabase using pure Python requests
            def _save_to_supabase():
                supabase_url = os.environ.get("SUPABASE_URL")
                supabase_key = os.environ.get("SUPABASE_KEY")
                if supabase_url and supabase_key:
                    headers = {
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/json",
                        "Prefer": "return=minimal"
                    }
                    endpoint = f"{supabase_url}/rest/v1/analysis_history"
                    try:
                        res = requests.post(endpoint, headers=headers, json=final_data, timeout=10)
                        res.raise_for_status()
                        print(f"✅ Successfully saved task {task_id} to Supabase database.")
                    except Exception as e:
                        print(f"❌ Failed to save to Supabase: {e}")
                else:
                    print("⚠️ SUPABASE_URL or SUPABASE_KEY is missing from environment variables, skipping DB persistence.")
                    
            await asyncio.to_thread(_save_to_supabase)
            
        except asyncio.CancelledError:
             print(f"Task {task_id} canceled.")
             if ACTIVE_TASKS[task_id].get("status") == "canceled":
                 _push_event({"type": "error", "message": "Analysis stopped by user."})
             # Exit cleanly without re-raising so the LLM socket closes gracefully
             return
        except Exception as e:
             _push_event({"type": "error", "message": f"Fatal error: {str(e)}"})
             ACTIVE_TASKS[task_id]["status"] = "error"

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
                try:
                    # Wait up to 15 seconds for a real event
                    event = await asyncio.wait_for(client_queue.get(), timeout=15.0)
                    if event is None: # Sentinel value meaning task finished
                        break
                    yield event
                except asyncio.TimeoutError:
                    # Send a keep-alive status event to prevent Render from dropping idle connections waiting on deep reasoning
                    yield format_sse({"type": "status", "message": "深度思考中，请耐心等待..."})
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
