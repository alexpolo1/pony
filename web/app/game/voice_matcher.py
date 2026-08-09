"""Deterministic intent matching for short Danish child utterances."""

from dataclasses import asdict, dataclass
from difflib import SequenceMatcher
import re

from app.game.voice_normalizer import normalize_danish


@dataclass(frozen=True)
class MatchResult:
    matched: bool
    intent: str | None
    confidence: float
    method: str
    normalized_text: str
    response_type: str
    scores: dict

    def to_dict(self):
        return asdict(self)


def _contains_phrase(text, phrase):
    return bool(re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text))


def _fuzzy_score(text, phrase):
    text_tokens = text.split()
    phrase_tokens = phrase.split()
    windows = [" ".join(text_tokens[i:i + len(phrase_tokens)])
               for i in range(max(1, len(text_tokens) - len(phrase_tokens) + 1))]
    return max((SequenceMatcher(None, value, phrase).ratio() for value in windows), default=0.0)


def match_intent(text, intents, accept_threshold=0.8, clarify_threshold=0.55):
    """Match only against the supplied active intents.

    Ambiguous top scores are returned as ``clarify`` rather than guessed.
    """
    normalized = normalize_danish(text)
    if not normalized or not intents:
        return MatchResult(False, None, 0.0, "none", normalized, "no_match", {})

    results = []
    for intent in intents:
        candidates = []
        candidates.extend((normalize_danish(x), "keyword") for x in intent.get("keywords", []))
        candidates.extend((normalize_danish(x), "synonym") for x in intent.get("synonyms", []))
        candidates = [(phrase, kind) for phrase, kind in candidates if phrase]
        best_score, best_method = 0.0, "none"
        phrase_hits = 0
        for phrase, kind in candidates:
            if normalized == phrase:
                score, method = 1.0, "exact_phrase"
            elif _contains_phrase(normalized, phrase):
                score, method = (0.95 if kind == "keyword" else 0.9), kind
                phrase_hits += 1
            else:
                fuzzy = _fuzzy_score(normalized, phrase)
                minimum = 0.88 if len(phrase) <= 4 else 0.78
                score, method = ((0.7 + (fuzzy - minimum) * 0.5), "fuzzy") if fuzzy >= minimum else (0.0, "none")
            if score > best_score:
                best_score, best_method = score, method
        if phrase_hits > 1:
            best_score = min(1.0, best_score + min(0.04, 0.02 * (phrase_hits - 1)))
        results.append((intent.get("id"), round(best_score, 3), best_method))

    results.sort(key=lambda item: item[1], reverse=True)
    top_id, top_score, top_method = results[0]
    scores = {intent_id: score for intent_id, score, _ in results if intent_id}
    ambiguous = (
        top_method != "exact_phrase" and len(results) > 1
        and top_score >= clarify_threshold and top_score - results[1][1] < 0.08
    )
    if ambiguous or top_score < accept_threshold:
        response_type = "clarify" if top_score >= clarify_threshold else "no_match"
        return MatchResult(False, None, top_score, top_method, normalized, response_type, scores)
    return MatchResult(True, top_id, top_score, top_method, normalized, "accepted", scores)
