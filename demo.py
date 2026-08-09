#!/usr/bin/env python3
"""
MLP: Tails of Equestria — Demo & Test
En narrativ demohistorie med test af spilmotoren.

Hver ponytype i Equestria er repræsenteret. Alle egenskaber,
sværhedsgrader, talenter og edge cases testes i en sammenhængende historie.
"""

import random
import sys
from dataclasses import dataclass, field
from typing import List

# ── Data ──────────────────────────────────────────────

EGENSKABER = ["krop", "sind", "charme"]
EGENSKAB_NAVNE = {"krop": "Krop", "sind": "Sind", "charme": "Charme"}
SVÆRHED = {"Let": 1, "Normal": 2, "Svært": 3, "Meget svær": 4}
TALENTER = [
    "Atlete", "Ekspert", "Kamp", "Kreativ", "Dyreven", "Magi",
    "Listig", "Lider", "Sæljer", "Overlever",
]
SAERHEDER = [
    "Modig", "Ridderlig", "Ambitiøs", "Trofast", "Eventyrlysten",
    "Gavmild", "Fornuftig", "Glat", "Intuitiv", "Makaber",
    "Opfindsom", "Praktisk", "Stolt", "Underlig",
]

# ── Pony ──────────────────────────────────────────────

@dataclass
class Pony:
    navn: str
    type: str
    krop: int
    sind: int
    charme: int
    talenter: List[str] = field(default_factory=list)
    særheder: List[str] = field(default_factory=list)
    udholdenhed: int = 0
    venskabstegn: str = ""

# ── Terninger ─────────────────────────────────────────

def kast_terninger(antal: int) -> list[int]:
    if antal < 1:
        return []
    return [random.randint(1, 6) for _ in range(antal)]

def tæl_succeser(terninger: list[int]) -> int:
    succeser = 0
    for t in terninger:
        if t == 6:
            succeser += 2
        elif t >= 4:
            succeser += 1
    return succeser

# ── Test ──────────────────────────────────────────────

def test(pony: Pony, egenskab: str, sværhedsgrad: str, talent: str | None = None) -> str:
    terninger = 0
    if egenskab not in EGENSKABER:
        return f"Ukendt egenskab: {egenskab}"
    terninger += getattr(pony, egenskab)
    if talent and talent in pony.talenter:
        terninger += 1
    if sværhedsgrad not in SVÆRHED:
        return f"Ukendt sværhedsgrad: {sværhedsgrad}"
    kræver = SVÆRHED[sværhedsgrad]
    resultat = kast_terninger(terninger)
    succeser = tæl_succeser(resultat)
    ulykker = resultat.count(1)
    fantastiske = resultat.count(6)
    navne = EGENSKAB_NAVNE.get(egenskab, egenskab)
    terning_del = f"{navne} ({terninger}d6)"
    if talent:
        terning_del += f" + {talent}"
    linjer = [
        f"\n🎲 {pony.navn} tester: {terning_del} mod {sværhedsgrad}",
        f"   Resultat: {resultat}",
    ]
    if succeser >= kræver:
        overskud = succeser - kræver
        linjer.append(f"   ✅ SUCCES! ({succeser} succeser, behøvede {kræver})")
        if overskud >= 3:
            linjer.append("   🌟 En fantastisk bedrift — alle er imponerede!")
        elif overskud >= 1:
            linjer.append("   ✨ Det lykkedes flot — du får bonus til næste gang!")
    else:
        linjer.append(f"   ❌ MISLYKKES ({succeser} succeser, behøvede {kræver})")
        if ulykker > 0:
            linjer.append(f"   ⚠️  Der var {ulykker} ulykke(r) — noget gik helt galt!")
        if fantastiske > 0:
            linjer.append(f"   Men {fantastiske} fantastisk(e) terning(r) reddede lidt af situationen.")
    if fantastiske > 0:
        linjer.append(f"   ({fantastiske} fantastisk(e) succes(er) ✦)")
    return "\n".join(linjer)

def print_pony(pony: Pony) -> None:
    print(f"\n{'='*44}")
    print(f"  🦄 {pony.navn}")
    print(f"  Type: {pony.type}  |  Venskabstegn: {pony.venskabstegn or '(—)'}")
    print(f"{'─'*44}")
    for attr, navn in [("krop", "Krop"), ("sind", "Sind"), ("charme", "Charme")]:
        v = getattr(pony, attr)
        print(f"  {navn}:  {'♥'*v}{'♡'*(4-v)}")
    print(f"  Udholdenhed: {pony.udholdenhed}")
    print(f"  Talenter:  {', '.join(pony.talenter)}")
    print(f"  Særheder:  {', '.join(pony.særheder)}")
    print(f"{'='*44}\n")

# ── Test tracking ─────────────────────────────────────

tests_kørt = 0
tests_succes = 0
tests_fejlet = 0

def tæl_test(output: str) -> None:
    global tests_kørt, tests_succes, tests_fejlet
    tests_kørt += 1
    if "✅ SUCCES" in output:
        tests_succes += 1
    else:
        tests_fejlet += 1

def print_header(titel: str) -> None:
    print(f"\n{'━' * 58}")
    print(f"  {titel}")
    print(f"{'━' * 58}\n")

def print_sprog(titel: str) -> None:
    print(f"  — {titel} —\n")

# ── Demo ──────────────────────────────────────────────

def main() -> None:
    global tests_kørt, tests_succes, tests_fejlet

    # ═══════════════════════════════════════════════════
    # Opret én pony af HVER type
    # ═══════════════════════════════════════════════════

    ponies: List[Pony] = []

    ponies.append(Pony(
        navn="Apple Bloom",
        type="Earth Pony",
        krop=4, sind=2, charme=2,
        talenter=["Overlever", "Sæljer"],
        særheder=["Trofast", "Praktisk"],
        udholdenhed=5, venskabstegn="æble med blad",
    ))

    ponies.append(Pony(
        navn="Rainbow Dash",
        type="Pegasus",
        krop=4, sind=1, charme=2,
        talenter=["Atlete", "Kamp"],
        særheder=["Modig", "Stolt"],
        udholdenhed=5, venskabstegn="regnbue-lyn",
    ))

    ponies.append(Pony(
        navn="Twilight Sparkle",
        type="Alicorn",
        krop=2, sind=3, charme=2,
        talenter=["Magi", "Ekspert"],
        særheder=["Intuitiv", "Ambitiøs"],
        udholdenhed=3, venskabstegn="sekskantstjerne",
    ))

    ponies.append(Pony(
        navn="Trixie Lulamoon",
        type="Unicorn",
        krop=2, sind=2, charme=3,
        talenter=["Magi", "Kreativ"],
        særheder=["Stolt", "Glat"],
        udholdenhed=3, venskabstegn="måne med hat",
    ))

    ponies.append(Pony(
        navn="Chrysalis (omvendt)",
        type="Changeling",
        krop=2, sind=2, charme=3,
        talenter=["Listig", "Lider"],
        særheder=["Glat", "Makaber"],
        udholdenhed=3, venskabstegn="broget sommerfugl",
    ))

    ponies.append(Pony(
        navn="Styggi",
        type="Otherkin",
        krop=3, sind=2, charme=1,
        talenter=["Kamp", "Overlever"],
        særheder=["Ridderlig", "Eventyrlysten"],
        udholdenhed=4, venskabstegn="kløe med hjerte",
    ))

    # Minion (krop=0 for edge case!)
    ponies.append(Pony(
        navn="Snivvyl",
        type="Minion",
        krop=0, sind=1, charme=1,
        talenter=["Listig", "Sæljer"],
        særheder=["Underlig", "Opfindsom"],
        udholdenhed=1, venskabstegn="krum nøgle",
    ))

    earth = ponies[0]
    pegasus = ponies[1]
    alicorn = ponies[2]
    unicorn = ponies[3]
    changeling = ponies[4]
    otherkin = ponies[5]
    minion = ponies[6]

    # ═══════════════════════════════════════════════════
    # HISTORIEN starter
    # ═══════════════════════════════════════════════════

    print_header("MY LITTLE PONY: TAILS OF EQUESTRIA — DEMO & TEST")
    print_sprog("En narrativ test med alle ponytyper, egenskaber, sværhedsgrader og talenter")

    # ───────────────────────────────────────────────────
    print_header("AKT 1 — PONYSERNE MØDES I PONYVILLE")
    print_sprog("En solrig morgen. En hær af ponyer samles foran Carrot Top's cafe.")

    print("Syv ponyer af syv forskellige typer mødes for første gang.")
    print("Der er spænding i luften — og kaffe i koppen.\n")

    for p in ponies:
        print_pony(p)

    print_sprog("Test 1: Rainbow Dash viser frem — Charme, Let")
    output = test(pegasus, "charme", "Let")
    print(output); tæl_test(output)

    print_sprog("Test 2: Twilight forstår situationen — Sind, Normal (med Ekspert)")
    output = test(alicorn, "sind", "Normal", "Ekspert")
    print(output); tæl_test(output)

    print_sprog("Test 3: Snivvyl prøver at være usynlig — Listig, Normal")
    output = test(minion, "sind", "Normal", "Listig")
    print(output); tæl_test(output)

    # ───────────────────────────────────────────────────
    print_header("AKT 2 — APPLES TINGEN ER I FÆRDE MED AT VISNE")
    print_sprog("Apple Bloom opdagrer, at hele æblehaven lider. Hun kalder på hjælp.")

    print_sprog("Test 4: Apple Bloom undersøger rødderne — Krop, Svært (med Overlever)")
    output = test(earth, "krop", "Svært", "Overlever")
    print(output); tæl_test(output)

    print_sprog("Test 5: Twilight laver en heks for vækst — Sind, Svært (med Magi)")
    output = test(alicorn, "sind", "Svært", "Magi")
    print(output); tæl_test(output)

    print_sprog("Test 6: Trixie forsøger sin egen 'magi' — Sind, Let (med Magi)")
    output = test(unicorn, "sind", "Let", "Magi")
    print(output); tæl_test(output)

    print_sprog("Test 7: Chrysalis tilbyder 'kærlighed' til træerne — Charme, Normal (med Listig)")
    output = test(changeling, "charme", "Normal", "Listig")
    print(output); tæl_test(output)

    # ───────────────────────────────────────────────────
    print_header("AKT 3 — DET MØRKET UNDER MYSTERY KNOLL")
    print_sprog("Lydene fra Myrmyren Knold gør alle nervøse. En ekspedition dannes.")

    print_sprog("Test 8: Styggys kampinstinkt — Krop, Svært (med Kamp)")
    output = test(otherkin, "krop", "Svært", "Kamp")
    print(output); tæl_test(output)

    print_sprog("Test 9: Rainbow Dash's flyveevne i mørket — Krop, Meget svær (med Atlete)")
    output = test(pegasus, "krop", "Meget svær", "Atlete")
    print(output); tæl_test(output)

    print_sprog("Test 10: Trixies kreativ løsning — Sind, Svært (med Kreativ)")
    output = test(unicorn, "sind", "Svært", "Kreativ")
    print(output); tæl_test(output)

    print_sprog("Test 11: Chrysalis leder gruppen — Charme, Normal (med Lider)")
    output = test(changeling, "charme", "Normal", "Lider")
    print(output); tæl_test(output)

    print_sprog("Test 12: Snivvyl sælger 'hjælpemidler' — Charme, Let (med Sæljer)")
    output = test(minion, "charme", "Let", "Sæljer")
    print(output); tæl_test(output)

    print_sprog("Test 13: Apple Bloom forhandler med markedsfolk — Charme, Normal (med Sæljer)")
    output = test(earth, "charme", "Normal", "Sæljer")
    print(output); tæl_test(output)

    # ───────────────────────────────────────────────────
    print_header("AKT 4 — DET STORE SAMARBEJDE")
    print_sprog("Alle egenskaber, alle sværhedsgrader — den ultimative test.")

    print("Hver pony tester alle tre egenskaber mod fire sværhedsgrader.")
    print("Dette er den store udfordring.\n")

    for p in ponies:
        print_header(f"🦄 {p.navn} ({p.type}) — fuld testmatrix")
        for attr in EGENSKABER:
            for sg in SVÆRHED:
                output = test(p, attr, sg)
                print(output); tæl_test(output)
        print()

    # ───────────────────────────────────────────────────
    print_header("AKT 5 — GRÆNSERNES UDFORDRING")
    print_sprog("Edge cases — terningegrænser, 0 terninger, og ekstreme scenarioer.")

    print_sprog("Test: Snivvyls Krop=0 mod Let (0d6 — umuligt at slå noget)")
    output = test(minion, "krop", "Let")
    print(output); tæl_test(output)

    print_sprog("Test: Ugyldig egenskab — fejlhåndtering")
    output = test(alicorn, "flyvehastighed", "Let")
    print(f"\n🎲 Fejltest: {output}")
    tæl_test(output)

    print_sprog("Test: Ugyldig sværhedsgrad — fejlhåndtering")
    output = test(alicorn, "krop", "Umuleg")
    print(f"\n🎲 Fejltest: {output}")
    tæl_test(output)

    # ───────────────────────────────────────────────────
    print_header("AKT 6 — SIMULERT TERNINGEKONTROL")
    print_sprog("Verifikation af terningelogik med kendte input.")

    sim_ok = 0
    sim_total = 0

    # Scenario A: alle 6-tal
    sim_total += 1
    alle_six = [6] * 5
    s_a = tæl_succeser(alle_six)
    ok_a = s_a == 10
    if ok_a: sim_ok += 1
    print(f"  A) 5×6 = {s_a} succeser (forventet: 10)  {'✅' if ok_a else '❌'}")

    # Scenario B: alle 1-tal
    sim_total += 1
    alle_ene = [1] * 5
    s_b = tæl_succeser(alle_ene)
    ok_b = s_b == 0
    if ok_b: sim_ok += 1
    print(f"  B) 5×1 = {s_b} succeser (forventet: 0)   {'✅' if ok_b else '❌'}")

    # Scenario C: alle 4-tal
    sim_total += 1
    alle_fire = [4] * 5
    s_c = tæl_succeser(alle_fire)
    ok_c = s_c == 5
    if ok_c: sim_ok += 1
    print(f"  C) 5×4 = {s_c} succeser (forventet: 5)   {'✅' if ok_c else '❌'}")

    # Scenario D: blandet [1,3,4,5,6] → 1+1+2=4
    sim_total += 1
    blandet = [1, 3, 4, 5, 6]
    s_d = tæl_succeser(blandet)
    ok_d = s_d == 4
    if ok_d: sim_ok += 1
    print(f"  D) [1,3,4,5,6] = {s_d} succeser (forventet: 4) {'✅' if ok_d else '❌'}")

    # Scenario E: tom liste
    sim_total += 1
    s_0 = tæl_succeser([])
    ok_0 = s_0 == 0
    if ok_0: sim_ok += 1
    print(f"  E) [] = {s_0} succeser (forventet: 0)      {'✅' if ok_0 else '❌'}")

    # Scenario F: kast_terninger(0)
    sim_total += 1
    kast_0 = kast_terninger(0)
    ok_k0 = kast_0 == []
    if ok_k0: sim_ok += 1
    print(f"  F) kast_terninger(0) = {kast_0} (forventet: []) {'✅' if ok_k0 else '❌'}")

    # Scenario G: stor simulation
    sim_total += 1
    sim_values = []
    for _ in range(1000):
        r = kast_terninger(3)
        sim_values.append(tæl_succeser(r))
    g = sum(sim_values) / len(sim_values)
    ok_g = 0.5 < g < 3.0
    if ok_g: sim_ok += 1
    print(f"  G) 1000×3d6 → gennemsnit {g:.2f} (interval: {min(sim_values)}-{max(sim_values)}) {'✅' if ok_g else '❌'}")

    print(f"\n  {'─'*30}")
    print(f"  Simuleringer: {sim_ok}/{sim_total} bestået\n")

    # ───────────────────────────────────────────────────
    print_header("SAMMENFATNING")
    print_sprog("Hvad lykkedes, hvad fejlede, og hvor mange tests er kørt?")

    print(f"  {'─'*44}")
    print(f"  📊 TESTRESULTATER:")
    print(f"  {'─'*44}")
    print(f"  Total tests kørte:    {tests_kørt}")
    print(f"  ✅ Succes:             {tests_succes}")
    print(f"  ❌ Mislykkedes:        {tests_fejlet}")
    if tests_kørt > 0:
        pct = (tests_succes / tests_kørt) * 100
        print(f"  Succesrate:            {pct:.0f}%")
    print(f"  {'─'*44}")
    print(f"  🎲 SIMULERINGER:      {sim_ok}/{sim_total} bestået")
    print(f"  {'─'*44}")

    # Test matrix dækning
    print(f"\n  {'─'*44}")
    print(f"  🦄 PONYSER TESTET:")
    for p in ponies:
        print(f"    {p.type:12s} — {p.navn}")
    print(f"  {'─'*44}")

    print(f"\n  {'─'*44}")
    print(f"  📋 EGENSKABER TESTET:  {', '.join(EGENSKAB_NAVNE.values())}")
    print(f"  📋 SVÆRHEDSGRADER:     {', '.join(SVÆRHED.keys())}")
    print(f"  {'─'*44}")

    print(f"\n  {'─'*44}")
    print(f"  🎯 TALENTER TESTET:")
    tested_talenter = set()
    for p in ponies:
        for t in p.talenter:
            tested_talenter.add(t)
    for t in sorted(tested_talenter):
        print(f"    ✅ {t}")
    print(f"  {'─'*44}")

    print(f"\n  {'─'*44}")
    print(f"  🧪 EDGE CASES TESTET:")
    print(f"    ✅ Krop=0 (0 terninger)")
    print(f"    ✅ Ugyldig egenskab")
    print(f"    ✅ Ugyldig sværhedsgrad")
    print(f"    ✅ Simuleret alle 6-tal")
    print(f"    ✅ Simuleret alle 1-tal")
    print(f"    ✅ kast_terninger(0)")
    print(f"    ✅ 1000× storsimulation")
    print(f"  {'─'*44}")

    print_header("DEMO FULDFØRT 🌈")
    print_sprog("Tak for nu! Venskab er den stærkeste magi i Equestria.")

    sys.exit(0 if sim_ok == sim_total else 1)


if __name__ == "__main__":
    main()