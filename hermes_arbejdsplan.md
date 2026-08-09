# Hermes Arbejdsplan — MLP Web Spil
## Mål: Byg et komplet web-spil til 4-årige på dansk

---

## OPGAVE 1: Børnevenlig spilgenerator
Fil: /home/alex/pony/ny_spiller.py (allerede eksisterer — opdater den)
- Eventyr-temaer: kun søde, ingen monstre/forbandelser. Eksempler:
  * "Regnbues fødselsdag: vi skal bage en kage men vi mangler mel!"
  * "Fluttershys kanin Angel er løbet væk — hjælp med at finde ham"
  * "Pinkie Pie vil lave en overraskelsesfest men noget går galt"
  * "Applejacks æbler er rullet ned ad bakken — saml dem inden mørket"
  * "En lille ponyfol er bange for tordenvejr — beroelig ham"
  * "Rarity har mistet sin glimmer-sten — find den i Ponyville"
- Sværhedsgrader hedder: Nemt / Lidt svært / Svært / Meget svært
- Udfald hedder: "Ja! Det lykkedes!" / "Ops! Prøv igen!"
- Ingen "FIASKO" eller "MISLYKKES" — brug venlige ord
- Skriv korte situationsbeskrivelser (max 2 sætninger)

## OPGAVE 2: Flask web app
Fil: /home/alex/pony/web/app.py
- Route GET / → forsiden (velkommen)
- Route GET /spil → kører ny_spiller.py, viser resultatet
- Route GET /spil/nyt → starter nyt spil (redirect til /spil)
- Port: 5001
- Kør ny_spiller.py som subprocess og parse outputtet

## OPGAVE 3: HTML templates (til 4-årige)
Filer: /home/alex/pony/web/templates/base.html
       /home/alex/pony/web/templates/index.html  
       /home/alex/pony/web/templates/spil.html
- Store, farverige knapper (font-size mindst 1.5rem)
- MLP farver: pink, lilla, gul, grøn
- Vis ponyer med emoji (🦄🐴🦅✨)
- Vis terninger stort og tydeligt med animation
- "Næste scene" knap — vis én scene ad gangen
- "Ja!" i grønt, "Ops!" i gul — aldrig rødt/skræmmende

## OPGAVE 4: CSS
Fil: /home/alex/pony/web/static/style.css
- Nunito eller Fredoka One font (Google Fonts)
- Gradient baggrund (pink til lilla)
- Store runde knapper med skygge
- Terning-animation ved kast
- Responsivt layout

## OPGAVE 5: ComfyUI bannerbillede
Fil: /home/alex/pony/web/static/images/banner.png
Script: /home/alex/pony/comfyui_banner.py
- ComfyUI API på http://localhost:8188
- Model: RealVisXL_V4.0.safetensors
- Prompt: "cute colorful my little pony characters, magical equestria, rainbow, flowers, children illustration, bright colors"
- Negativ: "dark, scary, violence, realistic, ugly"
- Størrelse: 768x384
- Gem til /home/alex/pony/web/static/images/banner.png

## OPGAVE 6: Nginx config
Fil: /tmp/nginx_mlp_only.conf
- Listen port 8082
- proxy_pass til http://127.0.0.1:5001
- /static/ server fra /home/alex/pony/web/static/

## OPGAVE 7: Git repo
- git config user.email "alex@equestria.dk"
- git config user.name "Alex Dencker"
- git add og commit alle filer i /home/alex/pony/

## OPGAVE 8: Test — spil et spil igennem
- Kør ny_spiller.py og gem et nyt spillerapport
- Tjek at web-sitet svarer på http://localhost:5001/
- Skriv testresultater til /home/alex/pony/arbejdslog.txt

---

## REGLER FOR HERMES:
1. Skriv ALT på dansk (kode-kommentarer kan være engelsk)
2. Test alt du bygger ved at køre det
3. Skriv status til /home/alex/pony/arbejdslog.txt efter hver opgave
4. Ingen mørke temaer — det er et spil for 4-årige
5. Brug write_file til at gemme filer, execute_code til at teste
