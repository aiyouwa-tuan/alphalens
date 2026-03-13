import os
import sys
import asyncio

os.chdir("/Users/marobin/Downloads/AlphaLens/backend")
sys.path.append("/Users/marobin/Downloads/AlphaLens/backend")

import dotenv
dotenv.load_dotenv("../.env.local")

# Force set keys so initialization passes
os.environ["OPENAI_API_KEY"] = os.environ.get("OPENAI_API_KEY", "sk-dummy")
os.environ["DEEPSEEK_API_KEY"] = os.environ.get("DEEPSEEK_API_KEY", "sk-dummy")
os.environ["GOOGLE_API_KEY"] = os.environ.get("GOOGLE_API_KEY", "dummy")

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

async def main(provider, model):
    print(f"\n--- Testing {provider} ({model}) ---")
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = provider
    config["deep_think_llm"] = model
    config["quick_think_llm"] = model
    if provider == "deepseek" and model == "deepseek-reasoner":
        config["quick_think_llm"] = "deepseek-chat"
        
    config["max_debate_rounds"] = 1
    config["data_vendors"] = {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance",
    }
    
    try:
        print("Initializing graph...")
        graph = TradingAgentsGraph(debug=True, config=config)
        
        print("Creating initial state...")
        ticker = "MSFT"
        initial_state = graph.propagator.create_initial_state(ticker, "2024-03-10")
        args = graph.propagator.get_graph_args()
        args["stream_mode"] = "updates"
        
        print(f"Running graph with stream_mode={args['stream_mode']}...")
        async for chunk in graph.graph.astream(initial_state, **args):
            for node, state in chunk.items():
                print(f"Node executed: {node}")
                # check if there's any error in the state
                if "messages" in state and hasattr(state["messages"][-1], "content"):
                    pass #print(f"Last message content preview: {state['messages'][-1].content[:50]}...")
            
        print("Graph execution finished successfully.")
        
    except Exception as e:
        import traceback
        print(f"CRASH in {provider}:")
        traceback.print_exc()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main("deepseek", "deepseek-chat"))
    asyncio.run(main("google", "gemini-3-pro-preview"))
