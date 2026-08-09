#!/usr/bin/env python3
"""
My Little Pony: Tails of Equestria - Ny Spiller Generator
Genererer tilfældige ponyer, eventyrtema, og kører scener med d6-pulje.
Output kan bruges direkte af en GM til narration.
"""

import random

# === DATA ===

PONITYPER = ["Earth Pony", "Pegasus", "Unicorn", "Alicorn", "Changeling", "Otherkin", "Minion"]

TALENTER = [
    "Atlete", "Ekspert", "Kamp", "Kreativ", "Dyreven", "Magi",
    "Listig", "Lider", "Sælgjer", "Overlever",
]

SAREHEDER = [
    "Modig", "Ridderlig", "Ambitiøs", "Trofast", "Eventyrlysten",
    "Gavmild", "Fornuftig", "Glat", "Intuitiv", "Makaber",
    "Opfindsom", "Praktisk", "Stolt", "Underlig",
]

EGENSKABER = ["krop", "sind", "charme"]

EGENSKAB_NAVNE = {
    "krop": "Krop",
    "sind": "Sind",
    "charme": "Charme",
}

SVAERHED = {"let": 1, "normal": 2, "svaert": 3, "meget_svaert": 4}

# === EQUESTRIA STEDER (rigtige Equestria-steder) ===
# Vælges tilfældigt som setting for eventyret.
EQUESTRIA_STEDER = [
    {"navn": "Ponyville", "beskrivelse": "Den fredelige landsby i hjertet af Equestria — blomster, hytter, og altid en ven i nærheden."},
    {"navn": "Canterlot", "beskrivelse": "Den majestætiske kongebye bygget ind i bjergsiden — tårne, broer, og kongelig magi."},
    {"navn": "Cloudsdale", "beskrivelse": "Skybyen i himlen — skiftende vejr, skyggebroer, og regnbuenes ophavsted."},
    {"navn": "Fillydell", "beskrivelse": "Den rolige markby med endeløse marker — rolig, idyllisk, men med gamle hemmeligheder under jorden."},
    {"navn": "Maretime Bay", "beskrivelse": "Den trængte kystby med havn, tåge, og farlige farvande — pirater og mystik trives her."},
    {"navn": "Crystal Prep", "beskrivelse": "Krystalkollegiet i Canterlot — skinner som et juvel, men gemmer på magiske undergrundsgange."},
    {"navn": "Zecoras tætte skov", "beskrivelse": "Everfree-skovens yderkanter — mork, farlig, men med urter, myter og gamle ånder."},
    {"navn": "Saddle Arabia", "beskrivelse": "Ørkenkongeriget — varme, krydderier, og gamle ruiner begravet i sandet."},
    {"navn": "Yakyakistan", "beskrivelse": "Yak-kongeriget i bjergene — stolt, støjende, og altid klar til fest eller kamp."},
    {"navn": "Mehko's Retreat", "beskrivelse": "En stille oase i ørkenen — ro, meditation, og gamle mystikere der trækker sig tilbage."},
]

# === KENDTE NPCs (bi-figurer fra rigtige MLP-univers) ===
# Hver NPC: navn, race, personlighed, handlinger (hvad de gør ved møde)
KENDTE_NPCS = [
    {
        "navn": "Zecora",
        "race": "Zebra",
        "personlighed": "Mystisk, vis, taler i vers — skovenes healer og urtekundskabsmester.",
        "handlinger": [
            "byder et urtedrik der helbreder alle sår",
            "advarer om at 'mørket er tættere på end du tror'",
            "giver en magisk pille der gør dig usynlig i 3 scener",
        ],
    },
    {
        "navn": "Discord",
        "race": "Kaos-guddom",
        "personlighed": "Utålelig, sjov, uforudsigelig — kan forvandle alt hvad han rører ved. Mener det godt (næsten).",
        "handlinger": [
            "forvandler jorden til marshmallow og blokerer vejen",
            "byder hjælp — men kun hvis du kan få ham til at grine",
            "giver en ledetråd, men kun hvis du gætter hans yndlingsfarve",
        ],
    },
    {
        "navn": "Trixie",
        "race": "Unicorn",
        "personlighed": "Pralende, selvsikker, teater-tiltrukken — overdriver altid sin egen styrke. Hemmeligt bange.",
        "handlinger": [
            "praler af at kunne løse problemet alene — og forsøger",
            "blokerer vejen med 'magisk' skærm (der næsten virker)",
            "byder på information om fjenden, men kun hvis du roser hende",
        ],
    },
    {
        "navn": "Iron Will",
        "race": "Minotaur",
        "personlighed": "Motiverende, fysisk stærk, positiv — kan løfte bjerge og har altid en positiv tanke.",
        "handlinger": [
            "motivierer alle: 'Du kan det — bare tro på dig selv!'",
            "løfter en sten der blokerer vejen med lette hånd",
            "byder på en styrketræning der giver +1 krop i 2 scener",
        ],
    },
    {
        "navn": "Starlight Glimmer",
        "race": "Unicorn",
        "personlighed": "Godhjertet, men med en mørk fortid — har lært at magi ikke er svaret på alt.",
        "handlinger": [
            "bruger magi til at afsløre en skjult dør",
            "advarer om at 'magi uden kærlighed er tom'",
            "byder på en hemmelig opskrift til at bekæmpe fjenden",
        ],
    },
    {
        "navn": "Gilda",
        "race": "Pegasus",
        "personlighed": "Gruff, ligeglad, direkte — skjuler et blødt hjerte under et hårdt ydre.",
        "handlinger": [
            "flyver dig hen over et farligt område (hvis du ikke irriterer hende)",
            "har set noget underligt fra himlen — giver info",
            "blokerer vejen med en tordenvejrsfront hun har lavet",
        ],
    },
    {
        "navn": "Princess Cadance",
        "race": "Alicorn",
        "personlighed": "Kærlig, vis, omsorgsfuld — har magi af kærlighed og kan læse tanker.",
        "handlinger": [
            "læser dine tanker og afslører en sandhed du ikke vidste",
            "byder kærlighedsmagi der helbreder og styrker",
            "advarer om at 'den rigtige vej er gennem hjertet, ikke sværdet'",
        ],
    },
    {
        "navn": "Spike",
        "race": "Drage",
        "personlighed": "Lille, modig, loyal — Twilight's ven og assistent. Kan sende krystalliniske breve.",
        "handlinger": [
            "brænder en barriere væk med drageild",
            "bringer et beskæft fra Twilight Sparkle med nyttige oplysninger",
            "tyver en nøgle fra fjenden mens ingen ser",
        ],
    },
]

# Ponynavne (danske/mytiske temaer)
PONYNAMNE_FORAETTER = [
    "Stjern", "Regnbue", "Glitter", "Silke", "Måne", "Sol",
    "Blomst", "Kry", "Ly", "Dug", "Is", "Flint",
    "Torden", "Skum", "Ros", "Vind", "Skov", "Bæk",
]
PONYNAMNE_EFTERAETTER = [
    "hals", "støv", "ros", "vinge", "blomst", "fyr",
    "blik", "klo", "horn", "hoved", "fod", "mave",
    "hjørne", "snude", "pels", "mane", "sko", "lys",
]

# Adventure temaer med fjende og stakes
THEMAER = [
    {
        "titel": "Skyggen Over Equestria",
        "fjende": "Den Gamle Skygge",
        "stakes": "Hvis skyggen ikke stoppes, visner alle blomster i Equestria og krystallerne mister deres kraft.",
        "scener": [
            ("Stjernen Falder", "En mystisk stjerne er faldet fra himlen. Deres er noget forkert i luften.", "charme", "normal"),
            ("Skygge-Skoven", "Grenene vrider sig som fingre. Stien er borte.", "sind", "svaert"),
            ("Krystalklitternes Hemmelighed", "Den centrale krystal er sprækket — skyggen suger dens kraft.", "sind", "meget_svaert"),
            ("Skyggeponyens Angreb", "Skyggen har form: en enorm skygge-pony med horn som torne.", "krop", "svaert"),
            ("Tale Mod Skyggen", "Bag mørket ses en lille, bange pony der har glemt solen.", "charme", "svaert"),
            ("Venskabets Kraft", "Alle ponyer giver deres kraft til den sidste kamp.", "krop", "meget_svaert"),
        ],
    },
    {
        "titel": "Havdypens Forbandede Skat",
        "fjende": "Kong Seadrakes",
        "stakes": "Seadrakes har stjålet Havdypen — den hemmelige kilde til Equestrias regnvand. Uden den tørrer landet ud.",
        "scener": [
            ("Strandens Hemmelighed", "Skummet på stranden bærer et budskab skrevet i perler.", "sind", "let"),
            ("Undervandsklosteret", "Ponyerne dykker ned i det gamle undervandskloster med Seadrakes troldom.", "krop", "normal"),
            ("Den Blinde Gryde", "Seadrakes' gryde holder dem fanget. De må finde vejen ud.", "sind", "svaert"),
            ("Perletræets Hemmelighed", "Perletræet gemmer Hemmeligheden om Havdypens besværrelse.", "sind", "normal"),
            ("Kong Seadrakes' Hule", "Seadrakes venter med sit kongelege af søkronen.", "krop", "svaert"),
            ("Perletræets Gave", "Ponyerne offerer en perle for at befri Havdypen.", "charme", "normal"),
            ("Sistaens Bølge", "Seadrakes' sidste angreb — en bølge der kan skylle alle væk.", "krop", "meget_svaert"),
        ],
    },
    {
        "titel": "Dæmonen i Krystalskoven",
        "fjende": "Dæmonen fra Krystalskoven",
        "stakes": "Dæmonen vil slukke alle krystaller i Equestria. Uden krystaller mister alle ponyer deres magi.",
        "scener": [
            ("Den Første Krystal Går I Stykker", "En krystal knækker — dæmonen er vækket.", "sind", "let"),
            ("Krystalvæggene Lukker", "Krystalvæggene lukker sig. Ponyerne må finde en vej igennem.", "krop", "normal"),
            ("Krystallens Hjerte", "Krystallens Hjerte slår stadig — men svagt.", "sind", "svaert"),
            ("Dæmonens Skygger", "Skygger angriber fra krystallernes refleksioner.", "krop", "svaert"),
            ("Den Gamle Krystalprins", "En gammel krystalprins husker dæmonens svaghed.", "charme", "normal"),
            ("Krystallens Kraft", "Alle ponyer giver deres magi til Krystallens Kraft.", "sind", "meget_svaert"),
        ],
    },
    {
        "titel": "Stjerneridderne vender tilbage",
        "fjende": "Stjerneridderne",
        "stakes": "Stjerneridderne vender tilbage for at erobre Equestria og stjæle alle ponyers magi.",
        "scener": [
            ("Himmelskiven Falder", "En stjerne falder fra himlen — en stjerneridder er landet.", "sind", "let"),
            ("Den Faldne Ridder", "Den faldne ridder kan hjælpe — eller forråde.", "charme", "normal"),
            ("Stjerneridderne Lager", "Stjerneridderne lager — et stort lager under jorden.", "krop", "svaert"),
            ("Den Sidste Stjerne", "Den sidste stjerne gemmer en hemmelighed om ridderne.", "sind", "normal"),
            ("Kongens Ansigt", "Stjerneridderne's ansigt afsløres — en pony de kendte engang.", "charme", "svaert"),
            ("Den Sidste Stjernes Kamp", "Alle ponyer kæmper for at stoppe Stjerneridderne.", "krop", "meget_svaert"),
        ],
    },
    {
        "titel": "Den Forbudte Skov",
        "fjende": "Skovens Ånd",
        "stakes": "Den Forbudte Skov vokser dag for dag. Hvis den når Ponyville, sluges hele byen af træer og rødder.",
        "scener": [
            ("Skovens Rødder Nærmer Sig", "Rødder kigger op af jorden. Skoven vokser.", "sind", "let"),
            ("Den Gamle Skovmand", "En gammel skovmand ved, hvordan man stopper skoven.", "charme", "normal"),
            ("Skovens Ånd", "Skovens Ånd venter i den gamle eges skygge.", "sind", "svaert"),
            ("Den Forbudte Krystal", "Krystallen i skovens hjerte er forbandet.", "sind", "normal"),
            ("Træernes Angreb", "Træerne angriber — rødder og grene som våben.", "krop", "svaert"),
            ("Skovens Ånds Tale", "Ånden kan tales til — men kræver en offer.", "charme", "svaert"),
            ("Den Sidste Rod", "Den sidste rod må fjernes før skoven vokser igen.", "krop", "meget_svaert"),
        ],
    },
    {
        "titel": "Chrysalis' Skygge-Armé",
        "fjende": "Queen Chrysalis",
        "stakes": "Chrysalis har vendt alle changelings til skygge-monstre. Hvis hun nås til Canterlot, falder Equestria.",
        "scener": [
            ("De Første Skygger", "Changelings vender tilbage — men ikke som de var.", "sind", "let"),
            ("Chrysalis' Budbringere", "Chrysalis sender budbringere — de må stoppes.", "krop", "normal"),
            ("Den Forbudte Krystal", "Krystallen i skovens hjerte er forbandet af Chrysalis' magi.", "sind", "normal"),
            ("Skygge-Armén Angriber", "Skygge-monstre angriber fra alle sider.", "krop", "svaert"),
            ("Chrysalis' Hule", "Chrysalis venter i sin hule med skygge-kræfter.", "krop", "svaert"),
            ("Tale Til Chrysalis", "Chrysalis har en svaghed — ensomhed. Kan man tale til hende?", "charme", "svaert"),
            ("Den Sidste Kamp", "Alle ponyer kæmper sammen mod Chrysalis' sidste angreb.", "krop", "meget_svaert"),
        ],
    },
]


# === TERNINGE ===

def kast_d6_pool(antal):
    """Kast antal D6-terninger. Returnerer liste med resultater."""
    if antal < 1:
        return []
    return [random.randint(1, 6) for _ in range(antal)]


def tel_succes(terninger):
    """
    Tæl succeser fra terningeresultater.
    6 = fantastisk succes (tæller dobbelt)
    4-5 = én succes
    1 = ulykke
    """
    succeser = 0
    for t in terninger:
        if t == 6:
            succeser += 2
        elif t >= 4:
            succeser += 1
    return succeser


def tel_ulykker(terninger):
    return terninger.count(1)


def tel_fantastiske(terninger):
    return terninger.count(6)


# === TEST ===

def test(pony, egenskab, svaerhedsgrad, talent=None):
    """
    Lav en test: egenskab + evt. talent mod sværhedsgrad.
    Returnerer dict med detaljer.
    """
    if egenskab not in EGENSKABER:
        return {"error": f"Ukendt egenskab: {egenskab}"}

    terning_antal = pony[egenskab]
    if talent and talent in pony["talenter"]:
        terning_antal += 1

    krav = SVAERHED.get(svaerhedsgrad, 2)

    resultat = kast_d6_pool(terning_antal)
    succeser = tel_succes(resultat)
    ulykker = tel_ulykker(resultat)
    fantastiske = tel_fantastiske(resultat)

    navn = EGENSKAB_NAVNE.get(egenskab, egenskab)
    terning_del = f"{navn} ({terning_antal}D6)"
    if talent:
        terning_del += f" + {talent}"

    if succeser >= krav:
        overskud = succeser - krav
        udfald = "SUCCES"
        beskrivelse = f"Succes! ({succeser} succeser, behøvede {krav})"
        if overskud >= 3:
            beskrivelse += " — En fantastisk bedrift! Alle imponerede!"
        elif overskud >= 1:
            beskrivelse += " — Det lykkedes flot!"
    else:
        overskud = -(krav - succeser)
        udfald = "MISLYKKES"
        beskrivelse = f"Mislykkes ({succeser} succeser, behøvede {krav})"
        if ulykker > 0:
            beskrivelse += f" — {ulykker} ulykke(r)! Noget gik helt galt!"

    return {
        "pony": pony["navn"],
        "egenskab": navn,
        "terning_antal": terning_antal,
        "talent": talent,
        "resultat": resultat,
        "succeser": succeser,
        "ulykker": ulykker,
        "fantastiske": fantastiske,
        "krav": krav,
        "svaerhedsgrad": svaerhedsgrad,
        "overskud": overskud,
        "udfald": udfald,
        "beskrivelse": beskrivelse,
        "terning_del": terning_del,
    }


# === PONY GENERERING ===

def generer_pony():
    """Generer en tilfældig pony med navn, type, stats, talenter og særheder."""
    navn = random.choice(PONYNAMNE_FORAETTER) + random.choice(PONYNAMNE_EFTERAETTER)
    ponytype = random.choice(PONITYPER)
    krop = random.randint(1, 4)
    sind = random.randint(1, 4)
    charme = random.randint(1, 4)
    # Tilføj typebonus
    if ponytype == "Earth Pony":
        krop = min(krop + 1, 5)
    elif ponytype == "Unicorn":
        sind = min(sind + 1, 5)
    elif ponytype == "Pegasus":
        krop = min(krop + 1, 5)
    elif ponytype == "Alicorn":
        krop = min(krop + 1, 5)
        sind = min(sind + 1, 5)
        charme = min(charme + 1, 5)
    elif ponytype == "Changeling":
        charme = min(charme + 1, 5)

    talenter = random.sample(TALENTER, k=random.randint(1, 3))
    saerheder = random.sample(SAREHEDER, k=random.randint(1, 2))

    # Typ-specifikke talenter
    if ponytype == "Earth Pony" and "Overlever" not in talenter:
        talenter.append("Overlever")
    elif ponytype == "Unicorn" and "Magi" not in talenter:
        talenter.append("Magi")
    elif ponytype == "Pegasus" and "Atlete" not in talenter:
        talenter.append("Atlete")
    elif ponytype == "Alicorn" and "Lider" not in talenter:
        talenter.append("Lider")

    return {
        "navn": navn,
        "type": ponytype,
        "krop": krop,
        "sind": sind,
        "charme": charme,
        "talenter": talenter,
        "saerheder": saerheder,
    }


# === OUTPUT FORMATTERING ===

def print_header(titel):
    print(f"\n{'=' * 60}")
    print(f"  {titel}")
    print(f"{'=' * 60}")


def print_pony(pony):
    print(f"\n{'─' * 40}")
    print(f"  🦄 {pony['navn']}")
    print(f"  Type: {pony['type']}")
    print(f"  Krop:   {'♥' * pony['krop']}{'♡' * (5 - pony['krop'])} ({pony['krop']})")
    print(f"  Sind:   {'♥' * pony['sind']}{'♡' * (5 - pony['sind'])} ({pony['sind']})")
    print(f"  Charme: {'♥' * pony['charme']}{'♡' * (5 - pony['charme'])} ({pony['charme']})")
    print(f"  Talenter: {', '.join(pony['talenter'])}")
    print(f"  Særheder: {', '.join(pony['saerheder'])}")


def print_test(test_resultat, nummer):
    print(f"\n  🎲 [Kast {nummer}] {test_resultat['pony']} tester: {test_resultat['terning_del']} mod {test_resultat['svaerhedsgrad']}")
    print(f"     Resultat: {test_resultat['resultat']}")
    if test_resultat['udfald'] == "SUCCES":
        print(f"     ✅ {test_resultat['beskrivelse']}")
        if test_resultat['fantastiske'] > 0:
            print(f"     ✦ {test_resultat['fantastiske']} fantastisk(e) succes(er)!")
    else:
        print(f"     ❌ {test_resultat['beskrivelse']}")
        if test_resultat['ulykker'] > 0:
            print(f"     ⚠️  {test_resultat['ulykker']} ulykke(r) — noget gik helt galt!")


def print_test_table(all_tests):
    """Udskriv en samlet terningkast-tabel."""
    print(f"\n{'─' * 60}")
    print(f"  SAMLEDE TERNINGKASTER")
    print(f"{'─' * 60}")
    print(f"  {'#':<3} {'Pony':<15} {'Terninger':<12} {'Succeser':<8} {'Udfald':<10}")
    for i, t in enumerate(all_tests, 1):
        print(f"  {i:<3} {t['pony']:<15} {str(t['resultat']):<12} {t['succeser']:<8} {t['udfald']:<10}")
    succeser = sum(1 for t in all_tests if t['udfald'] == "SUCCES")
    total = len(all_tests)
    pct = round(succeser / total * 100) if total else 0
    print(f"\n  ** {succeser} af {total} succeser ({pct}%) **")


# === HUVUDKØRSEL ===

def main():
    random.seed()  # Tilfældig seed hver gang

    print_header("MY LITTLE PONY: TAILS OF EQUESTRIA")
    print("  — Ny Spiller Generator —")
    print("  Genereret af Hermes AI GM")

    # Generer 4-6 ponyer
    ant_al_ponyer = random.randint(4, 6)
    print(f"\nGenererer {ant_al_ponyer} ponyer...")
    ponies = [generer_pony() for _ in range(ant_al_ponyer)]

    print_header("DINE PONYER")
    for p in ponies:
        print_pony(p)

    # Vælg tema og setting
    tema = random.choice(THEMAER)
    sted = random.choice(EQUESTRIA_STEDER)
    print_header(f"EVENTYR: {tema['titel'].upper()}")
    print(f"  SETTING: {sted['navn']} — {sted['beskrivelse']}")
    print(f"  Fjende: {tema['fjende']}")
    print(f"  Stakes: {tema['stakes']}")

    # Kør scener (5-7)
    scenes = tema['scener']
    ant_al_scener = min(len(scenes), random.randint(5, 7))
    scenes_at_koere = scenes[:ant_al_scener]

    print_header(f"HANDLING ({ant_al_scener} SCENER)")
    all_tests = []
    scene_nummer = 0

    for scene in scenes_at_koere:
        scene_nummer += 1
        scene_navn, scene_beskrivelse, egenskab, svaerhedsgrad = scene

        print(f"\n{'─' * 60}")
        print(f"  SCENE {scene_nummer}: {scene_navn.upper()}")
        print(f"{'─' * 60}")
        print(f"  {scene_beskrivelse}")

        # Tilfældig NPC-møde (20% chance)
        if random.random() < 0.2:
            npc = random.choice(KENDTE_NPCS)
            handling = random.choice(npc["handlinger"])
            print(f"\n  🎭 NPC-MØDE: {npc['navn']} ({npc['race']}) dukker op og {handling}")
            print(f"     ({npc['personlighed']})")

        # Vælg hvilken pony der tester (tilfældig, men foretrækker relevante stats)
        test_pony = random.choice(ponies)

        # Find relevant talent baseret på egenskab
        relevant_talent = None
        if egenskab == "krop":
            for t in test_pony["talenter"]:
                if t in ["Atlete", "Kamp", "Overlever"]:
                    relevant_talent = t
                    break
        elif egenskab == "sind":
            for t in test_pony["talenter"]:
                if t in ["Magi", "Ekspert", "Listig", "Opfindsom"]:
                    relevant_talent = t
                    break
        elif egenskab == "charme":
            for t in test_pony["talenter"]:
                if t in ["Lider", "Sælgjer", "Dyreven"]:
                    relevant_talent = t
                    break

        result = test(test_pony, egenskab, svaerhedsgrad, relevant_talent)
        all_tests.append(result)
        print_test(result, len(all_tests))

        # Hvis succes, lav en bonus-test fra en anden pony (for variation)
        if result["udfald"] == "SUCCES" and result["overskud"] >= 2:
            bonus_pony = random.choice([p for p in ponies if p["navn"] != test_pony["navn"]])
            bonus_egen = random.choice(EGENSKABER)
            bonus_sv = random.choice(["let", "normal", "svaert"])
            bonus_result = test(bonus_pony, bonus_egen, bonus_sv)
            all_tests.append(bonus_result)
            print_test(bonus_result, len(all_tests))
            print(f"\n  🌟 BONUS: {bonus_pony['navn']} hjælper med!")

    # Slutopgørelse
    print_header("SLUTOPOPGØRELSE")
    succeser = sum(1 for t in all_tests if t["udfald"] == "SUCCES")
    fiaskoer = sum(1 for t in all_tests if t["udfald"] == "MISLYKKES")
    fantastiske_total = sum(t["fantastiske"] for t in all_tests)

    print(f"\n  Total succeser: {succeser}")
    print(f"  Total fiaskoer: {fiaskoer}")
    print(f"  Fantastiske terninger (6): {fantastiske_total}")

    if succeser > fiaskoer:
        print(f"\n  🌟 SEJR! Ponyerne har overvundet {tema['fjende']}!")
        print(f"  {tema['stakes']}")
        if fantastiske_total >= 3:
            print(f"  ✦ EPISKE SEJR! Alle i Equestria hylder dem!")
    elif succeser == fiaskoer:
        print(f"\n  ⚖️  BLANDET RESULTAT. Ponyerne har kæmpet hårdt, men {tema['fjende']} trækker sig tilbage midlertidigt.")
        print(f"  {tema['stakes']}")
    else:
        print(f"\n  💀 Nederlag. {tema['fjende']} har vundet denne gang.")
        print(f"  {tema['stakes']}")

    print_test_table(all_tests)

    print(f"\n{'=' * 60}")
    print("  FÆRDIG")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()