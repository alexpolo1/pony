"""Small, deterministic normalizer for Danish speech transcripts."""

import re
import unicodedata


_STT_REPLACEMENTS = {
    "okay": "ok",
    "okey": "ok",
    "ja tak": "ja",
}


def normalize_danish(text):
    """Normalize a transcript while preserving the Danish letters æ, ø and å."""
    if not isinstance(text, str):
        return ""
    value = unicodedata.normalize("NFC", text).lower().strip()
    value = re.sub(r"[^a-z0-9æøå\s-]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    for source, target in _STT_REPLACEMENTS.items():
        value = re.sub(rf"\b{re.escape(source)}\b", target, value)
    return value
