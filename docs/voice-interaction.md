# Dansk voice-interaktion

Spillet bruger browserens `MediaRecorder` til korte optagelser og sender dem til
Flask. Backend transskriberer på dansk og matcher kun mod intents fra den aktive
scene. Et sikkert match kalder den samme scenehandling som terning- eller
valgknapperne, så voice aldrig bliver et separat gameplay-system.

## Konfiguration

En OpenAI/Whisper-kompatibel speech-to-text-server konfigureres med:

```bash
export STT_BASE_URL="https://stt.example.com/v1"
export STT_API_KEY="..."
export STT_MODEL="whisper-1"
```

På den lokale spilserver bruges som standard den installerede
`Systran/faster-whisper-base`-model på CPU. Lyd forlader derfor ikke maskinen.
Servicen sætter `STT_PROVIDER=local`. En ekstern provider kan vælges med
variablerne ovenfor; API-nøglen sendes aldrig til browseren.

Den valgfrie Qwen-fallback bruger en OpenAI-kompatibel chat-endpoint:

```bash
export QWEN_BASE_URL="http://localhost:8000/v1"
export QWEN_API_KEY="..."
export QWEN_MODEL="Qwen3.6-27B"
```

Qwen modtager kun spørgsmålet, transskriptionen og scenens tilladte intents.
Output valideres, og modellen kan ikke opfinde eller udføre nye handlinger.

På spilserveren bruges Hermes/OpenAI-endpointet fra `HERMES_CONFIG_PATH` med
`thinkingcap-27b`. Hermes får kun den aktive scene og en servergenereret liste
over tilladte valg. Den kan besvare kommentarer om historien, vælge `wait`,
foreslå `roll_scene` eller et af scenens fire valg. Flask validerer altid valget
og er alene om at ændre spillet. Off-topic svar erstattes med en fast,
børnevenlig besked.

Spillet blander terningkast med fire historievalg, farveopgaver og
hukommelsesspørgsmål med tallene 1–4. Ledetråden gives og oplæses i den første
scene; spørgsmålet kommer fire scener senere. Forkerte opgavesvar flytter ikke
historien videre, og feedbacken bliver læst op.

## Dansk TTS

Frontend henter MP3-oplæsning fra `POST /api/tts`, som bruger den faste danske
kvindestemme `da-DK-ChristelNeural`. Browserens Speech Synthesis bruges kun som
nødreserve. Scenetekst, spørgsmål, Hermes-svar og terningresultater læses op.
Frontend forbereder resultat- og scenelyd parallelt med terninganimationen og
viser status for forberedelse og aktiv oplæsning. Musikken dæmpes under tale, og
mikrofonknappen er låst, så spillet ikke transskriberer sin egen stemme.

TTS følger spillets eksisterende lydstyrke; lydstyrke `0` slår oplæsning fra.

## API

- `POST /api/v1/games/<game_id>/voice` modtager multipart-felterne `audio`,
  `scene_id` og valgfrit `question_id`. WebM, Ogg og WAV op til 10 MiB accepteres.
- `POST /api/v1/games/<game_id>/voice/text` modtager JSON med `text`, `scene_id`
  og valgfrit `question_id` til udvikling og tests uden mikrofon.
- `POST /api/tts` modtager JSON med `text` og returnerer dansk MP3.
- `POST /api/interact` modtager et af den aktive scenes fire tilladte valg.

Gamle scene- og question-ID'er afvises, så et langsomt svar ikke kan ændre den
forkerte scene.
