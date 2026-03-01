import asyncio
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

async def test():
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = "google"
    config["deep_think_llm"] = "gemini-3-pro-preview"
    config["quick_think_llm"] = "gemini-3-pro-preview"
    config["max_debate_rounds"] = 1
    
    ta = TradingAgentsGraph(debug=True, config=config)
    init_agent_state = ta.propagator.create_initial_state("NVDA", "2026-02-27")
    args = ta.propagator.get_graph_args()
    
    for chunk in ta.graph.stream(init_agent_state, **args):
        for node_name, node_state in chunk.items():
            print(f"\n--- Node: {node_name} ---")
            if isinstance(node_state, dict):
                print(f"Keys: {list(node_state.keys())}")
                if "risk_debate_state" in node_state:
                    print(f"Has risk_debate_state: count={node_state['risk_debate_state'].get('count')}")
                if "messages" in node_state:
                    print(f"Has {len(node_state['messages'])} messages")
            break # Just print the first one or two chunks to see the structure

if __name__ == "__main__":
    asyncio.run(test())
