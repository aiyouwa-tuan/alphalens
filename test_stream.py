import sys
import os
import asyncio
from dotenv import load_dotenv

load_dotenv("backend/.env")

if os.environ.get("GEMINI_API_KEY") and not os.environ.get("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = os.environ["GEMINI_API_KEY"]

sys.path.append(os.path.join(os.getcwd(), "backend"))

def test():
    print("Testing locally...")
    from tradingagents.graph.trading_graph import TradingAgentsGraph
    from tradingagents.default_config import DEFAULT_CONFIG
    
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = "google"
    config["deep_think_llm"] = "gemini-3-pro-preview"
    config["quick_think_llm"] = "gemini-3-pro-preview"
    config["max_debate_rounds"] = 1
    
    print("Init Graph...")
    ta = TradingAgentsGraph(debug=True, config=config)
    initial_state = ta.propagator.create_initial_state("AAPL", "2026-03-02")
    args = ta.propagator.get_graph_args()
    args["stream_mode"] = "updates"
    
    print("Streaming...")
    try:
        def run_stream():
            print("Entering run_stream()")
            for chunk in ta.graph.stream(initial_state, **args):
                print("Got a chunk from graph.stream!")
                yield chunk
            print("Finished run_stream()")
        stream_gen = run_stream()
        
        _SENTINEL = object()
        while True:
            print("Waiting for next chunk...")
            chunk = next(stream_gen, _SENTINEL)
            print("Received chunk in loop.")
            if chunk is _SENTINEL:
                break
            
            if getattr(chunk, "keys", None):
                print(f"Chunk yielded: {list(chunk.keys())}")
            else:
                print(f"Chunk yielded: {chunk}")
    except Exception as e:
        print(f"Error: {repr(e)}")
        import traceback
        traceback.print_exc()

print("Starting script...")
test()
print("Done.")
