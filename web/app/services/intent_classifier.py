"""Optional OpenAI-compatible Qwen fallback for allowed intent classification."""

import json
import os
from urllib import request


def classify_with_qwen(question, transcript, intents):
    """Return a validated classification or None when unavailable/invalid."""
    base_url, api_key = os.getenv("QWEN_BASE_URL"), os.getenv("QWEN_API_KEY")
    if not base_url or not api_key or not intents:
        return None
    allowed = [{"id": item["id"], "description": item.get("description", "")} for item in intents]
    payload = {
        "model": os.getenv("QWEN_MODEL", "Qwen3.6-27B"),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": (
                "Du klassificerer korte danske svar fra et barn omkring 4 år. "
                "Vælg kun en udleveret intent eller no_match. Returner kun JSON med "
                "intent, confidence og reason."
            )},
            {"role": "user", "content": json.dumps({
                "question": question, "transcript": transcript, "allowed_intents": allowed,
            }, ensure_ascii=False)},
        ],
    }
    req = request.Request(
        base_url.rstrip("/") + "/chat/completions",
        data=json.dumps(payload).encode("utf-8"), method="POST",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    try:
        with request.urlopen(req, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
        content = result["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        intent_id = parsed.get("intent")
        confidence = float(parsed.get("confidence", 0))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, OSError):
        return None
    allowed_ids = {item["id"] for item in intents}
    if intent_id not in allowed_ids or not 0 <= confidence <= 1:
        return None
    return {"intent": intent_id, "confidence": confidence, "method": "llm"}
