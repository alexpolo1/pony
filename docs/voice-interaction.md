# Dansk voice-interaktion

Spillet bruger browserens `MediaRecorder` til korte optagelser og sender dem til
Flask. Backend transskriberer på dansk og matcher kun mod intents fra den aktive
scene. Et sikkert match på `ready` kalder den samme scenehandling som knappen
**KAST TERNINGERNE**, så voice aldrig bliver et separat gameplay-system.

## Konfiguration

En OpenAI/Whisper-kompatibel speech-to-text-server konfigureres med:

```bash
export STT_BASE_URL="https://stt.example.com/v1"
export STT_API_KEY="..."
export STT_MODEL="whisper-1"
```

Uden disse variabler forbliver den almindelige spilknap aktiv, og barnet får en
venlig besked om at prøve igen. API-nøglen sendes aldrig til browseren.

Den valgfrie Qwen-fallback bruger en OpenAI-kompatibel chat-endpoint:

```bash
export QWEN_BASE_URL="http://localhost:8000/v1"
export QWEN_API_KEY="..."
export QWEN_MODEL="Qwen3.6-27B"
```

Qwen modtager kun spørgsmålet, transskriptionen og scenens tilladte intents.
Output valideres, og modellen kan ikke opfinde eller udføre nye handlinger.

## Dansk TTS

Frontend bruger browserens Speech Synthesis med sproget `da-DK` og foretrækker
en installeret dansk stemme. Scenetekst og spørgsmål læses automatisk op. Svar,
gentagelser og positive reaktioner læses også op. Musikken dæmpes under tale, og
mikrofonknappen er låst, så spillet ikke transskriberer sin egen stemme.

TTS følger spillets eksisterende lydstyrke; lydstyrke `0` slår oplæsning fra.

## API

- `POST /api/v1/games/<game_id>/voice` modtager multipart-felterne `audio`,
  `scene_id` og valgfrit `question_id`. WebM, Ogg og WAV op til 10 MiB accepteres.
- `POST /api/v1/games/<game_id>/voice/text` modtager JSON med `text`, `scene_id`
  og valgfrit `question_id` til udvikling og tests uden mikrofon.

Gamle scene- og question-ID'er afvises, så et langsomt svar ikke kan ændre den
forkerte scene.
