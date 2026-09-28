#!/usr/bin/env python3
"""Pre-record every Danish narration line the pony game speaks.

Why: the game currently synthesizes each spoken line on the fly against the
remote Edge-TTS voice.  For the longer scene narrations that on-the-fly
request often exceeds its deadline, so the browser silently falls back to its
local default voice -- which is the "robotic" sound the child hears.  By
rendering every *deterministic* line once, with the approved Danish voice, into
the same on-disk MP3 cache the live /api/tts endpoint serves from, each line
becomes a pure cache hit: instant, offline, consistent, "generated once".

The text fed to the synthesizer is byte-for-byte identical to what the React
frontend posts to /api/tts, because we mirror services/narration.js exactly
(buildCurrentSceneNarration + cleanNarrationText).

Usage:
    python3 pregenerate_tts.py            # everything
    python3 pregenerate_tts.py --dry-run  # list lines without hitting TTS
    python3 pregenerate_tts.py --only scenes|intros|ui
"""
import argparse
import asyncio
import hashlib
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import edge_tts

from app.data.themes import THEMAER
from app.data.pixel_assets import get_scene_icon  # noqa: F401  (keeps app import light)
from app.services.text_to_speech import (
    DANISH_VOICE,
    TTS_CACHE_DIR,
)

# Long scene narrations take well past the 5s live deadline; pre-gen is offline,
# so it gets a generous ceiling.  The free Edge service 400s "No audio was
# received" when called too fast, so we pace generously and retry with a pause.
RENDER_TIMEOUT_SECONDS = 30
PACING_SECONDS = 12.0
RETRY = 4

# --------------------------------------------------------------------------
# Mirror of pony-frontend/src/services/narration.js::cleanNarrationText
# --------------------------------------------------------------------------
_EMOJI_BLOCK = re.compile(r"[\u2600-\u27BF\u2B00-\u2BFF]")
_EMOJI_SURROGATE = re.compile(r"[\uD83C-\uDBFF][\uDC00-\uDFFF]")
_VARIATION = re.compile(r"[\uFE0E\uFE0F]")
_WS = re.compile(r"\s+")


def clean_narration_text(text=""):
    out = str(text)
    out = _EMOJI_BLOCK.sub(" ", out)
    out = _EMOJI_SURROGATE.sub(" ", out)
    out = _VARIATION.sub("", out)
    out = _WS.sub(" ", out)
    return out.strip()


def _spoken_options(labels):
    if not labels:
        return ""
    return "Lyt nu til de fire muligheder. " + ". ".join(labels[:-1]) + ". " + labels[-1] + "."


def _question(scene):
    """Mirror buildCurrentSceneNarration's `question` selection."""
    interaction = scene.get("interaction") or {"type": "dice"}
    if interaction.get("type", "dice") == "dice":
        return ((scene.get("voice") or {}).get("question") or {}).get("text", "")
    return interaction.get("prompt") or ((scene.get("voice") or {}).get("question") or {}).get("text", "")


def build_current_scene_narration(scene, after_result):
    """Python port of services/narration.js::buildCurrentSceneNarration."""
    interaction = scene.get("interaction") or {"type": "dice"}
    uses_dice = interaction.get("type", "dice") == "dice"
    options = interaction.get("options") or []
    labels = [f"mulighed {i + 1}: {o['label']}" for i, o in enumerate(options) if o.get("label")]
    spoken_options = _spoken_options(labels)
    question = _question(scene)
    instruction = (
        "Du kan svare med stemmen eller trykke på den store terning."
        if uses_dice
        else "Du kan sige dit valg eller trykke på en af de fire muligheder."
    )
    parts = []
    if after_result:
        parts.append("Nu fortsætter eventyret.")
    if scene.get("tekst"):
        parts.append(scene["tekst"])
    if scene.get("aktion"):
        parts.append("Din opgave er: " + scene["aktion"] + ".")
    if question:
        parts.append(question)
    if spoken_options:
        parts.append(spoken_options)
    if instruction:
        parts.append(instruction)
    return clean_narration_text(" ".join(p for p in parts if p))


# --------------------------------------------------------------------------
# The full deterministic corpus
# --------------------------------------------------------------------------

CONFIGURATOR_LINES = [
    "Vælg din pony type. Tryk på den pony du vil være.",
    "Vælg en farve til din ponys krop.",
    "Vælg en farve til din ponys øjne.",
    "Vælg en manke og en mankefarve til din pony.",
    "Vælg en hale og en halefarve til din pony. Tryk på start eventyr når du er klar.",
    "Vælg en hale og en halefarve til din pony.",
    "Vælg form og farve på hornet.",
    "Vælg form og farve på vingerne. Tryk på start eventyr når du er klar.",
]

UI_LINES = [
    "Velkommen til My Little Pony, Tails of Equestria. "
    "Tryk på den store lyserøde startknap for at vælge et eventyr.",
    "Et lille øjeblik. Spillet gør klar.",
    "Hov, noget gik galt. Tryk på prøv igen, eller gå tilbage til forsiden.",
]


def theme_intro_lines():
    out = []
    for t in THEMAER:
        line = f"{t['titel']}. {t.get('intro', '')}"
        out.append(clean_narration_text(line))
    return out


def theme_select_narrator_line():
    choices = " ".join(f"Mulighed {i + 1}: {t['titel']}." for i, t in enumerate(THEMAER))
    return clean_narration_text(f"Vælg et eventyr. {choices} Tryk på billedet af det eventyr, du vil opleve.")


def scene_narration_lines():
    out = []
    for tema in THEMAER:
        scenes = tema["scener"]
        for i, scene in enumerate(scenes):
            after_result = i > 0  # scene 0 is the opening; the rest follow a result
            out.append(build_current_scene_narration(scene, after_result))
    return out


def collect(only):
    lines = []
    if only in (None, "ui"):
        lines += UI_LINES + CONFIGURATOR_LINES
    if only in (None, "intros"):
        lines += theme_intro_lines() + [theme_select_narrator_line()]
    if only in (None, "scenes"):
        lines += scene_narration_lines()
    # De-dupe preserving order
    seen = set()
    result = []
    for line in lines:
        if line and line not in seen:
            seen.add(line)
            result.append(line)
    return result


def _cache_path(line):
    key = hashlib.sha256(f"{DANISH_VOICE}\0-10%\0{line}".encode("utf-8")).hexdigest()
    return TTS_CACHE_DIR / f"{key}.mp3"


def _render_once(line):
    """Render one line to MP3 in the live cache.

    Bypasses the single-thread live slot (this is an offline batch, so we may
    use the network freely) and retries with a short pause on the free Edge
    service's 400 'No audio was received' rate-limit responses.
    """
    path = _cache_path(line)
    if path.exists() and path.stat().st_size > 200:
        return line, True, "cached"

    async def do():
        audio = bytearray()
        comm = edge_tts.Communicate(line, DANISH_VOICE, rate="-10%", volume="+0%")
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio.extend(chunk["data"])
        return bytes(audio)

    last_err = ""
    for attempt in range(RETRY):
        try:
            audio = asyncio.run(asyncio.wait_for(do(), timeout=RENDER_TIMEOUT_SECONDS))
        except Exception as e:  # noqa: BLE001 - report, retry with a pause
            last_err = str(e)
            if attempt < RETRY - 1:
                time.sleep(PACING_SECONDS * (attempt + 1))
                continue
            return line, False, last_err or "empty audio"
        if audio:
            TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".tmp")
            tmp.write_bytes(audio)
            tmp.replace(path)
            time.sleep(PACING_SECONDS)
            return line, True, "new"
        last_err = "empty audio"
        if attempt < RETRY - 1:
            time.sleep(PACING_SECONDS * (attempt + 1))
    return line, False, last_err


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["ui", "intros", "scenes"], default=None)
    ap.add_argument("--retry", action="store_true", help="Re-render lines that failed last time")
    args = ap.parse_args()

    lines = collect(args.only)
    print(f"Corpus: {len(lines)} unique lines (voice={DANISH_VOICE}, cache={TTS_CACHE_DIR})")

    if args.dry_run:
        for i, line in enumerate(lines):
            print(f"[{i:02d}] {line[:110]}")
        return

    # Only (re)render lines we still need, to keep a full re-run cheap.
    todo = lines
    if args.retry:
        todo = [line for line in lines if not _cache_path(line).exists()]

    done = new = hit = fail = 0
    t0 = time.time()
    for i, line in enumerate(todo, 1):
        _, ok, note = _render_once(line)
        done += 1
        if ok:
            if note == "new":
                new += 1
            else:
                hit += 1
            print(f"[{i:2d}/{len(todo)}] {note:6s} {line[:70]}")
        else:
            fail += 1
            print(f"[{i:2d}/{len(todo)}] FAIL   {line[:70]} -> {note}")
    print(f"Done in {time.time() - t0:.1f}s: {done} attempted -> {new} new, {hit} cached, {fail} failed.")


if __name__ == "__main__":
    main()
