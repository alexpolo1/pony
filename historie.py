#!/usr/bin/env python3
"""
My Little Pony: Skyggen Over Equestria
En RPG-historie pa dansk -- terningekast styrer fortellingene.

System: d6-pulje (6=dobbelt succes, 4-5=ene succes, 1=ulykke)
Svaerhedsgrader: let=1, normal=2, svaert=3, meget svaert=4

Alle 7 ponytyper fra engine.py er med:
Earth Pony, Pegasus, Unicorn, Alicorn, Changeling, Otherkin, Minion
"""

import random
import textwrap

SVAERHED = {"let": 1, "normal": 2, "svaert": 3, "meget svaert": 4}

EGENSKABER = {
    "Stjarnhals":  {"krop": 2, "sind": 3, "charme": 4},
    "Regnbue":     {"krop": 4, "sind": 1, "charme": 2},
    "Krokus":      {"krop": 4, "sind": 2, "charme": 1},
    "Glitterstov": {"krop": 1, "sind": 3, "charme": 3},
    "Silkrost":    {"krop": 2, "sind": 2, "charme": 3},
    "Nodlos":      {"krop": 3, "sind": 3, "charme": 1},
    "Skumring":    {"krop": 2, "sind": 1, "charme": 3},
}

PONY_TYPE = {
    "Stjarnhals": "Alicorn",
    "Regnbue": "Pegasus",
    "Krokus": "Earth Pony",
    "Glitterstov": "Unicorn",
    "Silkrost": "Changeling",
    "Nodlos": "Otherkin",
    "Skumring": "Minion",
}

TALENTER = {
    "Stjarnhals":  ["Lider", "Magi"],
    "Regnbue":     ["Atlete", "Modig"],
    "Krokus":      ["Overlever", "Kamp"],
    "Glitterstov": ["Magi", "Kreativ"],
    "Silkrost":    ["Listig", "Saelgjer"],
    "Nodlos":      ["Overlever", "Ekspert"],
    "Skumring":    ["Dyreven", "Glat"],
}


def kast_terninger(antal):
    """Kast Antal d6-terninger. Returnerer liste med resultater."""
    return [random.randint(1, 6) for _ in range(antal)]


def tael_succeser(resultat):
    """6 = dobbelt succes, 4-5 = ene succes, 1 = ulykke"""
    s = 0
    for t in resultat:
        if t == 6:
            s += 2
        elif t >= 4:
            s += 1
    return s


def test(pony, egenskab, svaerhed="normal", talent=None):
    """Lav en test og returner resultat-dict."""
    ev = EGENSKABER[pony]
    terninger = ev[egenskab]
    if talent and talent in TALENTER.get(pony, []):
        terninger += 1
    krav = SVAERHED[svaerhed]
    kaster = kast_terninger(terninger)
    succeser = tael_succeser(kaster)
    return {
        "succes": succeser >= krav,
        "terninger": kaster,
        "succeser": succeser,
        "krav": krav,
        "overskud": succeser - krav,
        "ulykker": kaster.count(1),
        "fantastiske": kaster.count(6),
    }


BREDDE = 68


def linje(text):
    if not text:
        print("-" * BREDDE)
        return
    print(textwrap.fill(text, width=BREDDE))
    print()


def scene(titel):
    print()
    print("=" * BREDDE)
    print("    " + titel)
    print("=" * BREDDE)
    print()


def fortæl():
    """Den store historie: Skyggen Over Equestria"""

    # ===== KAPITEL 1 =====
    scene("Kapitel 1 - Stormen Samler Venner")

    linje(
        "I Equestria har solen skinet i mange ar. Hojt op i "
        "Candy Corner -- hvor farvet sukker og lysende krystaller "
        "blander sig i morgenluften -- bor den unge alicorn Stjarnhals. "
        "Hornet glitrer, og vingerne barer hende mellem skyerne, men "
        "i dag er der noget forkert i luften."
    )
    linje(
        "Horisonten er mork. En skygge -- ikke en sky, men noget "
        "aelldre end skyer -- kraber mod landet. Den sluger lys. "
        "Graesset visner, hvor den passerer. I Candy Corner ryster "
        "krystallerne i deres rammer, og Stjarnhals ved, at hun "
        "skal handle."
    )

    # --- Saml holdet (Stjarnhals: charme + Lider) ---
    c = test("Stjarnhals", "charme", "normal", "Lider")

    if c["succes"]:
        overskud = c["overskud"]
        if overskud >= 2:
            linje(
                "Stjarnhals ryster sin manke og rider ud over Equestria. "
                "Hendes stemme -- varm og bestemt -- naar hver enkelt pony "
                "i landet. Regnbue, pegasus med lynlaeb i sin manke, "
                "moter hende ved skybroen med et stort grin og raaber: "
                "Hvad venter vi pa!"
            )
            linje(
                "Krokus, jordpony med muskler som egetrae og et smil "
                "som en markfuld sol, dukker op fra groentsagsbedet med "
                "en rygsaek fyldt med proviant. Glitterstov -- forsigtig, "
                "med horn der lysner i blidt lyseblaat -- folger tavst "
                "bagved og nikker, nar Stjarnhals raaber hende til."
            )
            linje(
                "Silkrost, changeling med guldgronne skael og ojne fulde "
                "af et tidligere livs sorg, tover kun kort. Jeg har mistet "
                "for meget, hvisker hun. Jeg vil ikke miste mere. Nodlos, "
                "den mystiske otherkin med halve vinger og halve skael, "
                "dukker frem fra skyggen selv, som om skyggen kalder hende."
            )
            linje(
                "Og lille Skumring, en minion der ligner en gardnaal i et "
                "tordenbyge-mantel, sumrer omkring og kvidrer: Jeg er med! "
                "Jeg er med! Alle syv ponies staar sammen. Syv hjerte, syv "
                "moder, og en faelles beslutning om at redde Equestria."
            )
            hold_sammen = True
        else:
            linje(
                "Stjarnhals kalder og ber, men ikke alle svarer med samme "
                "iver. Nogle kommer, andre tover. Regnbue kommer med det "
                "samme. Krokus paker en rygsaek og nikker. Glitterstov "
                "folger med, men ojnene er fyldt med frygt."
            )
            linje(
                "Silkrost staar i vaerken med haendene. Nodlos dukker frem "
                "uden ord. Skumring sumrer lykkeligt. Alle syv er der -- "
                "men frygten ligger tungt i luften som en tung sky."
            )
            hold_sammen = True
    else:
        linje(
            "Stjarnhals kalder og ber, men flere ryster pa hovedet. "
            "Glitterstov hvisker at hun tor ikke. Regnbue sukker og "
            "flader vingerne: Du kan ikke holde os alle sammen."
        )
        linje(
            "Kun Krokus og lille Skumring folger med. De andre har for "
            "meget frygt. Men Krokus slaar en kempaehaand pa "
            "Stjarnhals skulder: To hjerte er bedre end intet. Lad os ga."
        )
        hold_sammen = False

    # ===== KAPITEL 2 =====
    scene("Kapitel 2 - Skygge-Skoven")

    linje(
        "Skyggen spreder sig som blaek i vandet. Den har allerede "
        "rort ved Skygge-Skoven -- den aeldgamle skov hvor traerne "
        "er sa hohe, at ingen nogensinde har set deres top. Nu "
        "vrimler grenene som fingre, og stien er borte."
    )

    # Navigation
    if hold_sammen:
        n = test("Nodlos", "sind", "svaert", "Overlever")
        nav = "Nodlos"
    else:
        n = test("Krokus", "sind", "svaert", "Overlever")
        nav = "Krokus"

    if n["succes"] and n["overskud"] >= 2:
        linje(
            nav + " lukker ojnene og lytter. Jorden forteller historier -- "
            "rodterne hvisker, og vinden barer minner fra skovens "
            "tidligste dage. Folg mig, siger " + nav + " med rolig stemme, "
            "og holder kursen gennem et labyrint af skygger og torne. Den "
            "mystiske sti af lysende mos leder dem fremad."
        )
        fundet_sti = True
    elif n["succes"]:
        linje(
            nav + " famler frem, fodderne presset mod jorden, sindet "
            "modvirker panikken. Vejen er langsom og fuld af farer, "
            "men de finder en passage -- snaevre, snoet, men baerbar."
        )
        fundet_sti = True
    else:
        linje(
            nav + " proever at finde vejen, men skoven vrider "
            "sig. De gaar i cirkler. Traerne lukker sig som "
            "en knyvnaeve. Lyset slukkes."
        )
        fundet_sti = False

        if hold_sammen:
            kamp = test("Krokus", "krop", "svaert", "Kamp")
            if kamp["succes"]:
                linje(
                    "Grene klager som kloer. Men Krokus griber fat i "
                    "den storeste gren og bryder den med et knaek som "
                    "torden. Her! Kom alle! Med jordponystyrke river "
                    "hun et hul gennem skyggenes omfavnelse."
                )
                skade = False
            else:
                linje(
                    "Grene rammer. Smerte flammer op, og Skumring "
                    "fanger den mindste af holdet. Med saaret flakker "
                    "de sig vaek -- overlevende, men rystet."
                )
                skade = True
        else:
            linje(
                "Uden Nodlos staar Krokus alene mod skyggens klodder. "
                "Hun slaar og bider. Skumring beskytter hende med sin "
                "lille krop. Sammen kravler de ud af skoven."
            )
            skade = True

    if fundet_sti:
        linje(
            "De forlader Skygge-Skoven med svedig pande og "
            "rystende ben -- men med livet og modet intakt."
        )
        skade = False

    # ===== KAPITEL 3 =====
    scene("Kapitel 3 - Krystalklitternes Hemmelighed")

    linje(
        "Bag skoven aabner sig et underjordisk rige -- "
        "Krystalklitterne. Vaegge af ren krystal straaler "
        "med farver, der ikke findes i overfladens verden. "
        "Og i midten af den storeste hule staar en gammel "
        "krystal -- mere end en sten, et levende lys, der "
        "barer Equestrias oprindelige kraft."
    )
    linje(
        "Men krystalen er spraekket. Skyggen har fundet den "
        "for dem -- og har begyndt at suge dens kraft ud. "
        "Hvis krystalen slukker, er alt lys i Equestria "
        "for evigt borte."
    )

    # Reparation af krystallen (Glitterstov: sind + Magi)
    if hold_sammen:
        k = test("Glitterstov", "sind", "meget svaert", "Magi")
    else:
        k = test("Glitterstov", "sind", "meget svaert")

    if k["succes"] and k["fantastiske"] > 0:
        linje(
            "Glitterstov lukker ojnene og lofter hornet. Lyset "
            "fra krystalen straaler ind i hende som en sol. Hendes "
            "magi -- svag og nervoes i hverdag -- braender nu som "
            "en stjerne. Spraekkerne gloer, fyldes med lys, og "
            "med et sidste pust forseglas krystalen."
        )
        krystal_staerk = True
    elif k["succes"]:
        linje(
            "Glitterstovs horn straaler -- men kraefterne er svage, "
            "og hun ryster under arbejdet. Med besvaer presser hun "
            "lys ind i spraekkerne. De heler -- til dels. Krystalen "
            "braender igen, men flager stadig ved kanterne."
        )
        krystal_staerk = False
    else:
        linje(
            "Glitterstov forsoger, men krystalen afviser hende -- "
            "som om den ved, at skyggen er staerkere. Spraekkerne "
            "bredes ud med et sus, som om krystalen graeder."
        )
        krystal_staerk = False

    # Changelings hemmelighed
    if hold_sammen and not krystal_staerk:
        linje(
            "Silkrost staar stille og stirrer pa krystalen. "
            "Den har brug for foelerelser, siger hun lavt. Ikke "
            "bare magi -- foelerelser. Changelings kan foelere "
            "dem. Smage dem. Det er vores forbandelse og vores "
            "kraft."
        )
        c2 = test("Silkrost", "charme", "svaert")
        if c2["succes"]:
            linje(
                "Silkrost laegger sine taender mod krystalen -- "
                "ikke for at suge, men for at give. Hun presser "
                "alle sine foelerelser ind: frygt, haab, glaede, "
                "sorg, og det der er mest vigtigt -- venskab. "
                "Krystalen vugger sig og lyser op med en blid "
                "guldgron gloed. Silkrost smiler forste gang i "
                "lang tid."
            )
            krystal_staerk = True
        else:
            linje(
                "Silkrost forsoger, men skyggen i krystallen "
                "afviser hende ogsaa. Det er okay, hvisker hun. "
                "Vi finder en anden vej."
            )

    # ===== KAPITEL 4 =====
    scene("Kapitel 4 - Den Sidste Slagmark")

    linje(
        "Skyggen traekker sig tilbage -- men kun for at samle "
        "sig. Nu har den form: en enorm skygge-pony med "
        "horn som torne og ojne som to sorte huller. Den "
        "broeler, og lyden er som en hel skov der braender."
    )

    if krystal_staerk:
        linje(
            "Men krystalen bag dem straaler. Hendes lys fylder "
            "klitterne med varme, og holdet kan faele krystallens "
            "kraft straemme gennem dem som en usynlig flod."
        )
    else:
        linje(
            "Uden krystallens fulde kraft er skyggen enorm. "
            "Den fylder hele horisonten, og dens kloer raekker "
            "ned mod dem som torne fra morkeat selv."
        )

    # Regnbue angriber
    if hold_sammen:
        r = test("Regnbue", "krop", "normal", "Atlete")
        if r["succes"]:
            linje(
                "Regnbue tager tillob, vingerne fladrer som et "
                "tordenbrag. Hun fjarer sig op gennem luften og "
                "rammer skyggen med en hestehovedstod af ren "
                "lynkraft. Skyggen skriger -- og traekker sig tilbage!"
            )
            regnbue_ok = True
        else:
            linje(
                "Regnbue angriber -- men skyggen fanger hende. "
                "Kloerne griber i vingerne, og hun falder ned "
                "i morkeat. Men Regnbue smiler svagt og slaar "
                "sig fri med sidste kraefter."
            )
            regnbue_ok = False
    else:
        linje(
            "Uden Regnbue mangler holdet fart i luften. "
            "Stjarnhals forsoger at erstatte hende -- men en "
            "vinge kan kun gore sa meget."
        )
        regnbue_ok = False

    # Stjarnhals -- lederens valg
    s = test("Stjarnhals", "charme", "svaert", "Lider")
    if s["succes"]:
        linje(
            "Stjarnhals spraenger sig foran skyggen med "
            "vingerne vidt udspredte. Hor pa mig! raaber "
            "hun. Jeg ved, hvad du er -- du er ensom. Men "
            "du skal ikke vere det mere. Vi er alle sammen "
            "ensomme en gang -- men sammen er vi staerkere."
        )
        linje(
            "Skyggen tover. De sorte ojne blinker -- og for et "
            "ojeblund ser man noget bag morkeat: en pony, lille "
            "og bange, der har gemt sig i skygger sa laenge, at "
            "hun er glemt solen."
        )
        stjern_ok = True
    else:
        linje(
            "Stjarnhals raaber, men skyggen slukker hendes "
            "stemme. Morkeat er for tykt, ordene for svage."
        )
        stjern_ok = False

    # Krokus -- den sidste forsvar
    k2 = test("Krokus", "krop", "svaert", "Kamp")
    if k2["succes"]:
        linje(
            "Krokus griber skyggen med begge forben og "
            "holder fast -- jordponystyrke mod skygge. Du "
            "rorer ikke mine venner! raaber hun, og "
            "jorden under hende ryster som svar."
        )
        krokus_ok = True
    else:
        linje(
            "Krokus proever at holde skyggen, men kloerne "
            "er for skarpe. Hun skriger og ruller afsted -- "
            "saaret, men i live."
        )
        krokus_ok = False

    # ===== KAPITEL 5 =====
    scene("Kapitel 5 - Venskabets Kraft")

    # Afsluttende terninger
    succeser = sum([
        (1 if stjern_ok else 0),
        (1 if krokus_ok else 0),
        (1 if regnbue_ok else 0),
        (2 if krystal_staerk else 0),
    ])

    if succeser >= 4:
        # HELDEN SLUTNING
        linje(
            "Syv ponies staar skulder ved skulder. Syv hjerte "
            "slaar i samme takt. Stjarnhals lofter horn og vinger "
            "simultan, og fra krystallen bag dem straaler et lys, "
            "der er staerkere end nogen sol."
        )
        linje(
            "Regnbue flyver op og skaber en cirkel af lys. Krokus "
            "slaar kloerne i jorden og sender rodter af energi op "
            "ad klitterne. Glitterstovs magi samler sig som en "
            "stjerne i hendes horn. Silkrost gaiver alle sine "
            "foelerelser. Nodlos slaar sine halve vinger og laeker "
            "mellem to verdener. Og Skumring -- lille, modige, "
            "ublaefede Skumring -- sumrer en sang, der varmer "
            "mere end nogen flamme."
        )
        linje(
            "Skyggen brister. Ikke med et skrig, men med et "
            "suaeh -- som en dyb haebt der laengedes i aertier. "
            "Og bag morkeat staar en pony. Lille, bange, men "
            "virkelig. En pony, der har vaeret alene for laenge."
        )
        linje(
            "Stjarnhals gaar frem og stryger hende pa haacken. "
            "Du skal ikke vere alene mere, hvisker hun. Og "
            "den lille pony -- der har et navn som lys og en "
            "historie som skygge -- nikker. Forste gang nogensinde, "
            "smiler hun."
        )
        linje(
            "Og solen skinner igen over Equestria. Ikke fordi "
            "de besejret morkeat -- men fordi de viste morkeat, at "
            "venskab er staerkere end ensomhed."
        )
        linje(
            "Syv ponytyper. Syv sjale. En historie, der aldrig "
            "glemmes."
        )

    elif succeser >= 2:
        # BLANDET SLUTNING
        linje(
            "De staar sammen. Ikke perfekt, ikke uden frygt, "
            "men sammen. Krystallens lys -- svag men staedigt -- "
            "straekker sig som en bro over det morke."
        )
        linje(
            "Skyggen traekker sig tilbage. Ikke fordi den er besejret, "
            "men fordi den for forste gang nogensinde faeler varme "
            "fra noget andet vaesen. Den tover, og i tovet ser "
            "Stjarnhals en mulighed."
        )
        linje(
            "Vi skal tale med hende, hvisker hun. Og de andre "
            "nikker. Med forsigtige skridt gaar de frem mod "
            "skyggen -- ikke som fjender, men som venner der "
            "vill redde en ven."
        )
        linje(
            "Det bliver ikke en faerdig sejr. Skyggen er for stor, "
            "for gammel, for dyb. Men den traekker sig tilbage -- "
            "tilbage til skygge-skoven, tilbage til det sted, hvor "
            "den kom fra. Og Stjarnhals ved, at de vil komme "
            "tilbage en dag. Med mere lys. Med flere venner. "
            "Med et staerkere hjerte."
        )
        linje(
            "Og solen skinner -- svagere end for, men stadig "
            "varm. Det racker for i dag."
        )

    else:
        # MORK SLUTNING
        linje(
            "Syv ponies forsoger, men skyggen er for stor. "
            "Den slaar ned med kloer og taender, og en efter "
            "en falder de tilbage."
        )
        linje(
            "Men de gaar ikke ned. Krokus barer vej med sin "
            "krop. Regnbue distraherer med hurtige angreb. "
            "Glitterstovs magi lyser op i morkeat. Silkrost "
            "foeler vejen. Nodlos finder gaengen bagud. "
            "Og Skumring -- lille, modige Skumring -- raaber "
            "sa hojt, at det ekoer gennem hulen."
        )
        linje(
            "De taber slaget. Men ikke krigen. Skyggen "
            "traekker sig tilbage -- for nu. Og Stjarnhals "
            "ved, at en dag vil de komme tilbage. Staerkere. "
            "Sagere. Bedre."
        )
        linje(
            "Og solen skinner -- lidt. Men det racker for "
            "at vide, at det lys kommer til at vende."
        )

    # --- Afslutning ---
    print()
    print("=" * BREDDE)
    print("    Slut")
    print("=" * BREDDE)
    print()
    print("Tak fordi du spillede!")
    print("My Little Pony: Skyggen Over Equestria")
    print()


if __name__ == "__main__":
    random.seed()
    fortæl()