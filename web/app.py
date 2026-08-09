#!/usr/bin/env python3
"""
My Little Pony: Tails of Equestria - Interaktivt Web Spil
For 4-årige: stort, farvegt, simpelt, én scene ad gangen.
"""

import os
import random
from flask import Flask, render_template, redirect, url_for, session, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
app.secret_key = 'equestria_magic_key_12345'
CORS(app, supports_credentials=True)

# === JSON API for React frontend ===
@app.route("/api/start", methods=["POST"])
def api_start():
    data = request.get_json(force=True)
    ponytype_idx = data.get("type")
    if ponytype_idx is None:
        return jsonify({"error": "Manglende pony type"}), 400
    ponytype_idx = int(ponytype_idx)
    tema_idx = int(data.get("tema", 0))
    session["spil"] = ny_spil()
    pt = PONITYPER[ponytype_idx]
    sp = session["spil"]
    sp["pony"]["type"] = pt["navn"]
    sp["pony"]["emoji"] = pt["emoji"]
    sp["pony"]["krop"] = random.randint(2, 4)
    sp["pony"]["sind"] = random.randint(2, 4)
    sp["pony"]["charme"] = random.randint(2, 4)
    if pt["bonus"] == "krop":
        sp["pony"]["krop"] = min(sp["pony"]["krop"] + 1, 5)
    elif pt["bonus"] == "sind":
        sp["pony"]["sind"] = min(sp["pony"]["sind"] + 1, 5)
    elif pt["bonus"] == "alle":
        sp["pony"]["krop"] = min(sp["pony"]["krop"] + 1, 5)
        sp["pony"]["sind"] = min(sp["pony"]["sind"] + 1, 5)
        sp["pony"]["charme"] = min(sp["pony"]["charme"] + 1, 5)
    sp["tema"] = THEMAER[tema_idx]
    return jsonify(api_scene_data(sp))

@app.route("/api/scene", methods=["GET"])
def api_scene():
    sp = session.get("spil")
    if not sp:
        return jsonify({"error": "no game"}), 404
    return jsonify(api_scene_data(sp))

@app.route("/api/kast", methods=["POST"])
def api_kast():
    sp = session.get("spil")
    if not sp or sp.get("færdig"):
        return jsonify({"error": "no game"}), 404
    scn = sp["tema"]["scener"][sp["scene"]]
    stat = scn["stat"]
    svaer = scn["svaer"]
    succes, dice, succ_count, krav = lav_test(sp["pony"], stat, svaer)
    udfald = {
        "aktion": scn["aktion"],
        "stat": stat,
        "svaer": svaer,
        "dice": dice,
        "succeser": succ_count,
        "krav": krav,
        "succes": succes,
        "tekst": scn["succes"] if succes else scn["fiasko"],
    }
    sp["historie"].append(udfald)
    sp["udfald_tekst"] = udfald["tekst"]
    if succes:
        sp["succeser"] += 1
    else:
        sp["fiaskoer"] += 1
    sp["scene"] += 1
    if sp["scene"] >= len(sp["tema"]["scener"]):
        sp["færdig"] = True
    session["spil"] = sp
    return jsonify(api_scene_data(sp))

def api_scene_data(sp):
    scn = None
    if not sp.get("færdig") and sp["scene"] < len(sp["tema"]["scener"]):
        scn = sp["tema"]["scener"][sp["scene"]]
    tema = sp["tema"]
    pony = sp["pony"]
    result = {
        "finished": sp.get("færdig", False),
        "ponyName": pony["navn"],
        "ponyType": pony["type"],
        "ponyEmoji": pony["emoji"],
        "ponyImg": f"/static/images/{_pony_img(pony['type'])}",
        "ponyStats": {
            "krop": pony["krop"],
            "sind": pony["sind"],
            "charme": pony["charme"],
        },
        "talent": pony.get("talent", ""),
        "tema": tema["titel"],
        "sceneNum": f"Scene {sp['scene'] + 1} af {len(tema['scener'])}",
        "progress": f"🌟 {'⭐' * sp['succeser']} {'☆' * (len(tema['scener']) - sp['succeser'] - sp['fiaskoer'])} ❌ {'💔' * sp['fiaskoer']}",
    }
    if scn:
        result.update({
            "sceneText": scn["tekst"],
            "actionText": scn["aktion"],
            "difficulty": _diff_text(scn["svaer"]),
        })
    else:
        result["sceneText"] = ""
        result["actionText"] = ""
        result["difficulty"] = ""
    result["history"] = []
    for h in sp.get("historie", []):
        result["history"].append({
            "action": h["aktion"],
            "dice": h["dice"],
            "success": h["succes"],
            "result": _result_text(h["succes"]),
            "story": h["tekst"],
        })
    if sp.get("færdig"):
        result["score"] = f"{sp['succeser']} succeser ud af {len(tema['scener'])}"
        if sp["succeser"] >= len(tema["scener"]):
            result["victory"] = True
            result["endText"] = "Fantastisk! Du reddede Equestria! 🌟"
        elif sp["succeser"] >= len(tema["scener"]) // 2:
            result["mixed"] = True
            result["endText"] = "Du gjorde dit bedste! Prøv igen for at blive endnu bedre! 💪"
        else:
            result["defeat"] = True
            result["endText"] = "Ingen panik! Alle ponies prøver igen! 🌈"
    return result

def _pony_img(navn):
    m = {"Jordpony": "jordpony.png", "Pegasus": "pegasus.png", "Enhjørning": "enhjorning.png", "Alicorn": "alicorn.png"}
    return m.get(navn, "jordpony.png")

def _diff_text(svaer):
    return {"let": "Nem 🌟", "normal": "Lidt svært 🌟🌟", "svaert": "Svært 🌟🌟🌟"}.get(svaer, "")

def _result_text(succes):
    return "✅ Succes!" if succes else "❌ Mislykket"

# === DATA ===

PONITYPER = [
    {"navn": "Jordpony",   "emoji": "🐴", "bonus": "krop", "tekst": "Stærk og dygtig!"},
    {"navn": "Pegasus",    "emoji": "🦅", "bonus": "krop", "tekst": "Flyver i himlen!"},
    {"navn": "Enhjørning", "emoji": "🦄", "bonus": "sind", "tekst": "Har magisk horn!"},
    {"navn": "Alicorn",    "emoji": "👑", "bonus": "alle", "tekst": "Magi OG vinger!"},
]

PONYNAMNE = [
    "Stjern", "Regnbue", "Glitter", "Silke", "Måne", "Sol",
    "Blomst", "Kry", "Ly", "Dug", "Is", "Flint",
    "Torden", "Skum", "Ros", "Vind", "Skov", "Bæk",
]

SVAERHED = {"let": 1, "normal": 2, "svaert": 3}
SVAERHED_NAVNE = {"let": "Nem 🌟", "normal": "Lidt svært 🌟🌟", "svaert": "Svært 🌟🌟🌟"}

STAT_EMOJI = {"krop": "💪", "sind": "🧠", "charme": "💕"}
STAT_NAVNE = {"krop": "Krop", "sind": "Sind", "charme": "Charme"}

# Børnevenlige temaer med rige scener
THEMAER = [
    {
        "titel": "Regnbues fødselsdag",
        "emoji": "🎂🌈",
        "intro": "Pinkie Pie vil lave en fødselsdagssurprise! Men melhylden er tom — du skal finde mel til kagen før alle vennerne kommer.",
        "scener": [
            {
                "tekst": "Du løber ind i supermarkedet. Melhylden er helt tom — kun en lille fuge af mel er tilbage. Du ser Mrs. Cake bag disken, der vifter med en note.",
                "aktion": "Spørg Mrs. Cake om mel",
                "stat": "charme", "svaer": "let",
                "succes": "Mrs. Cake smiler varmt. 'Ah, en lille pony der hjælper! Jeg har en ekstra pose bagved.' Hun rækker dig en stor pose mel med et glimt i øjet.",
                "fiasko": "Mrs. Cake ryster på hovedet. 'Desværre, alt mel er solgt.' Men hun hvisker: 'Prøv måske hos Zecora i skoven?'",
            },
            {
                "tekst": "Du finder Zecoras hytte i skoven. Den dufter af urter og honning. Zecora taler i vers — det er svær at forstå, men hun har noget der kan bruges!",
                "aktion": "Forstå Zecoras vers",
                "stat": "sind", "svaer": "normal",
                "succes": "Du lytter omhyggeligt. 'Dundrende urter, knus dem små, så bliver de til mel, se!' Du knuser urterne og får perfekt mel!",
                "fiasko": "Zecoras vers er for kryptisk. 'Dundrende...' hvad? Men hun giver dig alligevel en pose med noget der ligner mel.",
            },
            {
                "tekst": "Kagen er klar! Du skal sætte den i ovnen. Den skal være perfekt — ikke for brændt, ikke for rå. Ovnen gløder orange og varm.",
                "aktion": "Bag kagen i ovnen",
                "stat": "krop", "svaer": "normal",
                "succes": "Du trækker kagen ud på det perfekte tidspunkt! Den er gylden og dufter fantastisk. Pinkie Pie vil elske den!",
                "fiasko": "Kagen bliver lidt for brændt ovenpå. Men inde i er den stadig god — du skraber den brændte del af!",
            },
            {
                "tekst": "Nu skal kagen pyntes! Pinkie Pie vil have regnbueglasure, sprinkles og en lille pony-figur ovenpå. Det ser sværere ud end det lyder...",
                "aktion": "Pynt kagen perfekt",
                "stat": "krop", "svaer": "svaert",
                "succes": "Kagen er VAKKER! Regnbueglasuren skinner, sprinklerne er perfekt fordelt, og pony-figuren står lige midt på. Pinkie Pie vil græde af glæde!",
                "fiasko": "Glasuren løber lidt ud, og sprinklerne lander lidt tilfældigt. Men kagen er sød — og det er det vigtigste!",
            },
            {
                "tekst": "Kagen er klar! Nu skal alle ponyerne samles. Rainbow Dash er i luften, Fluttershy er i haven, og Rarity er i sit værksted. Du skal finde dem alle!",
                "aktion": "Find alle ponyerne",
                "stat": "charme", "svaer": "svaert",
                "succes": "Du finder dem alle! Rainbow Dash lander med et whoosh, Fluttershy kommer småløbende, og Rarity glimrer i solen. Alle er klar til fødselsdagen! 🎉",
                "fiasko": "Du finder de fleste — men Rainbow Dash er for hurtig at fange! Men det går fint, hun kommer alligevel når hun får lugtet kagen!",
            },
        ],
    },
    {
        "titel": "Angel er løbet væk",
        "emoji": "🐰💕",
        "intro": "Fluttershy er i gråd! Hendes lille kanin Angel er løbet væk. Du tilbyder at hjælpe med at finde ham.",
        "scener": [
            {
                "tekst": "Du løber ud i Fluttershys have. Blomsterne er høje og farverige — røde roser, gule solsikker, blå blåklatter. Angel kan være hvor som helst her!",
                "aktion": "Søg i blomsterhaven",
                "stat": "sind", "svaer": "let",
                "succes": "Du kigger bag en stor solsikke — og ser to små ører rulle frem! Angel gemte sig der! Men... han ser ud til at være løbet videre.",
                "fiasko": "Du leder og leder, men finder kun en sommerfugl og en bier. Angel er ikke her — men du finder små fodspor der peger væk!",
            },
            {
                "tekst": "Du løber gennem PonyVille. Alle ponyer er travle — Applejack pløjer, Rarity måler stof, og Twilight skriver noter. Har nogen set Angel?",
                "aktion": "Spørg alle ponyer i PonyVille",
                "stat": "charme", "svaer": "normal",
                "succes": "Rarity råber: 'En lille hvid kanin? Jeg så ham løbe mod bakken!' Du har en ledetråd!",
                "fiasko": "Ponyerne ryster på hovedet. 'En kanin?' Men Spike hvisker: 'Jeg så noget hvidt hoppe forbi...' Det må være ham!",
            },
            {
                "tekst": "Små fodspor fører gennem det høje græs. De er små og runde — typiske kanin-fodspor! De fører op ad bakken mod skoven.",
                "aktion": "Følg fodsporene",
                "stat": "sind", "svaer": "normal",
                "succes": "Fodsporene fører dig direkte til et stort træ! Du kigger op — og ser Angel sidde på en gren, der ryster nervøst.",
                "fiasko": "Fodsporene forsvinder i græsset. Men du hører et lille 'pip' fra et træ — Angel er deroppe!",
            },
            {
                "tekst": "Angel sidder højt oppe i et stort egetræ! Han ryster og græder. Træet er højt, og grenene er tynde. Du skal op til ham!",
                "aktion": "Klatr op i træet",
                "stat": "krop", "svaer": "svaert",
                "succes": "Du klatrer op ad stammen, gren for gren. Det er skræmmende højt, men du når Angel! Han hopper ned i dine arme med en lille glæde-pip!",
                "fiasko": "Du klatrer op, men grenen knækker under dig! Du lander blødt i en busk. Men Angel ser dig og hopper ned af sig selv!",
            },
            {
                "tekst": "Angel er i dine arme, men han er stadig bange. Han ryster og gemmer hovedet i pelsen. Du skal få ham til at føle sig tryg igen.",
                "aktion": "Berolig Angel",
                "stat": "charme", "svaer": "svaert",
                "succes": "Du stryger ham blidt over pelsen og synger en lille sang. Angel stopper med at ryste og slikker din kind! Fluttershy græder af glæde: 'Angel! Du har reddet ham!' 💕",
                "fiasko": "Angel er stadig en lille smule bange, men han holder fast i dit øre. Fluttershy smiler: 'Han bliver bedre — tak fordi du fandt ham!'",
            },
        ],
    },
    {
        "titel": "Æblerne ruller ned ad bakken",
        "emoji": "🍎🐴",
        "intro": "Applejacks æbleskure er væltet! Hundredevis af æbler ruller ned ad bakken. Hjælp med at redde høsten!",
        "scener": [
            {
                "tekst": "ÆBLER! Overalt! De ruller som små røde boulder ned ad bakken. Du skal gribe dem, før de rammer bunden!",
                "aktion": "Jag de rullende æbler",
                "stat": "krop", "svaer": "let",
                "succes": "Du griber og griber! Æbler i munden, æbler i halen, æbler i ørerne! Du redder halvdelen!",
                "fiasko": "Æblerne ruller for hurtigt! Du griber nogle få, men de fleste fortsætter ned ad bakken...",
            },
            {
                "tekst": "Mange æbler er landet i det høje, gyldne græs. De er svære at se — kun små røde prikker mellem græsstråene.",
                "aktion": "Saml æbler i højt græs",
                "stat": "krop", "svaer": "normal",
                "succes": "Du kravler gennem græsset og finder æblerne ét for ét! Din kurv er snart fyldt til randen!",
                "fiasko": "Græsset er højt, og du finder kun halvdelen. Men Apple Bloom hjælper med at finde resten!",
            },
            {
                "tekst": "Bækken glimrer i solen — og der svømmer røde æbler rundt i det! De er våde og glatte, svære at gribe.",
                "aktion": "Fisk æbler op af bækken",
                "stat": "krop", "svaer": "normal",
                "succes": "Du bøjer dig ned og griber æblerne ét for ét! Vandet er koldt, men det er sjovt! Alle æbler reddet!",
                "fiasko": "Æblerne er glatte! De glider ud af dine poter. Men du får fanget de fleste med halen!",
            },
            {
                "tekst": "Nu skal alle æbler bæres tilbage til gården! Kurven er TUNG. Bakken er STEIL. Men du kan gøre det!",
                "aktion": "Bær tunge kurve hjem",
                "stat": "krop", "svaer": "svaert",
                "succes": "Du bærer kurven op ad bakken med stolthed! Applejack råber: 'Du er stærkere end de fleste!' Alle æbler er i sikkerhed!",
                "fiasko": "Kurven er for tung! Du vælter og æblerne ruller lidt. Men Big Mac kommer og hjælper — sammen når I hjem!",
            },
            {
                "tekst": "Applejack står med tårer i øjnene. 'Du har reddet hele høsten,' hvisker hun. Hun rækker dig noget... en æblekage, lavet specielt til dig!",
                "aktion": "Modtag præmien fra Applejack",
                "stat": "charme", "svaer": "let",
                "succes": "Æblekagen er den bedste du nogensinde har smagt! Applejack giver dig et knus. 'Du er den bedste pony i hele Equestria!' 🍎",
                "fiasko": "Du får æblekagen, men den er lidt brændt. Applejack griner: 'Næste gang bliver den perfekt!'",
            },
        ],
    },
    {
        "titel": "Raritys glimmer-sten er borte",
        "emoji": "💎✨",
        "intro": "Rarity er i panik! Hendes kæreste glimmer-sten — den smukkeste sten i hele Equestria — er forsvundet! Du skal finde den.",
        "scener": [
            {
                "tekst": "Raritys værksted er et kaotisk paradis! Stofruller overalt, nåle i luften, og glitter på gulvet. Måske har stenen faldet et sted her?",
                "aktion": "Søg i Raritys værksted",
                "stat": "sind", "svaer": "let",
                "succes": "Du finder en glimt under en stofrulle! Men det er kun en lille krystall — ikke glimmer-stenen. Men det giver dig en idé!",
                "fiasko": "Værkstedet er for rodet! Du finder nåle, knapper og glitter — men ikke glimmer-stenen.",
            },
            {
                "tekst": "Du løber gennem PonyVille. Glimmer-stenen er så lysende — den burde være svær at overse. Har nogen set den?",
                "aktion": "Spørg i PonyVille",
                "stat": "charme", "svaer": "normal",
                "succes": "Spike råber: 'Jeg så Rarity droppe noget glitrende da hun løb forbi parken!' Du ved hvor du skal lede!",
                "fiasko": "Ingen har set stenen. Men Twilight hvisker: 'Måske kan min magi hjælpe?'",
            },
            {
                "tekst": "Parken er smuk i solen! Bænke, blomsterbede, og en lille sø. Glimmer-stenen skinner — du kan næsten SE den glitre et sted!",
                "aktion": "Søg i parken",
                "stat": "sind", "svaer": "normal",
                "succes": "Du ser et glimt ved søen! Glimmer-stenen ligger på en sten, der glitrer som en lille sol!",
                "fiasko": "Du leder overalt i parken. Men du finder en glimt der kommer fra vandet...",
            },
            {
                "tekst": "Glimmer-stenen er faldet i søen! Du kan SE den på bunden — den skinner! Men søen er dyb, og du skal dykke for at nå den.",
                "aktion": "Dyk efter glimmer-stenen",
                "stat": "krop", "svaer": "svaert",
                "succes": "Du dykker ned! Vandet er koldt, men du griber stenen! Du bryder overfladen med stenen i munden — den glitrer som aldrig før! 💎",
                "fiasko": "Du dykker, men stenen er for dybt! Men Fluttershy kommer og dykker med dig — sammen redder I stenen!",
            },
            {
                "tekst": "Rarity græder af glæde! 'Min glimmer-sten! Åh, du er en engel!' Hun omfavner dig og rækker dig en lille æske...",
                "aktion": "Modtag Raritys tak",
                "stat": "charme", "svaer": "let",
                "succes": "Inden i æsken er en lille glimmer-ørestift! 'Til dig, min søde ven!' Rarity hvisker. Du føler dig som en stjerne! ✨",
                "fiasko": "Rarity giver dig en knus i stedet. 'Du er bedre end nogen sten!' Og det føles faktisk bedre.",
            },
        ],
    },
    {
        "titel": "Discord laver sjov",
        "emoji": "🍰🐉",
        "intro": "Discord — den skøre drage — har forvandlet jorden til marshmallow! PonyVille er i kaos. Du skal fikse det!",
        "scener": [
            {
                "tekst": "Du træder ud — og dit ben synker ned i MARSHMALLOW! Overalt er hvid, blød masse. I det fjerne ser du en drage der griner hysterisk.",
                "aktion": "Find Discord",
                "stat": "sind", "svaer": "let",
                "succes": "Discord er umulig at overse! Han svæver i luften med en marshmallow-hat. 'Hej, lille pony! Vil du lege?' spørger han.",
                "fiasko": "Marshmallow er overalt! Det er svær at se. Men du hører Discords grin — og følger lyden!",
            },
            {
                "tekst": "Discord griner. 'Jeg vil kun fixe det, hvis du får mig til at grine! Det er min regel!' Han krydser armene og puster på næsen.",
                "aktion": "Få Discord til at grine",
                "stat": "charme", "svaer": "normal",
                "succes": "Du laver en latterlig dans — hoppende, snurrende, med munden skæv! Discord griner så meget at han næsten falder af himlen! 'OK, OK! Jeg fikser det!'",
                "fiasko": "Du fortæller en vittighed. Discord ryster på hovedet... men så fniser han! 'OK, det var faktisk ret sjovt. Jeg fikser det.'",
            },
            {
                "tekst": "Discord har lavet en marshmallow-labyrint! Du skal finde vejen gennem til hans magiske krystall — den kan vende forandringen tilbage.",
                "aktion": "Find vejen gennem marshmallow-labyrinten",
                "stat": "krop", "svaer": "normal",
                "succes": "Du hopper og balancerer gennem marshmallow-væggene! Det er som at lege i en kæmpe slikbutik! Du finder krystallen!",
                "fiasko": "Du vader gennem marshmallowet — det er blød og klæbrig! Men du når alligevel krystallen!",
            },
            {
                "tekst": "Discord rækker dig en gåde på et stykke marshmallow: 'Jeg har ben men kan ikke gå, jeg har en rygrad men kan ikke bo. Hvad er jeg?'",
                "aktion": "Løs Discordens gåde",
                "stat": "sind", "svaer": "svaert",
                "succes": "'En bog!' råber du! Discord griner: 'Korrekt! Du er klogere end du ser ud!' Han klapper i klørne — og alt bliver normalt igen!",
                "fiasko": "Du tænker længe... 'En... fisk?' Discord griner: 'Nej, det er en bog! Men det var sødt at du prøvede!' Han fikser det alligevel.",
            },
            {
                "tekst": "PonyVille er tilbage til normalt! Discord lander blidt og rækker dig en marshmallow. 'Til næste gang,' hvisker han med et glimt i øjet. Alle ponyer fejrer dig!",
                "aktion": "Fejr sejren med alle ponyer",
                "stat": "charme", "svaer": "let",
                "succes": "Alle ponyer synger og danser! Discord laver marshmallow-regn — men denne gang er det sjovt! Du er heltens af dagen! 🎉🍰",
                "fiasko": "Alle er glade! Discord giver dig et high-five. 'Du er en sej pony!' Og marshmallow-regnet er faktisk ret sjovt!",
            },
        ],
    },
]


def kast_d6(n):
    return [random.randint(1, 6) for _ in range(n)]


def tael_succes(dice):
    s = 0
    for d in dice:
        if d == 6:
            s += 2
        elif d >= 4:
            s += 1
    return s


def lav_test(pony, stat, svaer):
    terninger = pony[stat]
    if pony.get("talent") == stat:
        terninger += 1
    krav = SVAERHED[svaer]
    kast = kast_d6(terninger)
    succeser = tael_succes(kast)
    return succeser >= krav, kast, succeser, krav


def ny_spil():
    tema = random.choice(THEMAER)
    ponytype = random.choice(PONITYPER)
    navn = random.choice(PONYNAMNE) + random.choice([
        "hals", "støv", "ros", "vinge", "blomst", "fyr",
        "blik", "horn", "lys", "snude", "pels", "mane",
    ])
    pony = {
        "navn": navn,
        "type": ponytype["navn"],
        "emoji": ponytype["emoji"],
        "krop": random.randint(2, 4),
        "sind": random.randint(2, 4),
        "charme": random.randint(2, 4),
        "talent": random.choice(["krop", "sind", "charme"]),
    }
    if ponytype["bonus"] == "krop":
        pony["krop"] = min(pony["krop"] + 1, 5)
    elif ponytype["bonus"] == "sind":
        pony["sind"] = min(pony["sind"] + 1, 5)
    elif ponytype["bonus"] == "alle":
        pony["krop"] = min(pony["krop"] + 1, 5)
        pony["sind"] = min(pony["sind"] + 1, 5)
        pony["charme"] = min(pony["charme"] + 1, 5)

    return {
        "tema": tema,
        "pony": pony,
        "scene": 0,
        "historie": [],
        "succeser": 0,
        "fiaskoer": 0,
        "færdig": False,
        "udfald_tekst": None,
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/start", methods=["GET", "POST"])
def start():
    if request.method == "POST":
        ponytype_idx = int(request.form.get("type", 0))
        tema_idx = int(request.form.get("tema", 0))
        session["spil"] = ny_spil()
        pt = PONITYPER[ponytype_idx]
        sp = session["spil"]
        sp["pony"]["type"] = pt["navn"]
        sp["pony"]["emoji"] = pt["emoji"]
        sp["pony"]["krop"] = random.randint(2, 4)
        sp["pony"]["sind"] = random.randint(2, 4)
        sp["pony"]["charme"] = random.randint(2, 4)
        if pt["bonus"] == "krop":
            sp["pony"]["krop"] = min(sp["pony"]["krop"] + 1, 5)
        elif pt["bonus"] == "sind":
            sp["pony"]["sind"] = min(sp["pony"]["sind"] + 1, 5)
        elif pt["bonus"] == "alle":
            sp["pony"]["krop"] = min(sp["pony"]["krop"] + 1, 5)
            sp["pony"]["sind"] = min(sp["pony"]["sind"] + 1, 5)
            sp["pony"]["charme"] = min(sp["pony"]["charme"] + 1, 5)
        sp["tema"] = THEMAER[tema_idx]
        return redirect(url_for("scene"))
    return render_template("start.html", ponytyper=PONITYPER, themaer=THEMAER, enumerate=enumerate)


@app.route("/scene")
def scene():
    sp = session.get("spil")
    if not sp:
        return redirect(url_for("start"))
    return render_template("spil.html", sp=sp)


@app.route("/kast", methods=["POST"])
def kast():
    sp = session.get("spil")
    if not sp or sp.get("færdig"):
        return redirect(url_for("start"))

    scn = sp["tema"]["scener"][sp["scene"]]
    stat = scn["stat"]
    svaer = scn["svaer"]
    succes, dice, succ_count, krav = lav_test(sp["pony"], stat, svaer)

    udfald = {
        "aktion": scn["aktion"],
        "stat": stat,
        "svaer": svaer,
        "dice": dice,
        "succeser": succ_count,
        "krav": krav,
        "succes": succes,
        "tekst": scn["succes"] if succes else scn["fiasko"],
    }

    sp["historie"].append(udfald)
    sp["udfald_tekst"] = udfald["tekst"]
    if succes:
        sp["succeser"] += 1
    else:
        sp["fiaskoer"] += 1

    sp["scene"] += 1
    if sp["scene"] >= len(sp["tema"]["scener"]):
        sp["færdig"] = True

    session["spil"] = sp
    return redirect(url_for("scene"))


@app.route("/igen")
def igen():
    session.pop("spil", None)
    return redirect(url_for("start"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)