import os
import sys

# Change to backend directory
os.chdir("/Users/marobin/Downloads/AlphaLens/backend")
sys.path.append("/Users/marobin/Downloads/AlphaLens/backend")

import dotenv
dotenv.load_dotenv("../.env.local")

# DeepSeek settings simulate
os.environ["DEEPSEEK_API_KEY"] = "sk-dummy"

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

try:
    print("Initializing test configuration...")
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = "deepseek"
    config["deep_think_llm"] = "deepseek-reasoner"
    config["quick_think_llm"] = "deepseek-chat"
    config["max_debate_rounds"] = 1
    
    print("Calling TradingAgentsGraph init...")
    graph = TradingAgentsGraph(debug=True, config=config)
    print("Graph init success!")
    
except Exception as e:
    import traceback
    print("Crash Traceback:")
    traceback.print_exc()
