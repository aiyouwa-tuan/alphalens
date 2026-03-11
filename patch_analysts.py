import glob, os

files = glob.glob("backend/tradingagents/agents/analysts/*.py")
constraint = "\\n\\nCRITICAL INSTRUCTION: You are strictly limited to 1 or 2 tool calls! Fetch everything you need simultaneously using parallel tool calls. Once you receive data from tools, YOU MUST STOP CALLING TOOLS and immediately generate your final comprehensive report in Chinese!"

for f in files:
    with open(f, "r") as file:
        content = file.read()
    
    if "CRITICAL INSTRUCTION: You are strictly limited to 1 or 2 tool calls!" not in content:
        # We append to the last line of the system_message definition
        content = content.replace(
            'in the report, organized and easy to read."\n        )',
            f'in the report, organized and easy to read."\n            + "{constraint}"\n        )'
        )
        content = content.replace(
            'write out all the information inside your final report."\n        )',
            f'write out all the information inside your final report."\n            + "{constraint}"\n        )'
        )
        content = content.replace(
            'key points in the report."\n        )',
            f'key points in the report."\n            + "{constraint}"\n        )'
        )
        with open(f, "w") as file:
            file.write(content)
print("Done patching analysts.")
