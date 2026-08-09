"""Replaceable speech-to-text providers.

Use a local faster-whisper model or configure an OpenAI-compatible endpoint.
"""

from dataclasses import asdict, dataclass
import json
import mimetypes
import os
import tempfile
import threading
import uuid
from urllib import request


class SpeechToTextError(RuntimeError):
    pass


@dataclass(frozen=True)
class Transcript:
    text: str
    language: str = "da"
    confidence: float | None = None
    provider: str = "unknown"

    def to_dict(self):
        return asdict(self)


class SpeechToTextProvider:
    def transcribe(self, audio_bytes, language="da", filename="audio.webm", content_type=None):
        raise NotImplementedError


class DisabledSpeechToTextProvider(SpeechToTextProvider):
    def transcribe(self, audio_bytes, language="da", filename="audio.webm", content_type=None):
        raise SpeechToTextError("Speech-to-text is not configured")


_LOCAL_MODELS = {}
_MODEL_LOCK = threading.Lock()


class LocalFasterWhisperProvider(SpeechToTextProvider):
    """On-device transcription; audio and transcripts never leave the machine."""

    def __init__(self, model="Systran/faster-whisper-base", device="cpu", compute_type="int8"):
        self.model_name, self.device, self.compute_type = model, device, compute_type

    def _model(self):
        key = (self.model_name, self.device, self.compute_type)
        with _MODEL_LOCK:
            if key not in _LOCAL_MODELS:
                try:
                    from faster_whisper import WhisperModel
                    _LOCAL_MODELS[key] = WhisperModel(
                        self.model_name, device=self.device, compute_type=self.compute_type,
                        local_files_only=True,
                    )
                except Exception as exc:
                    raise SpeechToTextError("Local speech-to-text model could not be loaded") from exc
        return _LOCAL_MODELS[key]

    def transcribe(self, audio_bytes, language="da", filename="audio.webm", content_type=None):
        suffix = next((ext for ext in (".webm", ".ogg", ".wav") if filename.lower().endswith(ext)), ".webm")
        path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as audio_file:
                audio_file.write(audio_bytes)
                path = audio_file.name
            segments, info = self._model().transcribe(
                path, language=language, beam_size=3, vad_filter=True,
                condition_on_previous_text=False,
            )
            text = " ".join(segment.text.strip() for segment in segments).strip()
        except SpeechToTextError:
            raise
        except Exception as exc:
            raise SpeechToTextError("Local speech-to-text failed") from exc
        finally:
            if path:
                try:
                    os.unlink(path)
                except OSError:
                    pass
        if not text:
            raise SpeechToTextError("Speech-to-text returned no transcript")
        confidence = getattr(info, "language_probability", None)
        return Transcript(text, getattr(info, "language", language), confidence, "faster-whisper-local")


class OpenAICompatibleSpeechToTextProvider(SpeechToTextProvider):
    def __init__(self, base_url, api_key, model="whisper-1", timeout=20):
        self.url = base_url.rstrip("/") + "/audio/transcriptions"
        self.api_key, self.model, self.timeout = api_key, model, timeout

    def transcribe(self, audio_bytes, language="da", filename="audio.webm", content_type=None):
        boundary = "----PonyVoice" + uuid.uuid4().hex
        mime = content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        fields = [("model", self.model), ("language", language), ("response_format", "json")]
        body = bytearray()
        for name, value in fields:
            body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
        body.extend(f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n".encode())
        body.extend(audio_bytes)
        body.extend(f"\r\n--{boundary}--\r\n".encode())
        req = request.Request(self.url, data=bytes(body), method="POST", headers={
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        })
        try:
            with request.urlopen(req, timeout=self.timeout) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise SpeechToTextError("Speech-to-text provider failed") from exc
        text = payload.get("text", "").strip()
        if not text:
            raise SpeechToTextError("Speech-to-text returned no transcript")
        return Transcript(text, payload.get("language", language), payload.get("confidence"), "openai-compatible")


def get_speech_to_text_provider():
    provider = os.getenv("STT_PROVIDER", "").lower()
    if provider in {"local", "faster-whisper"}:
        return LocalFasterWhisperProvider(
            os.getenv("STT_MODEL", "Systran/faster-whisper-base"),
            os.getenv("STT_DEVICE", "cpu"), os.getenv("STT_COMPUTE_TYPE", "int8"),
        )
    base_url, api_key = os.getenv("STT_BASE_URL"), os.getenv("STT_API_KEY")
    if base_url and api_key:
        return OpenAICompatibleSpeechToTextProvider(base_url, api_key, os.getenv("STT_MODEL", "whisper-1"))
    return DisabledSpeechToTextProvider()
