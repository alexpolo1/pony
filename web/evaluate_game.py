#!/usr/bin/env python3
"""
Evaluere MLP Pony-spillet som en 4-årig.

Simulerer 100 komplette spil-gennemgange med tilfældige valg
(pony-type, tema, terningkast) og producerer en rapport med:
  - gennemsnitlig score per tema
  - succesrate per scene
  - sværeste/letteste scener
  - pony-type balance
  - generel balance-vurdering

Brug:
  cd /home/alex/pony/web
  python3 evaluate_game.py
"""

import sys
import os
import json
import random
import statistics

sys.path.insert(0, os.path.dirname(__file__))

from app.data.themes import THEMAER
from app.game.pony import PONITYPER, PONYNAMNE
from app.game.dice import roll_d6, DIFFICULTY_PENALTY
from app.game.state import create_game
from app.services.game_service import roll_scene, resolve_scene_interaction, format_scene_data


NUM_RUNS = 100
RNG = random.Random(42)  # reproducibelt


def pick_pony():
    return RNG.randint(0, len(PONITYPER) - 1)


def pick_theme():
    return RNG.randint(0, len(THEMAER) - 1)


def play_one_game():
    """Play a full game from start to finish. Return a report dict."""
    pony_idx = pick_pony()
    tema_idx = pick_theme()
    game = create_game(pony_idx, tema_idx)

    pony_type = PONITYPER[pony_idx]
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
            # For non-dice scenes: pick a random valid option
            options = interaction.get("options", [])
            if not options:
                # fallback to dice if no options
                game = roll_scene(game)
            else:
                # Try the correct/target option first (simulating a child
                # who gets lucky), then random
                target = interaction.get("target")
                if interaction["type"] in ("color", "number", "memory") and target:
                    # pick the target option
                    target_opt = next((o for o in options if o.get("id") == target), None)
                    selection = target_opt["id"] if target_opt else RNG.choice([o["id"] for o in options])
                elif interaction["type"] == "choice":
                    # choice scenes: any option is correct, pick random
                    selection = RNG.choice([o["id"] for o in options])
                else:
                    selection = RNG.choice([o["id"] for o in options])

                game, _ = resolve_scene_interaction(game, selection)

        # record the last result
        if game["historie"]:
            results.append(game["historie"][-1])

    fmt = format_scene_data(game)

    return {
        "pony_type": pony_type["navn"],
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


def evaluate():
    all_runs = []

    print(f"Kører {NUM_RUNS} spil-gennemgange...")
    for i in range(NUM_RUNS):
        try:
            all_runs.append(play_one_game())
        except Exception as e:
            print(f"  Fejl i løb {i}: {e}")

    print(f"Klar! {len(all_runs)} gennemgange færdige.\n")
    report(all_runs)


def report(runs):
    total = len(runs)

    # --- Overall ---
    avg_succeser = statistics.mean([r["succeser"] for r in runs])
    avg_fiaskoer = statistics.mean([r["fiaskoer"] for r in runs])
    victory_count = sum(1 for r in runs if r.get("victory"))
    mixed_count = sum(1 for r in runs if r.get("mixed"))
    defeat_count = sum(1 for r in runs if r.get("defeat"))

    print("=" * 60)
    print("  EVALUERINGSRAPPORT — My Little Pony: Tails of Equestria")
    print("=" * 60)
    print(f"\nSamlet: {total} spil")
    print(f"  Gennemsnitlige succeser:   {avg_succeser:.1f} / {runs[0]['total_scenes']}")
    print(f"  Gennemsnitlige fiaskoer:    {avg_fiaskoer:.1f}")
    print(f"  Sejr:      {victory_count} ({victory_count/total*100:.0f}%)")
    print(f"  Blandet:   {mixed_count} ({mixed_count/total*100:.0f}%)")
    print(f"  Nederlag:  {defeat_count} ({defeat_count/total*100:.0f}%)")

    # --- Per tema ---
    print("\n--- Per Tema ---")
    themes = {}
    for r in runs:
        t = r["tema"]
        if t not in themes:
            themes[t] = {"succeser": [], "fiaskoer": [], "victories": 0, "count": 0}
        themes[t]["succeser"].append(r["succeser"])
        themes[t]["fiaskoer"].append(r["fiaskoer"])
        themes[t]["count"] += 1
        if r.get("victory"):
            themes[t]["victories"] += 1

    for t, d in themes.items():
        avg_s = statistics.mean(d["succeser"])
        v_rate = d["victories"] / d["count"] * 100
        print(f"  {t}:")
        print(f"    Spil: {d['count']}, Gns. succeser: {avg_s:.1f}, Sejr-rate: {v_rate:.0f}%")

    # --- Per pony type ---
    print("\n--- Per Pony Type ---")
    ponies = {}
    for r in runs:
        p = r["pony_type"]
        if p not in ponies:
            ponies[p] = {"succeser": [], "victories": 0, "count": 0}
        ponies[p]["succeser"].append(r["succeser"])
        ponies[p]["count"] += 1
        if r.get("victory"):
            ponies[p]["victories"] += 1

    for p, d in ponies.items():
        avg_s = statistics.mean(d["succeser"])
        v_rate = d["victories"] / d["count"] * 100
        print(f"  {p}: {d['count']} spil, Gns. succeser: {avg_s:.1f}, Sejr-rate: {v_rate:.0f}%")

    # --- Per scene (across all themes) ---
    print("\n--- Scene Analyse (alle temaer samlet) ---")
    # Collect all scenes from all themes, indexed by (tema, scene_num)
    scene_data = {}
    for r in runs:
        tema = r["tema"]
        for i, res in enumerate(r["results"]):
            key = f"{tema} - Scene {i+1}"
            if key not in scene_data:
                scene_data[key] = {"successes": 0, "total": 0}
            scene_data[key]["total"] += 1
            if res["succes"]:
                scene_data[key]["successes"] += 1

    # Sort by success rate
    sorted_scenes = sorted(scene_data.items(), key=lambda x: x[1]["successes"] / x[1]["total"])
    print("\n  Sværeste scener (laveste succesrate):")
    for key, d in sorted_scenes[:5]:
        rate = d["successes"] / d["total"] * 100
        print(f"    {key}: {rate:.0f}% ({d['successes']}/{d['total']})")

    print("\n  Letteste scener (højeste succesrate):")
    for key, d in sorted_scenes[-5:][::-1]:
        rate = d["successes"] / d["total"] * 100
        print(f"    {key}: {rate:.0f}% ({d['successes']}/{d['total']})")

    # --- Balance assessment ---
    print("\n--- Balance Vurdering ---")
    overall_rate = avg_succeser / runs[0]["total_scenes"]
    if overall_rate >= 0.8:
        print("  ⚠️  Spillet er FOR LET — de fleste passer næsten alle scener")
    elif overall_rate >= 0.6:
        print("  ✓  God balance — børn vil føle succes men også møde udfordring")
    elif overall_rate >= 0.4:
        print("  ⚠️  Spillet er MELLEMSVÆRT — kan være frustrerende for 4-årige")
    else:
        print("  ⚠️  Spillet er FOR SVÆRT — 4-årige vil blive frustrerede")

    if victory_count / total > 0.7:
        print("  ⚠️  Sejr-rate over 70% — børnespil skal have ~50-60% sejr")
    elif victory_count / total < 0.3:
        print("  ⚠️  Sejr-rate under 30% — for svært for målgruppen")
    else:
        print(f"  ✓  Sejr-rate {victory_count/total*100:.0f}% — inden for rimeligt område")

    # --- Stats balance ---
    print("\n--- Stat Balance ---")
    stat_rolls = {}  # stat -> list of pass rates
    for r in runs:
        for res in r["results"]:
            stat = res.get("stat", "?")
            if stat not in stat_rolls:
                stat_rolls[stat] = []
            stat_rolls[stat].append(1 if res["succes"] else 0)

    for stat, vals in sorted(stat_rolls.items()):
        rate = statistics.mean(vals) * 100
        count = len(vals)
        emoji = {"krop": "💪", "sind": "🧠", "charme": "💕"}.get(stat, "")
        print(f"  {emoji} {stat}: {rate:.0f}% succes over {count} kast")

    # --- Difficulty distribution ---
    print("\n--- Sværhedsfordeling ---")
    diff_counts = {"let": 0, "normal": 0, "svaert": 0}
    for tema in THEMAER:
        for scn in tema.get("scener", []):
            diff_counts[scn.get("svaer", "normal")] += 1
    total_scenes = sum(diff_counts.values())
    for diff, count in diff_counts.items():
        pct = count / total_scenes * 100
        label = {"let": "Nem", "normal": "Normal", "svaert": "Svær"}.get(diff, diff)
        print(f"  {label}: {count} scener ({pct:.0f}%)")

    print("\n" + "=" * 60)


if __name__ == "__main__":
    evaluate()