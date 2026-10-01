"""Consistent Danish text-to-speech for every client browser.

Primary voice is Microsoft Edge TTS (Christel).  Edge TTS is a *remote*
service and occasionally goes down ("our services aren't available right
now"), so we keep a fully offline fallback: the Piper TTS engine (voice
`da_DK-talesyntese-medium`), bundled in the venv.  When Edge cannot synthesize
we speak the same text with Piper instead, so the child always hears a voice.

The two engines return different formats (Edge -> MP3, Piper -> WAV), so
`synthesize_danish` returns a small `TTSResult` carrying the bytes *and* the
content-type; the Flask route serves that type.
"""

import asyncio
from dataclasses import dataclass
from functools import lru_cache
import hashlib
import os
import wave
from io import BytesIO
from pathlib import Path
import threading

import edge_tts

DANISH_VOICE = "da-DK-ChristelNeural"
TTS_TIMEOUT_SECONDS = 5
TTS_CACHE_DIR = Path(
    os.getenv("PONY_TTS_CACHE_DIR", Path(__file__).resolve().parents[2] / "instance" / "tts_cache")
)

# Piper is our offline fallback.  The model + config are loaded once and reused
# (loading the 61MB onnx every request would be far too slow).
PIPER_VOICE = os.getenv("PONY_PIPER_VOICE", "da_DK-talesyntese-medium")
PIPER_DIR = Path(os.getenv("PONY_PIPER_DIR", TTS_CACHE_DIR.parent / "piper"))
PIPER_MODEL = PIPER_DIR / f"{PIPER_VOICE}.onnx"
PIPER_CONFIG = PIPER_DIR / f"{PIPER_VOICE}.onnx.json"

# Waitress has only a small worker pool.  One synthesis is enough in normal
# play; successful audio is cached below.  The same single slot guards both the
# remote Edge call and the (slower) local Piper synthesis so a worker is never
# held in both at once.
_synthesis_slot = threading.BoundedSemaphore(1)

_piper_lock = threading.Lock()
_piper_voice = None
_piper_failed = False


def _get_piper():
    """Lazily load the shared Piper voice (or None if unavailable)."""
    global _piper_voice, _piper_failed
    with _piper_lock:
        if _piper_voice is not None or _piper_failed:
            return _piper_voice
        try:
            if not (PIPER_MODEL.exists() and PIPER_CONFIG.exists()):
                _piper_failed = True
                return None
            from piper import PiperVoice
            _piper_voice = PiperVoice.load(str(PIPER_MODEL), config_path=str(PIPER_CONFIG))
            return _piper_voice
        except Exception:
            _piper_failed = True
            return None


class TextToSpeechError(RuntimeError):
    """Raised when neither speech engine can produce audio."""


@dataclass
class TTSResult:
    """Audio bytes plus the content-type to serve them as."""
    audio: bytes
    mimetype: str


async def _synthesize_edge(text):
    """Microsoft Edge TTS -> MP3.  Raises TextToSpeechError on any failure."""
    audio = bytearray()
    communicator = edge_tts.Communicate(text, DANISH_VOICE, rate="-10%")
    async for chunk in communicator.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise TextToSpeechError("Talegeneratoren returnerede ingen lyd")
    return TTSResult(bytes(audio), "audio/mpeg")


def _synthesize_piper(text):
    """Offline Piper fallback -> WAV.  Returns None if Piper is unavailable."""
    voice = _get_piper()
    if voice is None:
        return None
    buffer = BytesIO()
    with wave.open(buffer, "wb") as wav:
        voice.synthesize_wav(text, wav)  # Piper sets rate/width/channels + writes frames
    data = buffer.getvalue()
    if not data:
        return None
    return TTSResult(data, "audio/wav")


def _cache(tag, text, audio, ext):
    try:
        TTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_key = hashlib.sha256(f"{tag}\\0{text}".encode("utf-8")).hexdigest()
        cache_file = TTS_CACHE_DIR / f"{cache_key}.{ext}"
        temporary_file = cache_file.with_suffix(".tmp")
        temporary_file.write_bytes(audio)
        temporary_file.replace(cache_file)
    except OSError:
        pass


def _read_cache(tag, text, ext):
    try:
        cache_key = hashlib.sha256(f"{tag}\\0{text}".encode("utf-8")).hexdigest()
        cached = (TTS_CACHE_DIR / f"{cache_key}.{ext}").read_bytes()
        if cached:
            return TTSResult(cached, "audio/mpeg" if ext == "mp3" else "audio/wav")
    except OSError:
        pass
    return None


@lru_cache(maxsize=256)
def synthesize_danish(text):
    """Return a TTSResult spoken in Danish — Edge TTS, else offline Piper."""
    # Serve a previously synthesized line straight from the per-engine cache.
    cached = _read_cache(DANISH_VOICE, text, "mp3")
    if cached:
        return cached
    cached = _read_cache("piper", text, "wav")
    if cached:
        return cached

    if not _synthesis_slot.acquire(blocking=False):
        raise TextToSpeechError("Talegeneratoren er optaget")
    try:
        try:
            # 1) Preferred voice: Microsoft Edge TTS.
            result = asyncio.run(asyncio.wait_for(_synthesize_edge(text), timeout=TTS_TIMEOUT_SECONDS))
        except Exception:
            # 2) Edge is down / timed out / returned nothing -> offline Piper.
            result = _synthesize_piper(text)
            if result is None:
                raise TextToSpeechError("Talegeneratoren svarede ikke i tide")
        # 3) Cache whichever engine produced audio for next time.
        ext = "mp3" if result.mimetype == "audio/mpeg" else "wav"
        tag = DANISH_VOICE if ext == "mp3" else "piper"
        _cache(tag, text, result.audio, ext)
        return result
    except TimeoutError as exc:
        raise TextToSpeechError("Talegeneratoren svarede ikke i tide") from exc
    except TextToSpeechError:
        raise
    except Exception as exc:
        raise TextToSpeechError("Kunne ikke generere dansk tale") from exc
    finally:
        _synthesis_slot.release()
