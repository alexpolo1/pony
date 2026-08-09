#!/usr/bin/env python3
"""
Hermes evalueringswrapper — måler tid og kvalitet automatisk.

Brug:
    python3 hermes_eval.py "din prompt her" output.txt

Måler: TTFT, total tid, tok/s, repetitionsloop, output-størrelse.
Logger til hermes_eval_log.jsonl
"""

import subprocess
import sys
import time
import json
import os
import re
from datetime import datetime

HERMES = "/home/alex/.hermes-remote/venv/bin/hermes"
EVAL_LOG = "/home/alex/pony/hermes_eval_log.jsonl"
REPETITION_THRESHOLD = 500  # tegn af samme karakter = loop


def detect_repetition_loop(text: str) -> bool:
    return bool(re.search(r'(.)\1{' + str(REPETITION_THRESHOLD) + r',}', text))


def score_output(text: str, prompt: str) -> dict:
    issues = []
    score = 100

    if detect_repetition_loop(text):
        issues.append("REPETITIONSLOOP")
        score -= 80

    if len(text) < 50:
        issues.append("FOR_KORT_OUTPUT")
        score -= 30

    # Mangler tool call?
    if "execute_code" not in text.lower() and "tool" not in text.lower():
        narrative_words = ["fortæl", "genfortæl", "spil", "beskriv", "narrer"]
        if any(w in prompt.lower() for w in ["kør", "test", "lav", "skriv"]) and \
           not any(w in prompt.lower() for w in narrative_words):
            issues.append("INGEN_TOOL_CALLS")
            score -= 20

    # Dansk?
    danish_words = ["og", "at", "er", "det", "en", "til", "på", "af", "med", "den"]
    danish_count = sum(1 for w in danish_words if f" {w} " in text.lower())
    if danish_count < 3 and len(text) > 200:
        issues.append("IKKE_DANSK")
        score -= 10

    return {"score": max(0, score), "issues": issues}


def run_hermes(prompt: str, output_file: str | None = None, label: str = "") -> dict:
    print(f"\n{'='*60}")
    print(f"  HERMES EVALUERING: {label or prompt[:50]}")
    print(f"  Startet: {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*60}\n", flush=True)

    start = time.time()
    first_token_time = None
    chunks = []

    try:
        proc = subprocess.Popen(
            [HERMES, "-z", prompt],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            cwd="/home/alex/pony",
        )

        while True:
            chunk = proc.stdout.read(64)
            if not chunk:
                break
            if first_token_time is None and chunk.strip():
                first_token_time = time.time()
                ttft = first_token_time - start
                print(f"  [TTFT: {ttft:.1f}s]", flush=True)
            chunks.append(chunk)
            print(chunk, end="", flush=True)

        proc.wait()
        total_time = time.time() - start
        output = "".join(chunks)

    except subprocess.TimeoutExpired:
        proc.kill()
        output = "TIMEOUT"
        total_time = time.time() - start
        ttft = total_time

    ttft = (first_token_time - start) if first_token_time else total_time
    tok_estimate = len(output.split()) * 1.3
    tok_per_sec = tok_estimate / total_time if total_time > 0 else 0

    quality = score_output(output, prompt)

    result = {
        "timestamp": datetime.now().isoformat(),
        "label": label or prompt[:80],
        "ttft_s": round(ttft, 1),
        "total_s": round(total_time, 1),
        "output_bytes": len(output),
        "tok_per_sec_est": round(tok_per_sec, 1),
        "quality_score": quality["score"],
        "issues": quality["issues"],
    }

    print(f"\n{'─'*60}")
    print(f"  ⏱  TTFT:        {result['ttft_s']}s")
    print(f"  ⏱  Total tid:   {result['total_s']}s")
    print(f"  📊 Output:      {result['output_bytes']} bytes")
    print(f"  🚀 Tok/s (est): {result['tok_per_sec_est']}")
    print(f"  ✅ Kvalitet:    {result['quality_score']}/100")
    if result["issues"]:
        print(f"  ⚠️  Problemer:   {', '.join(result['issues'])}")
    print(f"{'─'*60}\n", flush=True)

    with open(EVAL_LOG, "a") as f:
        f.write(json.dumps(result, ensure_ascii=False) + "\n")

    if output_file:
        with open(output_file, "w") as f:
            f.write(output)

    return result


def show_summary():
    if not os.path.exists(EVAL_LOG):
        print("Ingen evalueringslog endnu.")
        return
    entries = []
    with open(EVAL_LOG) as f:
        for line in f:
            try:
                entries.append(json.loads(line))
            except Exception:
                pass

    print(f"\n{'='*60}")
    print(f"  HERMES EVALUERINGSSAMMENFATNING ({len(entries)} kørsler)")
    print(f"{'='*60}")
    if not entries:
        print("  Ingen data.")
        return

    avg_ttft = sum(e["ttft_s"] for e in entries) / len(entries)
    avg_total = sum(e["total_s"] for e in entries) / len(entries)
    avg_quality = sum(e["quality_score"] for e in entries) / len(entries)
    loops = sum(1 for e in entries if "REPETITIONSLOOP" in e.get("issues", []))

    print(f"  Gns. TTFT:      {avg_ttft:.1f}s")
    print(f"  Gns. total tid: {avg_total:.1f}s")
    print(f"  Gns. kvalitet:  {avg_quality:.0f}/100")
    print(f"  Repetitionsloop:{loops}/{len(entries)}")
    print(f"\n  Seneste 5 kørsler:")
    for e in entries[-5:]:
        flag = "⚠️" if e["issues"] else "✅"
        print(f"  {flag} [{e['timestamp'][11:16]}] {e['label'][:40]:40s} "
              f"TTFT:{e['ttft_s']}s tot:{e['total_s']}s Q:{e['quality_score']}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_summary()
    elif sys.argv[1] == "summary":
        show_summary()
    else:
        prompt = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        label = sys.argv[3] if len(sys.argv) > 3 else ""
        run_hermes(prompt, output_file, label)
