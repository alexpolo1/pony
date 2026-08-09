#!/bin/bash
set -e
cd /home/alex/pony
git checkout -- . 2>/dev/null || true
git clean -fd 2>/dev/null || true
/tmp/hermes-autoresearch/.venv/bin/python -m hermes_autoresearch.cli --config .hermes/autoresearch_config.json 2>&1
git add -A 2>/dev/null || true
git commit -m "autoresearch $(date +%Y%m%d_%H%M)" 2>/dev/null || true
git push origin master 2>/dev/null || true
echo "Done"