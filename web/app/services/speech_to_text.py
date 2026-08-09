"""Replaceable speech-to-text providers.

The default provider is disabled. Configure an OpenAI-compatible transcription
endpoint with STT_BASE_URL, STT_API_KEY and optionally STT_MODEL.
"""

from dataclasses import asdict, dataclass
import json
import mimetypes
import os
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
    base_url, api_key = os.getenv("STT_BASE_URL"), os.getenv("STT_API_KEY")
    if base_url and api_key:
        return OpenAICompatibleSpeechToTextProvider(base_url, api_key, os.getenv("STT_MODEL", "whisper-1"))
    return DisabledSpeechToTextProvider()
