import asyncio

import pytest

from app.services import text_to_speech


def setup_function():
    text_to_speech.synthesize_danish.cache_clear()


def test_synthesis_has_a_deadline(monkeypatch):
    async def too_slow(_text):
        await asyncio.sleep(0.02)
        return b"late"

    monkeypatch.setattr(text_to_speech, "_synthesize", too_slow)
    monkeypatch.setattr(text_to_speech, "TTS_TIMEOUT_SECONDS", 0.001)

    with pytest.raises(text_to_speech.TextToSpeechError, match="ikke i tide"):
        text_to_speech.synthesize_danish("En ny sætning")


def test_busy_synthesizer_fails_fast():
    assert text_to_speech._synthesis_slot.acquire(blocking=False)
    try:
        with pytest.raises(text_to_speech.TextToSpeechError, match="optaget"):
            text_to_speech.synthesize_danish("En anden ny sætning")
    finally:
        text_to_speech._synthesis_slot.release()


def test_successful_mp3_is_reused_from_disk(monkeypatch, tmp_path):
    calls = 0

    async def synthesize_once(_text):
        nonlocal calls
        calls += 1
        return b"mp3-data"

    monkeypatch.setattr(text_to_speech, "_synthesize", synthesize_once)
    monkeypatch.setattr(text_to_speech, "TTS_CACHE_DIR", tmp_path)

    assert text_to_speech.synthesize_danish("En gemt fortælling") == b"mp3-data"
    text_to_speech.synthesize_danish.cache_clear()
    assert text_to_speech.synthesize_danish("En gemt fortælling") == b"mp3-data"
    assert calls == 1
