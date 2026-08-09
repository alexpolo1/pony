"""
Adventure themes and scenes for MLP Pony: Tails of Equestria.

8 themes, each with 5 scenes of increasing difficulty.
"""

THEMAER = [
    {
        "id": "regnbues-fødselsdag",
        "titel": "Rainbow Dash har fødselsdag",
        "emoji": "\U0001f382\U0001f308",
        "intro": "Pinkie Pie planlægger en hemmelig fødselsdagsfest for Rainbow Dash i Sugarcube Corner. Men melet er væk, og kagen skal være klar, før Rainbow lander i Ponyville!",
        "scener": [
            {
                "tekst": "Du skynder dig ind i Sugarcube Corner. Melkrukken er helt tom, og Mrs. Cake står bag disken med opskriften mellem hovene.",
                "aktion": "Spørg Mrs. Cake om mel",
                "stat": "charme", "svaer": "normal",
                "succes": "Mrs. Cake smiler. 'En hjælpsom pony! Applejack har havre på Sweet Apple Acres, som vi kan male til mel.' Du får et kort over vejen.",
                "fiasko": "Mrs. Cake kan ikke finde mere mel, men Pinkie opdager et lille kort til Sweet Apple Acres under en bageplade.",
            },
            {
                "tekst": "På Sweet Apple Acres har Applejack en sæk havre, men møllehjulet står stille. I må vælge, hvordan I får hjulet i gang igen.",
                "aktion": "Få gårdens møllehjul i gang",
                "stat": "sind", "svaer": "normal",
                "succes": "Med en god ponyplan drejer møllehjulet igen. Havren bliver til fint mel, og Applejack fylder en pose til jer.",
                "fiasko": "Hjulet knirker, men Big Mac giver det et roligt skub. Snart har I nok havremel til kagen.",
            },
            {
                "tekst": "Kagen er bagt, og Pinkie stiller fire skåle glasur frem. Rainbow Dashs lyn skal have den rigtige farve.",
                "aktion": "Vælg glasur til lynet på kagen",
                "color_prompt": "Tryk på den {color} glasur, så Rainbow Dashs lyn får den rigtige farve.",
                "stat": "krop", "svaer": "normal",
                "succes": "Glasuren lægger sig som et skinnende lyn hen over kagen. Pinkie hopper begejstret rundt om bordet!",
                "fiasko": "Glasuren sprøjter lidt, men Pinkie forvandler klatten til en sød lille sky.",
            },
            {
                "tekst": "Pinkies festkanon er blevet viklet ind i serpentiner. Hvis den ikke bliver fri, kan overraskelsen ikke begynde.",
                "aktion": "Gør Pinkies festkanon klar",
                "stat": "krop", "svaer": "normal",
                "succes": "Du får alle serpentinerne fri. Festkanonen siger et lille glad plop og er klar til den store overraskelse!",
                "fiasko": "En serpentin sidder fast, men Pinkie trækker den ud med et grin. Festkanonen er klar i sidste øjeblik.",
            },
            {
                "tekst": "Alle gemmer sig i Sugarcube Corner, og Rainbow Dash nærmer sig. Mrs. Cake vil sikre sig, at I brugte den rigtige hemmelige opskrift.",
                "aktion": "Husk nummeret på fødselsdagsopskriften",
                "stat": "charme", "svaer": "svaert",
                                "succes": "Du husker det! Rainbow Dash træder ind, festkanonen springer, og alle råber: 'Tillykke!' Kagen smager fantastisk. 🎉",
                "fiasko": "Mrs. Cake hjælper med opskriften, og netop som kagen bliver klar, lander Rainbow Dash til sin overraskelsesfest.",
            },
        ],
    },
    {
        "id": "angel-er-løbet-væk",
        "titel": "Angel er løbet væk",
        "emoji": "\U0001f430\u2764\ufe0f",
        "intro": "Fluttershy er i gråd! Hendes lille kanin Angel er løbet væk. Du tilbyder at hjælpe med at finde ham.",
        "scener": [
            {
                "tekst": "Du løber ud i Fluttershys have. Blomsterne er høje og farverige \u2014 røde roser, gule solsikker, blå blåklatter. Angel kan være hvor som helst her!",
                "aktion": "Søg i blomsterhaven",
                "stat": "krop", "svaer": "normal",
                "succes": "Bag en stor solsikke finder du en lille gulerod og friske kaninspor. Angel er løbet videre mod Ponyville!",
                "fiasko": "Du finder kun sommerfugle, men Fluttershy opdager små kaninspor, der fører ud gennem havelågen.",
            },
            {
                "tekst": "Du følger sporene gennem Ponyville. Applejack står ved markedsboden, Rarity er på vej fra Carousel Boutique, og Twilight ordner bøger. Har nogen set Angel?",
                "aktion": "Spørg alle ponyer i Ponyville",
                "stat": "sind", "svaer": "normal",
                "succes": "Jeres plan virker. Et tydeligt spor peger mod bakken, hvor nogen så en lille hvid kanin hoppe forbi!",
                "fiasko": "Ponyerne ryster på hovedet. 'En kanin?' Men Spike hvisker: 'Jeg så noget hvidt hoppe forbi...' Det må være ham!",
            },
            {
                "tekst": "På bakken deler kaninsporene sig ved fire farvede potemærker. Fluttershy finder et grønt blad i Angels spor, så nu ved I, hvilken farve I skal følge.",
                "aktion": "Vælg farven på Angels kaninspor",
                "color_prompt": "Det grønne blad er ledetråden. Tryk på det {color} potemærke for at følge Angel.",
                "stat": "sind", "svaer": "normal",
                "succes": "Bag potemærket fortsætter de små spor mod kanten af Everfree-skoven. Du hører Angel pusle i nærheden.",
                "fiasko": "Stien ender ved en busk, men et lille hvidt hår i en gren viser, hvilken vej Angel løb.",
            },
            {
                "tekst": "Du får øje på Angel, men en flok høns forskrækker ham, og han suser mellem fire små dyreskjul. Du må nå hen til ham uden at skræmme ham mere.",
                "aktion": "Kom roligt hen til Angel",
                "stat": "krop", "svaer": "normal",
                "succes": "Du bevæger dig stille frem, og Angel stopper med at løbe. Han venter ved de nummererede skjul.",
                "fiasko": "Angel smutter én gang til, men Fluttershys rolige stemme får ham til at vente ved skiltene.",
            },
            {
                "tekst": "Fluttershy når frem til de fire nummererede dyreskjul. Hun spørger, om du husker nummeret på Angels yndlingssted.",
                "aktion": "Husk nummeret på Angels skjulested",
                                "stat": "charme", "svaer": "svaert",
                                "succes": "Du husker stedet. Angel hopper frem, Fluttershy nusser ham blidt, og sammen går I hjem til alle dyrevennerne. ❤️",
                "fiasko": "Fluttershy kalder forsigtigt på Angel. Han kommer frem og følger jer trygt hjem.",
            },
        ],
    },
    {
        "id": "æblerne-ruller",
        "titel": "Æblerne ruller ned ad bakken",
        "emoji": "\U0001f34e\U0001f434",
        "intro": "En æblevogn er væltet på Sweet Apple Acres, og hele høsten ruller ned ad bakken mod bækken. Applejack og Apple Bloom har brug for din hjælp!",
        "scener": [
            {
                "tekst": "Æbler overalt! De ruller som små røde kugler ned ad bakken på Sweet Apple Acres. Du skal standse dem, før de når bækken.",
                "aktion": "Jag de rullende æbler",
                "stat": "krop", "svaer": "normal",
                "succes": "Du griber æbler med hovene, halen og en kurv. Applejack råber begejstret, at halvdelen allerede er reddet!",
                "fiasko": "Æblerne ruller for hurtigt! Du griber nogle få, men de fleste fortsætter ned ad bakken...",
            },
            {
                "tekst": "Mange æbler er landet i det høje, gyldne græs. Apple Bloom kommer løbende, og I må vælge den bedste måde at samle dem på.",
                "aktion": "Saml æbler i højt græs",
                "stat": "krop", "svaer": "normal",
                "succes": "Du går forsigtigt gennem græsset og finder æblerne ét for ét. Kurven er snart fyldt til randen!",
                "fiasko": "Græsset er højt, og du finder kun halvdelen. Men Apple Bloom hjælper med at finde resten!",
            },
            {
                "tekst": "Ved bækken står fire farvede kurve. Applejack beder dig lægge de våde æbler i den rigtige kurv, så høsten ikke bliver blandet.",
                "aktion": "Vælg kurven til de våde æbler",
                "color_prompt": "Tryk på den {color} kurv til æblerne fra bækken.",
                "stat": "krop", "svaer": "normal",
                "succes": "Du bøjer dig ned og griber æblerne ét for ét! Vandet er koldt, men det er sjovt! Alle æbler reddet!",
                "fiasko": "Æblerne er glatte og triller ud mellem hovene, men Apple Bloom fanger de fleste med en kurv!",
            },
            {
                "tekst": "Nu skal alle æbler bæres tilbage til gården. Kurvene er tunge, og bakken er stejl, men Big Mac gør vognen klar.",
                "aktion": "Bær tunge kurve hjem",
                "stat": "krop", "svaer": "normal",
                "succes": "Du bærer kurven op ad bakken med stolthed! Applejack råber: 'Du er stærkere end de fleste!' Alle æbler er i sikkerhed!",
                "fiasko": "Kurven er for tung! Du vælter og æblerne ruller lidt. Men Big Mac kommer og hjælper \u2014 sammen når I hjem!",
            },
            {
                "tekst": "Ved laden er der fire nummererede døre. Applejack spørger, om du husker, hvilken dør de reddede æbler skal køres ind gennem.",
                "aktion": "Husk nummeret på stalddøren",
                "stat": "charme", "svaer": "svaert",
                "succes": "Du husker døren, og hele høsten kommer sikkert i laden. Granny Smith fejrer jer med varm æbletærte! \U0001f34e",
                "fiasko": "Applejack viser vej til den rigtige dør, og sammen får I høsten sikkert i laden.",
            },
        ],
    },
    {
        "id": "raritys-glimmer-sten",
        "titel": "Raritys glimmer-sten er borte",
        "emoji": "\U0001f48e\u2728",
        "intro": "Raritys sjældne glimmersten til en ny gallakjole er forsvundet fra Carousel Boutique. Spike har set et magisk glimt i Ponyville, og du tilbyder at hjælpe.",
        "scener": [
            {
                "tekst": "Carousel Boutique er fuld af stofruller, bånd og mønstre. Rarity viser den tomme æske, hvor glimmerstenen lå.",
                "aktion": "Undersøg Carousel Boutique",
                "stat": "sind", "svaer": "normal",
                "succes": "Under en stofrulle finder du glitrende støv, som fører ud mod Ponyvilles torv. I har et spor!",
                "fiasko": "Værkstedet er for rodet! Du finder nåle, knapper og glitter \u2014 men ikke glimmer-stenen.",
            },
            {
                "tekst": "På Ponyvilles torv spørger du Spike, Applejack og de andre ponyer, om de har set et usædvanligt magisk glimt.",
                "aktion": "Spørg i Ponyville",
                "stat": "krop", "svaer": "normal",
                "succes": "Jeres plan virker. Et nyt glimt peger mod parken, og ponyerne ønsker jer held og lykke på jagten.",
                "fiasko": "Ingen har set stenen. Men Twilight hvisker: 'Måske kan min magi hjælpe?'",
            },
            {
                "tekst": "I parken rammer sollyset fire farvede krystalspor ved søen. Kun ét spor kommer fra Raritys glimmersten.",
                "aktion": "Følg glimmerstenens krystalspor",
                "color_prompt": "Tryk på det {color} krystalspor, som Twilight får til at lyse.",
                "stat": "sind", "svaer": "normal",
                "succes": "Det valgte spor fører direkte til søbredden, hvor et kraftigt glimt kommer nede fra vandet.",
                "fiasko": "Sporet ender blindt, men Spike opdager et nyt glimt under søens overflade.",
            },
            {
                "tekst": "Glimmer-stenen er faldet i søen! Du kan SE den på bunden \u2014 den skinner! Men søen er dyb, og du skal dykke for at nå den.",
                "aktion": "Dyk efter glimmer-stenen",
                "stat": "krop", "svaer": "svaert",
                "succes": "Du dykker ned! Vandet er koldt, men du griber stenen! Du bryder overfladen med stenen i munden \u2014 den glitrer som aldrig før! \U0001f48e",
                "fiasko": "Stenen ligger for dybt, men Twilight løfter den forsigtigt op med sin magi, mens du viser vej.",
            },
            {
                "tekst": "Stenen har mistet sin glans i søen. Hos boghandler Missy findes fire bind af Magiske dyr, og kun det rigtige bind beskriver den lille sødrage, som kan tænde stenen igen.",
                "aktion": "Husk nummeret på bogen om magiske dyr",
                "stat": "charme", "svaer": "normal",
                "succes": "Du husker bogen. Missy finder det rigtige opslag, og den venlige sødrage puster et glimt ind i stenen. Raritys gallakjole er reddet! \u2728",
                "fiasko": "Missy hjælper med at finde opslaget. Sødragen tænder stenen igen, og Rarity takker jer begge.",
            },
        ],
    },
    {
        "id": "discord-laver-sjov",
        "titel": "Discord laver sjov",
        "emoji": "🌀🎭",
        "intro": "Discord, Equestrias draconequus og mester i kaosmagi, har forvandlet Ponyvilles veje til hoppende skumfiduser. Fluttershy mener, at han har glemt at tænke på de andre.",
        "scener": [
            {
                "tekst": "Du træder ud, og dit hov synker ned i en hoppende skumfidusvej. I det fjerne svæver Discord med paraply og hjemmesko, mens han griner af sit kaos.",
                "aktion": "Find Discord",
                "stat": "sind", "svaer": "let",
                "succes": "Discord er umulig at overse! Han svæver i luften med en marshmallow-hat. 'Hej, lille pony! Vil du lege?' spørger han.",
                "fiasko": "Skumfiduserne hopper overalt, men du følger lyden af Discords grin til en sky af candyfloss.",
            },
            {
                "tekst": "Discord griner. 'Hvis du kan overraske mig, vil jeg måske rydde op!' Fluttershy minder ham om, at en god spøg også skal være sjov for vennerne.",
                "aktion": "Få Discord til at grine",
                "stat": "sind", "svaer": "normal",
                "succes": "Dit valg overrasker Discord, og han griner så meget, at hans paraply begynder at klappe. Nu vil han høre jeres plan.",
                "fiasko": "Discord prøver at se alvorlig ud, men Fluttershys lille smil får ham til at indrømme, at jeres idé er sjov.",
            },
            {
                "tekst": "Discord fremtryller fire farvede kaosknapper midt i en skumfiduslabyrint. Den rigtige knap kan gøre vejene normale igen.",
                "aktion": "Vælg Discords kaosknap",
                "color_prompt": "Tryk på den {color} kaosknap, som Discord får til at blinke.",
                "stat": "krop", "svaer": "normal",
                "succes": "Knappen siger boing, og en sti gennem labyrinten bliver til brosten igen. Discord ser imponeret ud.",
                "fiasko": "Knappen sprøjter konfetti, men den rigtige knap blinker bagefter, så I kan fortsætte.",
            },
            {
                "tekst": "Midt i labyrinten gemmer Discord sin sidste kaosgnist i en tekop, der flyver baglæns. Du må nå den, før teen begynder at regne opad.",
                "aktion": "Fang Discords sidste kaosgnist",
                "stat": "sind", "svaer": "normal",
                "succes": "Du fanger tekoppen, og kaosgnisten lander sikkert i Twilights beholder. Nu mangler kun den rigtige trylleformular.",
                "fiasko": "Tekoppen slipper væk et øjeblik, men Discord knipser med fingrene og sender den tilbage. Han vil faktisk gerne hjælpe.",
            },
            {
                "tekst": "Twilight åbner sin bog med fire nummererede trylleformularer. Hun spørger, om du husker nummeret på formularen, der samler kaosmagien.",
                "aktion": "Husk nummeret på trylleformularen",
                "stat": "charme", "svaer": "svaert",
                "succes": "Du husker formularen. Ponyvilles veje bliver normale, og Discord laver én lille skumfidussky med alles tilladelse. \U0001f389\U0001f9e1",
                "fiasko": "Twilight hjælper med formularen. Discord rydder op og lover Fluttershy at spørge næste gang, før han slipper kaos løs.",
            },
        ],
    },
    {
        "id": "twilights-forsvundne-bog",
        "titel": "Twilights forsvundne bog",
        "emoji": "📚🔮",
        "intro": "En fortryllet bog er fløjet ud af biblioteket i Venskabsslottet. Magiske bogstaver drysser over Ponyville, og Twilight og Spike har brug for din hjælp.",
        "scener": [
            {
                "tekst": "Vinduerne i Venskabsslottets bibliotek står åbne, og lysende bogstaver svæver gennem luften. Twilight peger på et glitrende spor ved døren.",
                "aktion": "Undersøg det glitrende bogstavspor",
                "stat": "krop", "svaer": "normal",
                "succes": "Du opdager, at bogstaverne danner små pile mod torvet. Sporet er tydeligt!",
                "fiasko": "Bogstaverne kilder dig på næsen, men Spike finder en lille pil mellem dem, som viser vej.",
            },
            {
                "tekst": "På torvet danser en hel sky af ord rundt om rådhuset. Bogen må have fløjet denne vej, men ordene blokerer stien.",
                "aktion": "Kom forbi skyen af dansende ord",
                "stat": "krop", "svaer": "normal",
                "succes": "Din plan virker! Ordene stiller sig pænt på række og viser vej mod klokketårnet.",
                "fiasko": "Ordene flyver lidt vildt, men en venlig pony hjælper dig sikkert igennem.",
            },
            {
                "tekst": "Ved Ponyvilles klokketårn viser Twilights søgebesværgelse fire farvede bogstavspor. Kun ét kommer fra den forsvundne bog.",
                "aktion": "Find den rigtige magiske dør",
                "color_prompt": "Tryk på det {color} bogstavspor, som Twilights magi får til at glimte.",
                "stat": "sind", "svaer": "normal",
                "succes": "Døren glimter og åbner sig med et venligt pling. Bag den fortsætter bogstavsporet!",
                "fiasko": "Døren nyser glitter ud, men du får øje på det rigtige spor ved siden af.",
            },
            {
                "tekst": "Den forsvundne bog sidder fast øverst i klokketårnet og blafrer med siderne som vinger. Vinden bliver stærkere.",
                "aktion": "Red bogen fra klokketårnet",
                "stat": "krop", "svaer": "svaert",
                "succes": "Du springer frem og griber bogen, lige før den flyver videre. Alle bogstaverne jubler!",
                "fiasko": "Bogen slipper næsten væk, men Twilight laver et blødt magisk net, så I kan redde den sammen.",
            },
            {
                "tekst": "Tilbage i Venskabsslottet mangler bogen sin sidste side. Spike står ved fire nummererede boghylder og spørger efter den hyldekode, Twilight nævnte.",
                "aktion": "Husk nummeret på bogens hyldekode",
                "stat": "sind", "svaer": "normal",
                "succes": "Den sidste side flyver ind gennem vinduet og lander perfekt i bogen. Historien er hel igen! 📖",
                "fiasko": "Siden tøver et øjeblik, men Spike vinker den hjem, og bogen bliver samlet igen.",
            },
        ],
    },
    {
        "id": "lunas-forsvundne-stjerner",
        "titel": "Lunas forsvundne stjerner",
        "emoji": "🌙⭐",
        "intro": "Prinsesse Luna mangler fire stjerner fra nattehimlen. Uden dem kan drømmevejen ikke lyse, så du må hjælpe før månen står højt.",
        "scener": [
            {
                "tekst": "I slotsgården finder du sølvglimmer på jorden. Luna fortæller, at den første stjerne faldt mod den hviskende skov.",
                "aktion": "Følg stjernestøvet til skoven",
                "stat": "krop", "svaer": "let",
                "succes": "Stjernestøvet lyser under dine hove og fører dig sikkert ind mellem træerne.",
                "fiasko": "Sporet forsvinder kort, men en ugle viser dig, hvor glimmeret fortsætter.",
            },
            {
                "tekst": "Skovens træer hvisker alle på én gang. Den lille stjerne gemmer sig, fordi den er blevet bange for mørket.",
                "aktion": "Berolig den bange stjerne",
                "stat": "krop", "svaer": "normal",
                "succes": "Stjernen tør kigge frem og hopper glad ned i din taske, hvor den lyser varmt.",
                "fiasko": "Stjernen er stadig genert, men Luna nynner en rolig sang, og så kommer den langsomt frem.",
            },
            {
                "tekst": "Ved en spejlblank sø viser Lunas månemagi fire farvede lys. Ét af dem er den næste stjernes ægte spejlbillede.",
                "aktion": "Vælg det ægte stjernelys",
                "color_prompt": "Tryk på det {color} stjernelys, som Lunas månemagi får til at blinke.",
                "stat": "sind", "svaer": "normal",
                "succes": "Lyset løfter sig fra vandet og bliver til en funklende stjerne foran dig.",
                "fiasko": "Spejlbilledet laver ringe i vandet, men det ægte lys blinker, så du kan kende det.",
            },
            {
                "tekst": "Den tredje stjerne er fanget i en sky over bjergtoppen. Torden rumler, mens skyen farer rundt på himlen.",
                "aktion": "Befri stjernen fra tordenskyen",
                "stat": "krop", "svaer": "normal",
                "succes": "Du når gennem vinden og prikker hul i skyen. Stjernen springer fri med et klart blink!",
                "fiasko": "Vinden skubber dig tilbage, men Rainbow Dash laver en rolig luftvej gennem skyen.",
            },
            {
                "tekst": "Den sidste stjerne kan kun vækkes ved det rigtige månetårn. Luna spørger, om du husker nummeret fra begyndelsen.",
                "aktion": "Husk nummeret på månetårnet",
                "stat": "sind", "svaer": "normal",
                "succes": "Tårnet sender en sølvstråle mod himlen. Alle fire stjerner er hjemme, og drømmevejen lyser igen! 🌟",
                "fiasko": "Luna hjælper med den sidste lille smule magi, og stjernen finder alligevel hjem.",
            },
        ],
    },
    {
        "id": "pinkies-ballonkarrusel",
        "titel": "Pinkies flyvende ballonfest",
        "emoji": "🎈🎉",
        "intro": "Pinkie Pies festballoner har løftet hele kagevognen op i skyerne! Festen begynder snart, og du skal få kagerne sikkert ned.",
        "scener": [
            {
                "tekst": "En lang række ballonsnore snor sig hen over Ponyvilles tage. Pinkie rækker dig en kikkert og peger mod den svævende vogn.",
                "aktion": "Find kagevognen mellem skyerne",
                "stat": "sind", "svaer": "let",
                "succes": "Du ser vognen bag en sky formet som en cupcake og finder den hurtigste vej derop.",
                "fiasko": "Skyerne ligner alle kager, men Pinkie opdager til sidst vognen gennem kikkerten.",
            },
            {
                "tekst": "Ballonerne trækker vognen mod Everfree-skoven. I må hurtigt vælge, hvordan I kan få fat i den nederste snor.",
                "aktion": "Fang den flagrende ballonsnor",
                "stat": "krop", "svaer": "normal",
                "succes": "Dit valg virker, og snoren lander lige mellem dine hove. Nu kan I styre vognen!",
                "fiasko": "Snoren smutter én gang, men Pinkie laver et kæmpe hop og griber den i næste forsøg.",
            },
            {
                "tekst": "Fire farvede ballonbundter holder vognen oppe. Pinkie viser, hvilket bundt der skal løsnes først, så vognen ikke tipper.",
                "aktion": "Løsn det rigtige ballonbundt",
                "color_prompt": "Tryk på det {color} ballonbundt, som Pinkie peger på.",
                "stat": "sind", "svaer": "normal",
                "succes": "Ballonerne løsner sig roligt, og vognen daler lidt uden at miste en eneste kage.",
                "fiasko": "Vognen vipper, men Pinkie balancerer den med en bakke muffins.",
            },
            {
                "tekst": "Et vindstød sender vognen direkte mod rådhusets spir. Du har kun et øjeblik til at dreje den væk.",
                "aktion": "Styr kagevognen uden om spiret",
                "stat": "krop", "svaer": "normal",
                "succes": "Du trækker i snoren på det helt rigtige tidspunkt, og vognen suser sikkert forbi spiret.",
                "fiasko": "En ballon strejfer spiret, men Rainbow Dash skubber vognen tilbage på kurs.",
            },
            {
                "tekst": "Vognen svæver nu lige over festpladsen. Det sidste ballonbundt åbner kun, hvis du husker Pinkies hemmelige festnummer.",
                "aktion": "Husk Pinkies hemmelige festnummer",
                "stat": "charme", "svaer": "svaert",
                "succes": "Ballonerne slipper blidt, vognen lander, og alle jubler. Ikke én cupcake gik tabt! 🧁",
                "fiasko": "Pinkie hvisker en lille hjælp, og sammen får I vognen sikkert ned til festen.",
            },
        ],
    },
]


def _story_choice(choice_id, label, emoji, response, *keywords):
    return {
        "id": choice_id, "label": label, "emoji": emoji,
        "response": response, "keywords": list(keywords),
    }


_THEMED_STORY_CHOICES = {
    "regnbues-fødselsdag": [
        _story_choice("modig", "Skub møllehjulet", "💪", "Du sætter hovene mod hjulet og giver det et stærkt skub.", "skub", "hjulet"),
        _story_choice("klog", "Smør tandhjulene", "🛢️", "Du finder olie og smører de knirkende tandhjul.", "smør", "olie", "tandhjul"),
        _story_choice("ven", "Hent Big Mac", "🐴", "Big Mac kommer med et roligt nik og hjælper jer.", "big mac", "hent", "hjælp"),
        _story_choice("magi", "Brug Twilights løftemagi", "✨", "Twilight løfter forsigtigt hjulet med sin magi.", "twilight", "magi", "løft"),
    ],
    "angel-er-løbet-væk": [
        _story_choice("modig", "Spørg Rarity højt", "💎", "Du kalder venligt på Rarity og beskriver Angel.", "rarity", "spørg", "højt"),
        _story_choice("klog", "Undersøg kaninsporene", "🔎", "Du sammenligner de små spor med guleroden fra haven.", "spor", "undersøg", "kig"),
        _story_choice("ven", "Vis guleroden til Spike", "🥕", "Spike ser på guleroden og prøver at huske, hvor han så Angel.", "spike", "gulerod", "vis"),
        _story_choice("magi", "Brug Twilights søgemagi", "✨", "Twilight lader et blødt søgelys følge kaninsporene.", "twilight", "søgemagi", "magi"),
    ],
    "æblerne-ruller": [
        _story_choice("modig", "Gå gennem det høje græs", "🌾", "Du går forsigtigt ind i græsset og mærker efter æbler med hovene.", "græs", "gå", "modig"),
        _story_choice("klog", "Lav et æblekort", "🗺️", "Du tegner små mærker dér, hvor æblerne glimter mellem stråene.", "kort", "tegn", "klog"),
        _story_choice("ven", "Saml med Apple Bloom", "🍎", "Du og Apple Bloom går side om side med hver sin kurv.", "apple bloom", "sammen", "saml"),
        _story_choice("magi", "Følg venskabsglimtet", "✨", "Et varmt venskabsglimt viser de æbler, som er sværest at se.", "venskab", "glimt", "magi"),
    ],
    "raritys-glimmer-sten": [
        _story_choice("modig", "Spørg hele torvet", "📣", "Du spørger tydeligt, og alle ponyerne begynder at lede i deres hukommelse.", "torvet", "spørg", "alle"),
        _story_choice("klog", "Følg glitterstøvet", "🔎", "Du opdager små glitterkorn mellem brostenene.", "glitter", "støv", "følg"),
        _story_choice("ven", "Spørg Spike", "🐉", "Spike lover at hjælpe, selv om glimmerstenen ser lidt lækker ud.", "spike", "spørg", "ven"),
        _story_choice("magi", "Brug Twilights søgemagi", "✨", "Twilights horn lyser og finder et svagt magisk ekko.", "twilight", "søgemagi", "magi"),
    ],
    "discord-laver-sjov": [
        _story_choice("modig", "Fortæl en fjollet vittighed", "😂", "Du fortæller en vittighed om en pony med sokker på ørerne.", "vittighed", "fjollet", "fortæl"),
        _story_choice("klog", "Byt om på hat og tekop", "🎩", "Du sætter tekoppen på hovedet og hælder hatten op i en tallerken.", "hat", "tekop", "byt"),
        _story_choice("ven", "Lav en spøg med Fluttershy", "🦋", "Fluttershy hvisker en sød lille spøg, og I siger den sammen.", "fluttershy", "spøg", "sammen"),
        _story_choice("magi", "Lav et venskabs-boing", "✨", "Venskabsmagien siger boing og giver Discord en glitrende overskægssky.", "venskab", "boing", "magi"),
    ],
    "twilights-forsvundne-bog": [
        _story_choice("modig", "Gå gennem ordskyen", "☁️", "Du går roligt frem, mens ordene kilder din manke.", "gå", "ordsky", "gennem"),
        _story_choice("klog", "Sæt ordene i rækkefølge", "🔤", "Du finder begyndelsen på sætningen, og resten af ordene følger efter.", "rækkefølge", "ord", "sætning"),
        _story_choice("ven", "Bed Spike læse en vej", "🐉", "Spike læser de venlige ord højt, så de danner en sti.", "spike", "læs", "vej"),
        _story_choice("magi", "Brug rolig bogstavsmagi", "✨", "Twilight sender et roligt glimt gennem bogstaverne.", "bogstav", "twilight", "magi"),
    ],
    "lunas-forsvundne-stjerner": [
        _story_choice("modig", "Syng en modig nattesang", "🎵", "Du synger blidt om, at mørket også kan være trygt.", "syng", "sang", "modig"),
        _story_choice("klog", "Tænd et blødt månelys", "🌙", "Du spejler Lunas lys i en lille blank sten.", "måne", "lys", "tænd"),
        _story_choice("ven", "Bed Luna nynne med", "🦄", "Luna nynner sammen med dig, og skoven bliver helt rolig.", "luna", "nynne", "sammen"),
        _story_choice("magi", "Send en varm venskabsgnist", "✨", "En varm venskabsgnist lyser uden at blænde den lille stjerne.", "venskab", "gnist", "magi"),
    ],
    "pinkies-ballonkarrusel": [
        _story_choice("modig", "Hop efter snoren", "🦘", "Du tager tilløb og hopper lige op mod den flagrende snor.", "hop", "snor", "modig"),
        _story_choice("klog", "Brug en cupcake-stang", "🧁", "Pinkie binder en cupcakekurv på en lang stang, som snoren kan hænge fast i.", "cupcake", "stang", "klog"),
        _story_choice("ven", "Bed Rainbow Dash flyve op", "🌈", "Rainbow Dash suser op og vipper snoren ned mod jer.", "rainbow dash", "flyv", "hjælp"),
        _story_choice("magi", "Lav et venskabslasso", "✨", "Et glitrende venskabslasso lægger sig blødt om snoren.", "venskab", "lasso", "magi"),
    ],
}
_COLORS = [
    {"id": "rød", "label": "Rød", "spoken": "røde", "emoji": "🔴", "color": "#e53935", "keywords": ["rød", "røde"]},
    {"id": "blå", "label": "Blå", "spoken": "blå", "emoji": "🔵", "color": "#1e88e5", "keywords": ["blå"]},
    {"id": "gul", "label": "Gul", "spoken": "gule", "emoji": "🟡", "color": "#fdd835", "keywords": ["gul", "gule"]},
    {"id": "grøn", "label": "Grøn", "spoken": "grønne", "emoji": "🟢", "color": "#43a047", "keywords": ["grøn", "grønne"]},
]
_NUMBERS = [
    {"id": "1", "label": "Et", "emoji": "1️⃣", "keywords": ["1", "et"]},
    {"id": "2", "label": "To", "emoji": "2️⃣", "keywords": ["2", "to"]},
    {"id": "3", "label": "Tre", "emoji": "3️⃣", "keywords": ["3", "tre"]},
    {"id": "4", "label": "Fire", "emoji": "4️⃣", "keywords": ["4", "fire"]},
]
_MEMORY_CLUES = {
    "regnbues-fødselsdag": {
        "target": "3",
        "clue": "Twilight minder dig om, at den hemmelige fødselsdagsopskrift står i kogebog nummer tre.",
        "prompt": "Mrs. Cake spørger: Hvilket nummer havde kogebogen med den hemmelige opskrift?",
    },
    "angel-er-løbet-væk": {
        "target": "2",
        "clue": "Fluttershy fortæller, at Angel altid gemmer sig ved skilt nummer to, når han bliver bange.",
        "prompt": "Fluttershy spørger: Hvilket nummer stod der på Angels yndlingsskjulested?",
    },
    "æblerne-ruller": {
        "target": "4",
        "clue": "Applejack siger, at de reddede æbler til sidst skal ind gennem stalddør nummer fire.",
        "prompt": "Applejack spørger: Hvilket nummer havde stalddøren til æblerne?",
    },
    "raritys-glimmer-sten": {
        "target": "3",
        "clue": "Twilight siger, at du skal bruge bogen Magiske dyr nummer tre for at finde det sidste svar.",
        "prompt": "Boghandler Missy spørger: Hvilket nummer af Magiske dyr skal du bruge?",
    },
    "discord-laver-sjov": {
        "target": "1",
        "clue": "Twilight har fortalt dig, at Discords skumfidusmagi kan samles med trylleformular nummer et.",
        "prompt": "Twilight spørger: Hvilket nummer havde trylleformularen mod skumfidusmagi?",
    },
    "twilights-forsvundne-bog": {
        "target": "2",
        "clue": "Twilight siger, at bogens sidste side kan kaldes hjem med hyldekode nummer to.",
        "prompt": "Twilight spørger: Hvilket nummer havde hyldekoden til den sidste side?",
    },
    "lunas-forsvundne-stjerner": {
        "target": "4",
        "clue": "Luna fortæller, at den sidste stjerne hører til ved månetårn nummer fire.",
        "prompt": "Luna spørger: Hvilket nummer havde månetårnet til den sidste stjerne?",
    },
    "pinkies-ballonkarrusel": {
        "target": "1",
        "clue": "Pinkie hvisker, at hendes hemmelige festnummer er nummer et.",
        "prompt": "Pinkie spørger: Hvilket nummer var det hemmelige festnummer?",
    },
}


for _theme_index, _theme in enumerate(THEMAER):
    _memory = _MEMORY_CLUES[_theme["id"]]
    if _memory["clue"] not in _theme["scener"][0]["tekst"]:
        _theme["scener"][0]["tekst"] += (
            " " + _memory["clue"]
            + f" Gem nummer {_memory['target']} i hukommelsen. Det skal først bruges i den sidste opgave."
        )
    for _index, _scene in enumerate(_theme["scener"]):
        if _index in (0, 3):
            _interaction = {
                "type": "dice",
                "prompt": f"Kast terningen for at se, hvordan det går. Din opgave er: {_scene['aktion']}.",
            }
        elif _index == 1:
            _interaction = {
                "type": "choice", "prompt": "Hvordan vil du gøre det? Vælg en mulighed.",
                "options": [dict(option) for option in _THEMED_STORY_CHOICES[_theme["id"]]],
            }
        elif _index == 2:
            _scene["tekst"] = (
                f"Nummer {_memory['target']} fra starten skal gemmes til den sidste opgave. "
                "Lige nu kommer en ny farveopgave. " + _scene["tekst"]
            )
            _target = _COLORS[(_theme_index + _index) % len(_COLORS)]
            _color_prompt = _scene.get(
                "color_prompt",
                "Tryk på den {color} mulighed for at fortsætte eventyret.",
            )
            _interaction = {
                "type": "color",
                "prompt": _color_prompt.format(color=_target["spoken"]),
                "target": _target["id"], "options": [dict(option) for option in _COLORS],
            }
        else:
            _target = next(item for item in _NUMBERS if item["id"] == _memory["target"])
            _interaction = {
                "type": "memory",
                "prompt": _memory["prompt"] + " Vælg et, to, tre eller fire.",
                "target": _target["id"], "options": [dict(option) for option in _NUMBERS],
            }
        _scene["interaction"] = _interaction

        if _interaction["type"] == "dice":
            _question_text = f"Er du klar? Din opgave er: {_scene['aktion']}."
            _intents = [{
                "id": "ready", "choice_id": "roll_scene",
                "description": "barnet er klar og vil kaste terningen",
                "keywords": ["ja", "klar", "kom så", "afsted", "gør det", "lad os", "kast"],
                "synonyms": ["jeg er klar", "det vil jeg", "vi gør det", "jeg vil gerne"],
                "positive_response": ["Ja! Nu kaster vi terningen!"],
            }]
        else:
            _number_words = ["et", "to", "tre", "fire"]
            _ordinal_words = ["første", "anden", "tredje", "fjerde"]
            _labels = ", ".join(
                f"mulighed {option_index + 1}: {option['label']}"
                for option_index, option in enumerate(_interaction["options"])
            )
            _question_text = f"{_interaction['prompt']} Mulighederne er {_labels}."
            _intents = [{
                "id": f"choose_{option['id']}",
                "choice_id": f"interaction:{option['id']}",
                "description": f"barnet vælger {option['label']}",
                "keywords": option.get("keywords", [option["label"]])
                    + [str(option_index + 1), _ordinal_words[option_index]],
                "synonyms": [
                    f"jeg vælger {option['label']}", f"tryk på {option['label']}",
                    f"mulighed {_number_words[option_index]}",
                    f"nummer {_number_words[option_index]}",
                ],
                "positive_response": [f"Du valgte {option['label']}!"],
            } for option_index, option in enumerate(_interaction["options"])]
        _intents.append({
            "id": "not_ready", "choice_id": "wait",
            "description": "barnet vil vente eller er ikke klar endnu",
            "keywords": ["nej", "vent", "stop", "ikke endnu"],
            "synonyms": ["jeg er ikke klar", "vi skal vente"],
            "positive_response": ["Det er helt okay. Vi venter lidt."],
        })
        _scene["voice"] = {
            "enabled": True,
            "question": {
                "id": f"{_theme['id']}-{_index + 1}-{_interaction['type']}",
                "text": _question_text,
                "intents": _intents,
                "fallback": {
                    "retry_prompt": "Jeg hørte dig ikke helt. Vil du prøve igen?",
                    "max_retries": 2, "after_max_retries": "show_visual_choices",
                },
            },
        }


def _validate_mixed_interactions(themes):
    """Keep every adventure playable with both dice and four-option scenes."""
    for theme in themes:
        interactions = [scene.get("interaction", {}) for scene in theme.get("scener", [])]
        has_dice = any(item.get("type") == "dice" for item in interactions)
        answer_scenes = [item for item in interactions if item.get("type") != "dice"]
        if not has_dice or not answer_scenes:
            raise ValueError(f"Eventyret {theme.get('id')} skal have både terningkast og svarmuligheder")
        if any(len(item.get("options", [])) != 4 for item in answer_scenes):
            raise ValueError(f"Alle svarscener i {theme.get('id')} skal have præcis fire muligheder")


_validate_mixed_interactions(THEMAER)
