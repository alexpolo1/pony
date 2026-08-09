#!/usr/bin/env python3
"""
Evaluator for hermes-autoresearch: runs exhaustive evaluation and returns win rate as score.
Lower deviation from 50% = better score.
"""
import os
import sys
import json
import subprocess

repo = os.environ.get("AR_REPO_PATH", "/home/alex/pony")

# Run exhaustive evaluation and capture output
result = subprocess.run(
    ["python3", "evaluate_game.py", "--exhaustive"],
    cwd=repo + "/web",
    capture_output=True,
    text=True,
    timeout=120,
)

output = result.stdout
# Parse win rate from output: "Sejr:      16 (50%)"
import re
match = re.search(r'Sejr:\s+\d+\s+\((\d+)%\)', output)
if not match:
    # Fallback: try to find win rate in other format
    match = re.search(r'win_rate["\s:]+([\d.]+)', output)

if match:
    win_rate = float(match.group(1))
    # Score: 100 - abs deviation from 50%. Closer to 50% = higher score.
    score = 100 - abs(win_rate - 50)
else:
    score = 0.0
    win_rate = 0

print(json.dumps({
    "score": score,
    "accepted": True,
    "reason": f"win_rate={win_rate}%, deviation={abs(win_rate-50):.0f}pp from 50%",
    "metrics": {"win_rate": win_rate, "score": score},
}))