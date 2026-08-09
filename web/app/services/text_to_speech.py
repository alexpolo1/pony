"""Consistent Danish text-to-speech for every client browser."""

import asyncio
from functools import lru_cache

import edge_tts


DANISH_VOICE = "da-DK-ChristelNeural"


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
    try:
        return asyncio.run(_synthesize(text))
    except TextToSpeechError:
        raise
    except Exception as exc:
        raise TextToSpeechError("Kunne ikke generere dansk tale") from exc
