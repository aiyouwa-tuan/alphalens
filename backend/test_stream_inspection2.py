from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "google"
config["deep_think_llm"] = "gemini-3-pro-preview"
config["quick_think_llm"] = "gemini-3-pro-preview"
config["max_debate_rounds"] = 1

ta = TradingAgentsGraph(debug=True, config=config)
init_agent_state = ta.propagator.create_initial_state("NVDA", "2026-02-27")
args = ta.propagator.get_graph_args()

for index, chunk in enumerate(ta.graph.stream(init_agent_state, **args)):
    for node_name, node_state in chunk.items():
        print(f"\n--- Node: {node_name} ---")
        if isinstance(node_state, dict):
            print(f"Keys: {list(node_state.keys())}")
            
            # Check for investment_debate_state
            if "investment_debate_state" in node_state:
                print(f"Investment debate - current_response: {node_state['investment_debate_state'].get('current_response', '')[:50]}...")
            
            # Check for risk_debate_state
            if "risk_debate_state" in node_state:
                count = node_state['risk_debate_state'].get('count')
                speaker = node_state['risk_debate_state'].get('latest_speaker')
                print(f"Risk debate - count: {count}, speaker: {speaker}")
                if speaker == "Aggressive":
                    print(f"Content: {node_state['risk_debate_state'].get('current_aggressive_response', '')[:50]}...")
                elif speaker == "Conservative":
                    print(f"Content: {node_state['risk_debate_state'].get('current_conservative_response', '')[:50]}...")
                elif speaker == "Neutral":
                    print(f"Content: {node_state['risk_debate_state'].get('current_neutral_response', '')[:50]}...")
                elif speaker == "Judge":
                    print(f"Content: {node_state['risk_debate_state'].get('judge_decision', '')[:50]}...")
        break
    if index > 20: 
        break
