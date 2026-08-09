# Overnat-forbedring: Automatisk spil-test & forbedring

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Over 6 timer, automatisk kør spillet igennem (alle 8 temaer × 4 pony-typer = 32 kombinationer), analyser resultaterne, og forbedr balance, tekst, og gameplay baseret på data.

**Architecture:** En cron-job loop der hver 30. minut: (1) kører evaluate_game.py med alle kombinationer, (2) analyser output for balance-problemer, (3) laver konkrete forbedringer i themes.py eller dice.py, (4) kører tests for at verificere.

**Tech Stack:** Python (evaluate_game.py, pytest), Flask backend, SQLite stats, cronjob med no_agent=False (LLM-driven).

---

## Forudsætninger

- Repo: `/home/alex/pony`
- Backend: `web/app/` — Flask med `create_app()` i `app/config.py`
- Temaer: `web/app/data/themes.py` — 8 temaer, 5 scener hver
- Pony-typer: `web/app/game/pony.py` — 4 typer (Jordpony, Pegasus, Enhjørning, Alicorn)
- Terning: `web/app/game/dice.py` — `resolve_test(pony, stat, difficulty)`
- Evaluering: `web/evaluate_game.py` — simulerer 100 spil
- Integrationstests: `web/tests/test_integration.py` — `advance_current_scene()`
- Stats: `web/app/services/persistence.py` — `game_stats` tabel (ny)
- Frontend: `pony-frontend/src/` — React 19

---

## Task 1: Forbedr evaluate_game.py til at dække alle 32 kombinationer

**Objective:** Udvid evaluatoren til at køre systematisk: 8 temaer × 4 pony-typer = 32 gennemgange med detaljeret rapport.

**Files:**
- Modify: `web/evaluate_game.py:37-43` (pick_pony, pick_theme, NUM_RUNS)
- Modify: `web/evaluate_game.py:117-128` (evaluate function)

**Step 1: Add exhaustive evaluation mode**

Replace the random `pick_pony()` / `pick_theme()` with an exhaustive mode that iterates all combinations:

```python
def evaluate_exhaustive():
    """Run every pony × theme combination once, return detailed report."""
    all_runs = []
    print(f"Kører {len(PONITYPER)} x {len(THEMAER)} = {len(PONITYPER) * len(THEMAER)} kombinationer...")
    for pony_idx in range(len(PONITYPER)):
        for tema_idx in range(len(THEMAER)):
            try:
                game = create_game(pony_idx, tema_idx)
                results = play_game_deterministic(game, pony_idx, tema_idx)
                all_runs.append(results)
            except Exception as e:
                print(f"  Fejl: pony {pony_idx} x tema {tema_idx}: {e}")
    return all_runs
```

**Step 2: Add deterministic play function**

```python
def play_game_deterministic(game, pony_idx, tema_idx):
    """Play through a game with deterministic choices for evaluation."""
    tema = THEMAER[tema_idx]
    scenes = tema.get("scener", [])
    results = []
    while not game.get("færdig"):
        scn_idx = game["scene"]
        if scn_idx >= len(scenes):
            game["færdig"] = True
            break
        scn = scenes[scn_idx]
        interaction = scn.get("interaction", {"type": "dice"})
        if interaction["type"] == "dice":
            game = roll_scene(game)
        else:
            options = interaction.get("options", [])
            target = interaction.get("target")
            if target:
                target_opt = next((o for o in options if o.get("id") == target), None)
                selection = target_opt["id"] if target_opt else options[0]["id"]
            else:
                selection = options[0]["id"]
            game, _ = resolve_scene_interaction(game, selection)
        if game["historie"]:
            results.append(game["historie"][-1])
    fmt = format_scene_data(game)
    return {
        "pony_type": PONITYPER[pony_idx]["navn"],
        "pony_idx": pony_idx,
        "tema": tema["titel"],
        "tema_idx": tema_idx,
        "stats": {
            "krop": game["pony"]["krop"],
            "sind": game["pony"]["sind"],
            "charme": game["pony"]["charme"],
            "talent": game["pony"]["talent"],
        },
        "succeser": game["succeser"],
        "fiaskoer": game["fiaskoer"],
        "total_scenes": len(scenes),
        "victory": fmt.get("victory"),
        "mixed": fmt.get("mixed"),
        "defeat": fmt.get("defeat"),
        "results": results,
    }
```

**Step 3: Add new report function for per-combination breakdown**

```python
def report_exhaustive(runs):
    total = len(runs)
    victory_count = sum(1 for r in runs if r.get("victory"))
    win_rate = (victory_count / total * 100) if total > 0 else 0

    print(f"\n{'='*60}")
    print(f"OVERNAT-EVALUERING: {total} kombinationer")
    print(f"Sejr-rate: {victory_count}/{total} = {win_rate:.1f}%")
    print(f"{'='*60}")

    # Per pony type
    for pony in PONITYPER:
        pony_runs = [r for r in runs if r["pony_idx"] == pony["id"]]
        if not pony_runs:
            continue
        pony_victories = sum(1 for r in pony_runs if r.get("victory"))
        avg_succ = statistics.mean([r["succeser"] for r in pony_runs])
        print(f"\n{pony['navn']}: {len(pony_runs)} spil, {pony_victories} sejre ({pony_victories/len(pony_runs)*100:.0f}%), gns succeser: {avg_succ:.1f}")

    # Per theme
    for tema in THEMAER:
        tema_runs = [r for r in runs if r["tema_idx"] == tema["id"]]
        if not tema_runs:
            continue
        tema_victories = sum(1 for r in tema_runs if r.get("victory"))
        avg_succ = statistics.mean([r["succeser"] for r in tema_runs])
        print(f"\n{tema['titel']}: {len(tema_runs)} spil, {tema_victories} sejre ({tema_victories/len(tema_runs)*100:.0f}%), gns succeser: {avg_succ:.1f}")

    # Identify problem areas
    print(f"\n--- PROBLEMER ---")
    for r in runs:
        if r["fiaskoer"] >= 4:
            print(f"  FOR SVÆRT: {r['pony_type']} x {r['tema']} — {r['fiaskoer']} fiaskoer")
        if r["succeser"] == r["total_scenes"] and r["fiaskoer"] == 0:
            print(f"  FOR LET: {r['pony_type']} x {r['tema']} — alle succeser")

    return {
        "runs": runs,
        "total": total,
        "victory_count": victory_count,
        "win_rate": round(win_rate, 1),
    }
```

**Step 4: Add main entry point for exhaustive mode**

```python
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--exhaustive", action="store_true", help="Run all pony×theme combos")
    args = parser.parse_args()
    if args.exhaustive:
        runs = evaluate_exhaustive()
        report_exhaustive(runs)
    else:
        evaluate()
```

**Step 5: Run and verify**

```bash
cd /home/alex/pony/web && python evaluate_game.py --exhaustive
```

Expected output: 32 kombinationer med sejr-rater per pony og tema.

**Step 6: Commit**

```bash
cd /home/alex/pony && git add web/evaluate_game.py && git commit -m "feat: exhaustive evaluation mode for all pony×theme combinations"
```

---

## Task 2: Opret forbedrings-rapport og identificér balance-problemer

**Objective:** Kør exhaustive evalueringen, gem output, og analyser for balance-problemer.

**Files:**
- Create: `web/nightly_improvements.py`
- Modify: `web/evaluate_game.py` (already done in Task 1)

**Step 1: Create nightly improvement script**

This script runs the exhaustive evaluation, analyzes results, and outputs specific improvement suggestions:

```python
#!/usr/bin/env python3
"""
Nætlige forbedringer: kører evaluering, finder balance-problemer,
og forslår konkrete ændringer i themes.py.
"""
import sys, os, json, statistics
sys.path.insert(0, os.path.dirname(__file__))

from app.data.themes import THEMAER
from app.game.pony import PONITYPER
from app.game.state import create_game
from app.services.game_service import roll_scene, resolve_scene_interaction, format_scene_data

def run_all():
    runs = []
    for pi in range(len(PONITYPER)):
        for ti in range(len(THEMAER)):
            game = create_game(pi, ti)
            tema = THEMAER[ti]
            scenes = tema["scener"]
            while not game.get("færdig"):
                si = game["scene"]
                if si >= len(scenes):
                    game["færdig"] = True
                    break
                scn = scenes[si]
                interaction = scn.get("interaction", {"type": "dice"})
                if interaction["type"] == "dice":
                    game = roll_scene(game)
                else:
                    options = interaction.get("options", [])
                    target = interaction.get("target")
                    sel = next((o["id"] for o in options if o.get("id") == target), options[0]["id"]) if target else options[0]["id"]
                    game, _ = resolve_scene_interaction(game, sel)
            fmt = format_scene_data(game)
            runs.append({
                "pony": PONITYPER[pi]["navn"],
                "tema": tema["titel"],
                "tema_id": tema["id"],
                "succeser": game["succeser"],
                "fiaskoer": game["fiaskoer"],
                "victory": fmt.get("victory"),
            })
    return runs

def analyze(runs):
    issues = []
    for r in runs:
        if r["fiaskoer"] >= 4:
            issues.append(f"FOR SVÆRT: {r['pony']} x {r['tema']} — {r['fiaskoer']} fiaskoer")
        elif r["succeser"] == 5 and r["fiaskoer"] == 0:
            issues.append(f"FOR LET: {r['pony']} x {r['tema']} — perfekt run")
    return issues

if __name__ == "__main__":
    runs = run_all()
    issues = analyze(runs)
    print(f"Kørte {len(runs)} kombinationer")
    for i in issues:
        print(f"  {i}")
    if not issues:
        print("  Ingen balance-problemer fundet")
    print(json.dumps(runs, indent=2))
```

**Step 2: Run and capture output**

```bash
cd /home/alex/pony/web && python nightly_improvements.py > /tmp/nightly_report.json 2>&1
cat /tmp/nightly_report.json
```

**Step 3: Commit**

```bash
cd /home/alex/pony && git add web/nightly_improvements.py && git commit -m "feat: nightly improvement analyzer for game balance"
```

---

## Task 3: Tilføj scene-level balance-metrics til evalueringen

**Objective:** Tilføj per-scene succes-rater så vi kan se hvilken scene der er sværest.

**Files:**
- Modify: `web/evaluate_game.py` (add per-scene tracking)

**Step 1: Enhance play_game_deterministic to track per-scene results**

In the `play_game_deterministic` function, add a `scene_results` list:

```python
scene_results = []
# ... inside the while loop, after processing each scene:
scene_results.append({
    "scene": scn_idx,
    "action": scn["aktion"],
    "stat": scn["stat"],
    "difficulty": scn["svaer"],
    "success": game["historie"][-1].get("succes", False) if game["historie"] else None,
})
```

Add `scene_results` to the return dict.

**Step 2: Add per-scene analysis to report_exhaustive**

```python
# Aggregate scene success rates across all runs
for scene_num in range(5):
    scene_data = []
    for r in runs:
        for sr in r.get("scene_results", []):
            if sr["scene"] == scene_num:
                scene_data.append(sr)
    if scene_data:
        success_rate = sum(1 for s in scene_data if s["success"]) / len(scene_data) * 100
        print(f"Scene {scene_num+1}: {success_rate:.0f}% succes ({len(scene_data)} kast)")
```

**Step 3: Verify**

```bash
cd /home/alex/pony/web && python evaluate_game.py --exhaustive
```

**Step 4: Commit**

```bash
cd /home/alex/pony && git add web/evaluate_game.py && git commit -m "feat: per-scene balance metrics in exhaustive evaluation"
```

---

## Task 4: Opret cron-job for overnat-forbedring

**Objective:** Opret en cron-job der kører hvert 30. minut i 6 timer, spiller spillet, analyserer, og forbedrer.

**Files:**
- Modify: Cron job via `cronjob` tool

**Step 1: Create the cron job**

The cron job prompt (self-contained):

```
Du er en game-balance agent for My Little Pony TTRPG.

## Trin 1: Kør evaluering
cd /home/alex/pony/web && python evaluate_game.py --exhaustive
Gem output.

## Trin 2: Analyser resultater
Læs output fra evalueringen. Identificér:
- Temaer der er for svære (fiaskoer >= 4)
- Temaer der er for lette (perfekt run)
- Scener med lav succes-rate (< 30%)
- Scener med for høj succes-rate (> 95%)

## Trin 3: Forbedr balance
For hvert balance-problem:
- Hvis for svær: sænk sværhedsgrad ('svaert' -> 'normal' -> 'let') eller juster stat-valg
- Hvis for let: øg sværhedsgrad
- Mål: 40-60% sejr-rate per tema

Edit web/app/data/themes.py for at justere sværhedsgrad eller stat på problematiske scener.

## Trin 4: Verificér
Kør: cd /home/alex/pony/web && python evaluate_game.py --exhaustive
Kør: cd /home/alex/pony/web && python -m pytest tests/test_integration.py -v

## Trin 5: Commit
cd /home/alex/pony && git add -A && git commit -m "balance: improve game balance based on evaluation data" && git push

Rapporter: Hvad du fandt, hvad du ændrede, og om tests bestod.
```

**Step 2: Schedule**

- Every 30 minutes
- Repeat: 12 times (6 hours total)
- Use `cronjob` tool with `action='create'`

---

## Task 5: Forbedr frontend-tekster baseret på evaluation

**Objective:** Efter backend-balance er justeret, forbedr frontend-tekster og feedback.

**Files:**
- Modify: `pony-frontend/src/pages/GameScenePage.js`
- Modify: `pony-frontend/src/pages/GameEndPage.js`
- Modify: `pony-frontend/src/services/narration.js`

**Step 1: Enhance narration with more encouraging feedback for failures**

In `pony-frontend/src/services/narration.js`, improve the failure narration:

```javascript
// Instead of generic "Godt forsøg", use context-aware encouragement
export function buildResultNarration(result) {
  if (result.success) {
    return `Succes! ${result.story}`;
  }
  // More encouraging failure messages
  const encouragements = [
    "Du gjorde dit bedste, og det er nok!",
    "Næste gang klarer du det!",
    "Ponyerne hjælper altid hinanden!",
  ];
  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];
  return `${msg} ${result.story}`;
}
```

**Step 2: Add progress indicator to game end page**

In `pony-frontend/src/pages/GameEndPage.js`, show a star rating based on successes:

```javascript
// Add star display
const stars = data.score ? parseInt(data.score) : 0;
const starCount = stars >= 5 ? 3 : stars >= 3 ? 2 : 1;
// Render: {[...Array(starCount)].map((_, i) => <span key={i}>⭐</span>)}
```

**Step 3: Verify with test**

```bash
cd /home/alex/pony/pony-frontend && npm test -- --testPathPattern="narration|GameEndPage" --watchAll=false
```

**Step 4: Commit**

```bash
cd /home/alex/pony && git add pony-frontend/src/ && git commit -m "improve: better failure narration and star rating on game end"
```

---

## Task 6: Tilføj stats-dashboard til frontend

**Objective:** Vis backend-statistik i frontend så spilleren kan se sin fremgang.

**Files:**
- Create: `pony-frontend/src/pages/StatsPage.js`
- Modify: `pony-frontend/src/App.js` (add stats page to navigation)
- Modify: `pony-frontend/src/services/api.js` (add loadStats)

**Step 1: Add API call for stats**

In `pony-frontend/src/services/api.js`:

```javascript
export async function loadStats() {
  return apiFetch('/api/stats');
}
```

**Step 2: Create StatsPage component**

```javascript
import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

export default function StatsPage({ onBack }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api.loadStats().then(setStats).catch(() => {});
  }, []);
  if (!stats) return <div>Indlæser statistik...</div>;
  return (
    <div className="stats-page">
      <h2>🏆 Din statistik</h2>
      <p>Spil: {stats.total_games} | Sejre: {stats.total_victories} ({stats.win_rate}%)</p>
      <h3>Per pony-type:</h3>
      <ul>{stats.by_pony_type.map(p => (
        <li key={p.type}>{p.type}: {p.games} spil, {p.win_rate}% sejre</li>
      ))}</ul>
      <h3>Per tema:</h3>
      <ul>{stats.by_tema.map(t => (
        <li key={t.tema_id}>{t.tema_title}: {t.games} spil, {t.win_rate}% sejre</li>
      ))}</ul>
      <button onClick={onBack}>Tilbage</button>
    </div>
  );
}
```

**Step 3: Wire into App.js**

Add `stats` to page state and render `StatsPage` when active. Add a trophy button in the header.

**Step 4: Test**

```bash
cd /home/alex/pony/pony-frontend && npm test -- --watchAll=false
```

**Step 5: Commit**

```bash
cd /home/alex/pony && git add pony-frontend/src/ && git commit -m "feat: stats dashboard page with backend integration"
```

---

## Task 7: Forbedr tema-tekster baseret på evaluation

**Objective:** Efter evaluation har identificeret problematiske temaer, skriv bedre tekst for dem.

**Files:**
- Modify: `web/app/data/themes.py`

**Step 1: Read evaluation results**

Læs output fra Task 2 og identificér hvilke temaer der har balance-problemer.

**Step 2: Adjust specific scenes**

For hvert problematisk tema:
- Juster `svaer` (let/normal/svaert) på scener med ekstrem succes-rate
- Juster `stat` (krop/sind/charme) for at matche pony-type bonus
- Sørg for at `color_prompt` og `memory` scener refererer til info fra tidligere scener

**Step 3: Verify**

```bash
cd /home/alex/pony/web && python evaluate_game.py --exhaustive && python -m pytest tests/test_integration.py -v
```

**Step 4: Commit**

```bash
cd /home/alex/pony && git add web/app/data/themes.py && git commit -m "balance: adjust theme difficulty based on evaluation data"
```

---

## Cron-job loop-struktur

Hver 30. minut kører cron-jobbet:

1. **Kør `evaluate_game.py --exhaustive`** — 32 kombinationer
2. **Analyser output** — find balance-problemer
3. **Forbedr `themes.py`** — juster sværhedsgrad/stat på problematiske scener
4. **Kør `pytest tests/test_integration.py -v`** — verifikation
5. **Kør `npm test`** (frontend) — verifikation
6. **Commit + push** — hvis alt passer
7. **Rapporter** — hvad blev fundet og ændret

Efter 12 iterationer (6 timer) stopper cron-jobbet automatisk.

---

## Risici og afvigelser

- **Over-optimization:** Hvis balance justeres for meget, kan spillet blive monotont. Mål: 40-60% sejr, ikke 50% præcis.
- **Frontend-backend mismatch:** Hvis themes.py ændres, skal frontend tests også køre.
- **Hermes token-brug:** Cron-jobbet skal være fokuseret — kun evaluering + specifikke justeringer, ikke om skrivning af hele filer.
- **Test-fejl:** Hvis pytest fejler, skal jobbet STOPPE og ikke committe — rollback til sidste known-good commit.

---

## Open questions

1. Skal frontend også have en "spil igen" knap på GameEndPage for hurtig genstart?
2. Skal stats-dashboard være tilgængeligt fra forside eller kun efter spil?
3. Skal cron-jobbet også kør Playwright E2E-tests eller kun backend-tests?