#!/usr/bin/env bash
cd /home/alex/pony/web || exit 0
pkill -f '[p]regenerate_tts.py' 2>/dev/null
sleep 1
: > /tmp/pregenerate.log
setsid nohup env PYTHONUNBUFFERED=1 ./.venv/bin/python -u pregenerate_tts.py --retry >> /tmp/pregenerate.log 2>&1 < /dev/null &
exit 0

