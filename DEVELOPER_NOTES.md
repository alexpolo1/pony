# Udviklerliste — My Little Pony: Tails of Equestria

## Terningsystem (ENDELIGT)

**1 terning per kast.** Stat = styrke, højere = nemmere.

Formel: `target = 6 - stat + penalty - talent_bonus` (clamped 1-6)

| Sværhed | Penalty |
|---|---|
| let | 0 |
| normal | 1 |
| svær | 2 |

**Eksempler:**
- Stat 3, let: target 3 → slå 3+ (67%)
- Stat 3, normal: target 4 → slå 4+ (50%)
- Stat 3, svær: target 5 → slå 5+ (33%)
- Stat 5, let: target 1 → 100%
- Stat 2, svær: target 6 → 17%

**Talent:** giver +1 til den matchinge stat (sænker target med 1).

**Stats:** krop, sind, charme — tilfældige 2-5 (2-4 + pony-type bonus).

## Balance (100 spil-gennemgange)

- Sejr-rate: **48%** (mål: 40-60%)
- Krop: 80% succes, Sind: 91% succes, Charme: 100% (interaktive scener)
- 0 nederlag — barnet føler aldrig totalt nederlag

## Temaer (8 stk, 5 scener hver)

| Tema | Sejr-rate |
|---|---|
| Rainbow Dash har fødselsdag | 30% |
| Raritys glimmer-sten er borte | 38% |
| Angel er løbet væk | 60% |
| Lunas forsvundne stjerner | 42% |
| Discord laver sjov | 56% |
| Æblerne ruller ned ad bakken | 56% |
| Pinkies flyvende ballonfest | 22% |
| Twilights forsvundne bog | 64% |

## Pony-typer

| Type | Bonus | Sejr-rate |
|---|---|---|
| Jordpony | +1 krop | 40% |
| Pegasus | +1 krop | 45% |
| Enhjørning | +1 sind | 53% |
| Alicorn | +1 alle | 56% |

## Gameplay-flow (alle temaer)

Hvert tema har **5 scener** med fast mønster:

| Scene | Type | Beskrivelse |
|---|---|---|
| 1 | **dice** | Terningkast — let/normal sværhed |
| 2 | **choice** | 4 valg (modig/klog/ven/magi) — alle giver succes |
| 3 | **color** | 4 farver (rød/blå/gul/grøn) — 1 er korrekt |
| 4 | **dice** | Terningkast — normal/svær sværhed |
| 5 | **memory** | 3-4 tal (1-4) — 1 er korrekt, refererer til tidlig info |

**Color-scener:** Prompt fortæller hvilken farve der er korrekt (f.eks. "Tryk på den gule glasur"). Barnet skal læse prompten for at finde svaret.

**Memory-scener:** Prompt stiller et spørgsmål om et nummer der blev nævnt tidligere i historien. Barnet skal huske det.

## API

| Endpoint | Metode | Beskrivelse |
|---|---|---|
| `/api/start` | POST | `{type, tema, navn?}` → starter spil |
| `/api/kast` | POST | Kaster terning for nuværende scene |
| `/api/interact` | POST | `{selection}` → farve/tal/valg |
| `/api/scene` | GET | Hent nuværende scene |
| `/api/reset` | POST | Nulstil spil |
| `/api/content` | GET | Pony-typer og temaer |
| `/api/health` | GET | Health check |
| `/api/tts` | POST | Dansk tale-syntese |
| `/api/v1/games/{id}/voice` | POST | Audio-svar (STT + intent) |
| `/api/v1/games/{id}/voice/text` | POST | Tekst-svar (udvikling) |

## Vigtige filer

- `app/game/dice.py` — terningsystem
- `app/game/state.py` — spil-oprettelse
- `app/game/pony.py` — pony-typer og bonuses
- `app/data/themes.py` — 8 temaer, 5 scener hver
- `app/services/game_service.py` — scene-orchestration
- `app/routes/api.py` — REST endpoints
- `evaluate_game.py` — balance-evaluering

## Visuel UI (konfirmeret via browser)

### Flow: 6 trin
1. **Forside** — "My Little Pony: Tails of Equestria" + "Start nyt spil"
2. **Lyd-prompt** — "Aktivér lyd" / "Skip lyd"
3. **Tutorial** — "Sådan spiller du!" (4 trin) + "Lad os gå!"
4. **Tema-vælger** — 8 kort i 2x4 grid
5. **Pony-vælger** — 4 typer (Jordpony, Pegasus, Enhjørning, Alicorn)
6. **Konfigurator (trin 2-6)** — Krop-farve (9 swatches), Mane, Øjne, Horn/Vinger, Navn

### UI-elementer
- **Farve-swatches**: 9 cirkler (original, lyserød, lilla, blå, turkis, grøn, gul, hvid, sort)
- **Pixel-pony preview** i center — opdateres live
- **Tilbage/Næste** navigation
- **Lystyrke-slider** øverst til højre
- **Trophy-ikon** (achievements)
- **Floating pixel ponies** i baggrund

### Farveschema
- Baggrund: lilla gradient (lys → mørk)
- Kort: hvide med afrundede hjørner
- Knapper: pink gradient (næste), grå (tilbage)
- Valgt tema: pink border

### Bekendte UI-problemer
- "Næste trin" knap reagerer ikke på browser_click (React rendering issue)
- Tema-vælger: klik på kort navigerer ikke altid til pony-vælger