#!/usr/bin/env python3
"""
Proposal wrapper for hermes-autoresearch: calls `hermes chat -q` with the trial contract.
The harness sets AR_TRIAL, AR_REPO_PATH, AR_PREVIOUS_SCORE.
"""
import os
import sys
import json
import subprocess
import textwrap

trial = os.environ.get("AR_TRIAL", "0")
repo = os.environ.get("AR_REPO_PATH", "/home/alex/pony")
prev_score = os.environ.get("AR_PREVIOUS_SCORE", "")

# Build the prompt
prompt = textwrap.dedent(f"""\
You are a game balance engineer for My Little Pony TTRPG.

## Trial {trial}
Previous best score (win rate %): {prev_score or "none"}

## Objective
{sys.argv[1] if len(sys.argv) > 1 else "Improve game balance"}

## Rules
- Edit ONLY /home/alex/pony/web/app/data/themes.py (or dice.py, pony.py)
- Change ONE scene per trial: adjust 'svaer' (let/normal/svaert) or 'stat' (krop/sind/charme)
- Do NOT commit or push — leave changes unstaged
- Goal: overall win rate closer to 50% (target 40-60%)
- Exit 0 on success, exit 1 if blocked

## Context
- 8 themes, 5 scenes each, 4 pony types
- Scenes use dice (svaer field) or non-dice (always pass with correct answer)
- Only dice scenes affect win/loss
- 'let' = easy (target 1-2), 'normal' = medium (target 3-4), 'svaert' = hard (target 5-6)
""")

# Run hermes chat -q with the prompt
agent_cmd = ["hermes", "chat", "-q"]
result = subprocess.run(agent_cmd + [prompt], capture_output=True, text=True, timeout=300)
sys.exit(result.returncode)