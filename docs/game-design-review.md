# Spildesign-gennemgang: My Little Pony — Halerne i Equestria (web)

Genereret med `game-design`-pluginets `loop-check`- og `verify-design`-skabeloner, baseret på den faktiske implementering (`App.js`, `GameScenePage.js`, `services/api.js`, `services/achievements.js`, `web/app.py`) og på det officielle regelsæt i `rulbog.txt` (den danske udgave af *Tails of Equestria*).

## Kerneløkke-analyse: Scene → Terningkast → Konsekvens

### Løkken
```
[Vælg pony + tema] → [Læs scene] → [Kast terninger] → [Succes/fiasko-historiebid] → (gentag ca. 5x) → [Slut: sejr/nederlag + point]
```

### Delelementernes sundhed

#### Målklarhed
**Vurdering:** Tilstrækkelig
- Er målet altid synligt? Ja — fremgangslinjen med 5 prikker (`GameScenePage.js:44-52`) samt sceneteksten og handlingslabellen ("Du skal: …") gør det umiddelbare mål tydeligt.
- Er det tiltrækkende? Til dels — det umiddelbare mål ("Kast terningerne!") er klart, men der er ikke noget synligt langsigtet mål på skærmen, mens man er inde i en scene.
- Er det opnåeligt? Ja — sværhedsgraden er ét enkelt d6-pulje-slag pr. scene.
**Bemærkninger:** Handlingslabellen er god designpraksis — den navngiver hensigten *før* kastet, ikke bagefter.

#### Handlingsengagement
**Vurdering:** Svag
- Er selve handlingen sjov fra øjeblik til øjeblik? Den eneste spillerhandling er at trykke på én "kast"-knap (`onRollDice`). Der er intet valg — ingen forgrenende beslutninger, intet valg af *hvilken* egenskab eller talent der kastes med, ingen risiko/gevinst-afvejning.
- Betyder dygtighed noget? Nej. Ponytypen sætter et fast `diceBonus` (+1 eller +2) ved oprettelsen; derefter er hvert kast ren tilfældighed uden spilleragens pr. tur.
- Er feedback øjeblikkelig? Ja — terningeanimation, lydeffekter (`playRoll`/`playSuccess`/`playFail`) og et nyt punkt i historik-feedet udløses samtidig.
**Bemærkninger:** Dette er løkkens største svaghed. Selve bordrollespillet (jf. `rulbog.txt`) lader spillerne vælge *hvilken* egenskab (krop/sind/charme) og *hvilket* talent der skal kastes med — det valg er selve spillet. I regelbogen hedder det ligefrem: *"Dette spil har ikke et fast antal handlinger du kan tage, men lader dig i stedet komme med mange løsninger på dine problemer."* Webversionen koger dette ned til én knap, hvilket er en rimelig forenkling for en ung målgruppe, men det fjerner den eneste dygtighedsudfoldelse, som kildematerialet har.

#### Belønningstilfredshed
**Vurdering:** Tilstrækkelig
- Er belønningen knyttet til handlingen? Ja — succes/fiasko styrer direkte det næste historiebid (`item.story`).
- Er belønningen passende doseret? Terningudfaldet påvirker kun stemningstekst inden for en scene; det fremgår ikke tydeligt af frontend'en, om en fiasko kan afslutte et forløb tidligt, eller blot farver fortællingen.
- Er der variation? Delvist — regelbogens d6-system skelner mellem "fantastisk succes" (dobbelt-6'ere), almindelig succes og "ulykker" (1-tal, se `Tæl_Succes`/`tael_succeser`), men UI'en viser kun et binært `item.success`-felt, så gradsforskellen går tabt.
**Bemærkninger:** Overvej at vise "fantastisk succes"-niveauet tydeligt i historik-feedet — det udregnes allerede server-side (`fantastiske` i `historie.py`), men ser ud til at blive kasseret, før det når klienten.

#### Investeringskrog
**Vurdering:** Svag
- Investerer spilleren tilbage i løkken? Kun via `achievements.js` — badges på tværs af sessioner (antal spil, sejre, bedste score) gemt i localStorage.
- Skaber investeringen ejerskab? Minimalt — ponyvalget har kosmetisk identitet (navn/emoji/farve), men ingen vedvarende karaktervækst inden for eller på tværs af forløb.
- Forbedrer investeringen fremtidige løkker? Nej — hvert forløb starter forfra; der er ingen oplåsninger, ingen talentvækst, ingen pony der følger med videre. Dette står i skarp kontrast til regelbogens *Niveauer og niveauer op*-kapitel, hvor en pony efter et eventyr stiger i niveau, opgraderer en egenskab, får flere Venskabstegn og opgraderer brugte talenter.
**Bemærkninger:** Badge-systemet (`computeBadges`) er den eneste fastholdelseskrog. Det er talbaseret (antal spil/sejre) frem for knyttet til *hvordan* man spillede — der findes fx intet badge for en bestemt ponytype eller for et forløb uden en eneste fiasko.

### Løkkens bæredygtighed

**Gentagelsestolerance:** Lav-mellem
Et forløb er ca. 5 scener (afgrænset visuelt af de 5 fremgangsprikker) med ét knaptryk hver — ca. 2-3 minutter. For målgruppen (børn sammen med en voksen, jf. regelbogens ramme: *"Den bedste størrelse for en gruppe er fire personer"* og GM-rollen beskrevet som ofte en forælder) er det en passende sessionlængde, men der er ikke meget grund til at *spille igen*, ud over at opleve et andet tema eller en anden pony, da selve kastet ikke har noget beslutningsrum.

**Variationspunkter:**
- Temavalg (`ThemeSelectPage`) ændrer historieindholdet.
- Ponytype ændrer `diceBonus` og kosmetisk fremtoning.
- Server-side scene-forgrening ved succes/fiasko (jf. den forgrenende fortælling i `historie.py`).

**Naturlige stoppesteder:** Efter hver scene er afgjort, før næste kast; samt på `GameEndPage` (sejr/nederlag).

### Diagnose
Løkken er komplet og lukker pænt (mål → handling → feedback → belønning → gentag), men **handlings**-trinnet har næsten ingen spilleragens: det eneste input er ét tryk på "kast", så løkken minder mere om en interaktiv billedbog med en tilfældighedsgenerator end om et dygtighedsbaseret spil. Det er et legitimt designvalg for målgruppen (en dansksproget, familievenlig genfortælling af et bordrollespil), men det bør være et bevidst valg — ikke bare en forenkling, der er sket undervejs.

### Anbefalinger
1. **Lad spilleren vælge egenskab/talent før kastet** (krop/sind/charme + evt. talentbonus), selv med bare 2-3 knapper — det genindfører det ene meningsfulde valg, som kildespillet har, og kan kobles direkte på den eksisterende `test()`-logik i `historie.py`/`web/app.py`, som allerede understøtter en `talent`-parameter.
2. **Vis "fantastisk succes" (dobbelt-6) tydeligt i UI'en** — dataene findes allerede server-side; en distinkt animation/farve i `DiceRoll`/historik-feedet vil gøre store sejre mere følelsesmæssigt tydelige uden nyt backend-arbejde.
3. **Tilføj en let overlevering mellem forløb** — fx et per-ponytype "venskabstegn"-antal i `achievements.js`, der låser en kosmetisk detalje eller en temabonus-scene op, inspireret af regelbogens Tokens of Friendship-system. Det giver det nuværende rene tilskuer-statistiksystem noget på spil.

---

## Designverifikation: Scene/Kast/Historie-systemet

## Sammendrag
**Kerneløkke:** Komplet, men lav agens (se loop-check ovenfor)
**Mekanik:** Sammenhængende — ét d6-pulje-testsystem bruges konsekvent i `engine.py`-slægten, `historie.py` og `web/app.py`, og matcher regelbogens system (6=dobbelt succes, 4-5=én succes, 1=ulykke).
**Progression:** Ikke relevant på samme måde som bordudgaven — dette er et enkelt-sessions historiespil uden niveau-op mellem forløb, i modsætning til regelbogens fulde progressionssystem (niveauer, talentopgraderinger, udholdenhedsvækst).
**Oplevelse:** Klar for målgruppen; uklar for enhver, der forventer spilleragens ud over terningtryk.

## Mekanikanalyse
| Mekanik | Formål | Klarhed |
|---|---|---|
| d6-pulje-test (`Tæl_Succes`/`tael_succeser`) | Afgør scenehandlinger | Klar: 6=2 succeser, 4-5=1 succes, 1=ulykke. Matcher regelbogens system konsekvent gennem hele kodebasen. |
| Ponytypens `diceBonus` | Differentiere ponyvalg | Svag: påvirker kun ét tal ved karakteroprettelse; ingen anden typespecifik adfærd er synlig client-side (til sammenligning giver regelbogen hver ponytype et helt gratis starttalent: Stout Heart, Fly eller Telekinese). |
| Sværhedsgrader (let/normal/svært/meget svært) | Skalere sceneudfordring | Klar, matcher kildebogens sværhedsstige. |
| Præstationer/badges | Fastholdelse | Klar, men overfladisk — kun tal-tærskler, ingen build- eller dygtighedsspecifikke badges. |

## Systemsammenhæng
### Ressourceflow
- Den eneste "ressource" er terningsuccesser, som bruges med det samme mod en scenes sværhedsgrad — ingen vedvarende ressource (udholdenhed) er synligt sporet eller brugt på tværs af scener i frontend'en, selvom `Udholdenhed` findes i Pony-datamodellen og har en klar rolle i regelbogen (når udholdenheden når 0, er ponyen "for træt til at fortsætte, og må stoppe og hvile"). **Dette bør undersøges**: hvis udholdenhed spores server-side, men aldrig vises, har fiasko ingen synlige konsekvenser for spilleren.

### Kantsituationer
- [x] Nul-tilstand: en pony med 0 i en egenskab kan stadig kaste (0-terningers pulje) — bør bekræftes, at `web/app.py` håndterer et 0-terningskast pænt (en tom terningeliste) i stedet for at fejle.
- [ ] **Uverificeret**: hvad sker der ved gentagne fiaskoer — findes der en tabsbetingelse, eller ruter historien blot gennem fiasko-grene i det uendelige? `GameEndPage` antyder, at der findes en nederlagstilstand, men udløsningsbetingelsen fremgår ikke af de gennemgåede frontend-filer.

## Fundne problemer
| Problem | Kategori | Alvor | Anbefaling |
|---|---|---|---|
| Intet spillervalg i kast-trinnet | Mekanik/Oplevelse | Middel | Tilføj valg af egenskab/talent før kast (se loop-check-anbefaling #1) |
| "Fantastisk succes" (dobbelt-6) beregnes, men vises ikke i UI | Oplevelse | Lav | Send `fantastiske`-tallet med i API-svaret og vis det tydeligt |
| Udholdenhed modelleret, men tilsyneladende ikke brugt synligt i frontend'en | Systemsammenhæng | Middel — kræver verifikation | Bekræft om `web/app.py` bruger udholdenhed som en fiasko-ressource; vis den i så fald i `GameScenePage` |
| Præstationer er kun tal-baserede, ingen variation | Investering | Lav | Tilføj ponytype- eller kastkvalitets-specifikke badges |

## Dom
**Design-klar:** Ja, med justeringer — løkken fungerer og leverer et sammenhængende, letforståeligt historiespil til sin målgruppe; anbefalingerne ovenfor er forbedringer, ikke blokerende problemer.
**Blokerende problemer:** Ingen.
**Spørgsmål til playtesting:** Vil børn faktisk have et egenskabsvalg-trin, eller betyder den simple ét-knap-oplevelse mere for målgruppens alder end agens gør? Dette bør afprøves med rigtige spillere, før anbefaling #1 implementeres — det er en reel designafvejning, ikke en åbenlys fejl.

## Næste skridt
1. Bekræft fiasko-/tabsbetingelsen server-side (`web/app.py`) og dokumentér den her.
2. Beslut, sammen med rigtige playtestere, om egenskabsvalg-trinnet (anbefaling #1) skal tilføjes — det er den enkeltstående ændring med størst potentiel effekt, men kun hvis målgruppen efterspørger det.
3. Før "fantastisk succes"-feedback igennem til UI'en (lav omkostning, ingen designrisiko).
