"""Consistent Danish text-to-speech for every client browser."""

import asyncio
from functools import lru_cache
import hashlib
import os
from pathlib import Path
import threading

import edge_tts


DANISH_VOICE = "da-DK-ChristelNeural"
TTS_TIMEOUT_SECONDS = 5
TTS_CACHE_DIR = Path(
    os.getenv("PONY_TTS_CACHE_DIR", Path(__file__).resolve().parents[2] / "instance" / "tts_cache")
)

# Waitress has only a small worker pool.  Edge TTS is a remote service, so a
# temporary outage must not be allowed to occupy every worker and freeze the
# game API.  One synthesis is enough in normal play; successful MP3s are then
# served from the cache below.
_synthesis_slot = threading.BoundedSemaphore(1)


class TextToSpeechError(RuntimeError):
    """Raised when the remote speech engine cannot synthesize audio."""


async def _synthesize(text):
    audio = bytearray()
    communicator = edge_tts.Communicate(text, DANISH_VOICE, rate="-10%")
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise TextToSpeechError("Talegeneratoren returnerede ingen lyd")
    return bytes(audio)


@lru_cache(maxsize=256)
def synthesize_danish(text):
    """Return an MP3 spoken by the fixed Danish female voice Christel."""
    cache_key = hashlib.sha256(
        f"{DANISH_VOICE}\0-10%\0{text}".encode("utf-8")
    ).hexdigest()
    cache_file = TTS_CACHE_DIR / f"{cache_key}.mp3"
    try:
        cached = cache_file.read_bytes()
        if cached:
            return cached
    except OSError:
        pass

    if not _synthesis_slot.acquire(blocking=False):
        raise TextToSpeechError("Talegeneratoren er optaget")
    try:
        audio = asyncio.run(asyncio.wait_for(_synthesize(text), timeout=TTS_TIMEOUT_SECONDS))
        try:
            TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
            temporary_file = cache_file.with_suffix(".tmp")
            temporary_file.write_bytes(audio)
            temporary_file.replace(cache_file)
        except OSError:
            # The memory cache still makes this request useful when disk storage
            # is temporarily unavailable.
            pass
        return audio
    except TimeoutError as exc:
        raise TextToSpeechError("Talegeneratoren svarede ikke i tide") from exc
    except TextToSpeechError:
        raise
    except Exception as exc:
        raise TextToSpeechError("Kunne ikke generere dansk tale") from exc
    finally:
        _synthesis_slot.release()
