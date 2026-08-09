# 🐴 My Little Pony: Tails of Equestria

En interaktiv digital rollespil baseret på My Little Pony-universet, designet til børn.

## ✨ Funktioner

- **8 unikke temaer** — hver med 5 scener (terningkast, valg, farvergætning, hukommelse)
- **4 pony-typer** — Jordpony, Pegasus, Enhjørning, Alicorn med unikke statsbonuser
- **Terningsystem** — enkelt terning (1d6) med stat-baseret sværhedsgrad
- **Stemmeinteraktion** — talegenkendelse (STT) og talesyntese (TTS) på dansk
- **Pixel-pony konfigurator** — tilpas farve, man, øjne, horn/vinger og navn
- **Lysstyrke-kontrol** — tilpas skærmlyset for komfort
- **Fulldunderstand** — fullscreen-support for immersiv oplevelse

## 🏗️ Arkitektur

```
┌─────────────────────┐     ┌──────────────────┐
│  React Frontend      │────▶│  Flask Backend     │
│  (pony-frontend/)    │     │  (web/)            │
│  - React 19          │     │  - REST API        │
│  - Framer Motion     │     │  - Dice engine      │
│  - Voice integration │     │  - STT/TTS          │
└─────────────────────┘     └──────────────────┘
```

### Frontend
- **React 19** med Create React App
- **Framer Motion** for animationer
- Komponenter: VoiceButton, FullscreenButton, VoiceFlow
- Tjenester: API-klient, TTS, narration, voiceFlow

### Backend
- **Flask** REST API
- Terningsystem: `target = 6 - stat + penalty - talent_bonus` (clamped 1-6)
- Tale-syntese (TTS) og tale-genkendelse (STT) på dansk
- Intent-klassificering via Hermes AI
- SQLite-persistering (valgfri)

## 📖 Terningsystem

| Stat | Type | Bonus |
|---|---|---|
| Krop | Fysisk styrke | +1 (Jordpony, Pegasus) |
| Sind | Mental styrke | +1 (Enhjørning) |
| Charme | Social styrke | +1 (Alicorn) |

**Formel:** `target = 6 - stat + penalty - talent_bonus`

| Sværhed | Penalty |
|---|---|
| Let | 0 |
| Normal | 1 |
| Svær | 2 |

## 🎮 Gameplay-flow

Hvert tema har **5 scener** med fast mønster:

1. **Terningkast** — let/normal sværhed
2. **Valg** — 4 muligheder (modig/klog/ven/magi)
3. **Farvergætning** — 4 farver, 1 korrekt
4. **Terningkast** — normal/svær sværhed
5. **Hukommelse** — husk et tal fra tidligere i historien

## 🚀 Kom i gang

### Krav
- Python 3.10+
- Node.js 18+
- npm

### Backend

```bash
cd web
python -m venv .venv
source .venv/bin/activate
pip install flask gunicorn
# Start serveren
python -m app
```

### Frontend

```bash
cd pony-frontend
npm install
npm start
```

## 🌐 API

| Endpoint | Metode | Beskrivelse |
|---|---|---|
| `/api/start` | POST | Start nyt spil `{type, tema, navn?}` |
| `/api/kast` | POST | Kast terning for nuværende scene |
| `/api/interact` | POST | Farve/tal/valg `{selection}` |
| `/api/scene` | GET | Hent nuværende scene |
| `/api/reset` | POST | Nulstil spil |
| `/api/content` | GET | Pony-typer og temaer |
| `/api/health` | GET | Health check |
| `/api/tts` | POST | Dansk talesyntese |
| `/api/v1/games/{id}/voice` | POST | Audio-svar (STT + intent) |
| `/api/v1/games/{id}/voice/text` | POST | Tekst-svar |

## 📊 Balance

| Pony-type | Bonus | Sejr-rate |
|---|---|---|
| Jordpony | +1 krop | 40% |
| Pegasus | +1 krop | 45% |
| Enhjørning | +1 sind | 53% |
| Alicorn | +1 alle | 56% |

**Samlet sejr-rate:** 48% (mål: 40-60%)

## 📁 Vigtige filer

- `web/app/game/dice.py` — terningsystem
- `web/app/data/themes.py` — 8 temaer, 5 scener hver
- `web/app/services/game_service.py` — scene-orchestration
- `web/app/routes/api.py` — REST endpoints
- `web/app/services/text_to_speech.py` — TTS
- `pony-frontend/src/App.js` — hovedkomponent
- `pony-frontend/src/components/VoiceButton.js` — stemmeknap
- `pony-frontend/src/services/voiceFlow.js` — stemme-flow

## 📝 Udvikling

Se [DEVELOPER_NOTES.md](DEVELOPER_NOTER.md) for detaljer om terningsystem, balance, og UI.

## 📄 Licens

Projektet er open source.