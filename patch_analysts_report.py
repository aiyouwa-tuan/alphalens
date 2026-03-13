import glob, os

files = glob.glob("backend/tradingagents/agents/analysts/*.py")

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    if "tool_iterations =" not in content:
        # Replace the `if len(result.tool_calls) == 0:` block with a more robust one
        old_block = """        if len(result.tool_calls) == 0:
            report = result.content"""
            
        new_block = """        tool_iterations = sum(1 for m in state["messages"] if hasattr(m, "tool_calls") and m.tool_calls)
        
        if len(result.tool_calls) == 0:
            report = result.content
        elif tool_iterations >= 2:
            # Emergency fallback: If it insists on calling tools at the iteration limit, we force text out.
            report = result.content if result.content else "该分析师获取数据完成，未能生成详细的文字总结，但已将数据传递给下游。" """
            
        content = content.replace(old_block, new_block)
        with open(f, "w") as file:
            file.write(content)
print("Done patching analyst reports.")
