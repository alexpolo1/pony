# Web-/lydgennemgang: pony-frontend

Genereret med `web-games`-pluginets `web-optimization-checklist`- og `web-audio-specialist`-skabeloner, tilpasset til den faktiske kode i `pony-frontend/` (Create React App 5 / react-scripts, React 19, framer-motion) i stedet for at gengive den generiske tjekliste ukritisk.

## Lydarkitektur: pony-frontend

## Lydoversigt
**Lydkontekst:** Én delt `AudioContext` via singleton'en `AudioManager` i `SceneMusic.js` — korrekt arkitektur (matcher "single context, multiple channels"-princippet).
**Kanaler:** `masterGain` → `musicGain` + `sfxGain`, med volumen persisteret i `localStorage` (`pony_music_vol`, `pony_sfx_vol`, `pony_muted`).
**Format-strategi:** Ingen lydfiler overhovedet — al lyd (musik og SFX) genereres proceduralt med oscillatorer (`createOscillator`/`createBiquadFilter`). Det betyder, at store dele af den generiske "asset-optimering"-tjekliste (MP3/OGG-formater, komprimering, audio sprites, streaming) simpelthen ikke er relevant her — der er 0 KB lyd-assets at optimere.

## Fund (specifikt for denne kode)

### 1. `SoundFX.js` er dødt/duplikeret kode
`SoundFX.js` genimplementerer nøjagtig de samme funktioner (`playClick`, `playRoll`, `playSuccess`, `playFail`, `playSelect`, `playVictory`) som allerede eksporteres fra `SceneMusic.js` — men med sin egen rå `AudioContext` forbundet direkte til `ctx.destination`, uden om `AudioManager`s gain-struktur. `App.js` importerer udelukkende fra `./SceneMusic`, så `SoundFX.js` ser ud til aldrig at blive brugt.
**Konsekvens:** Hvis filen nogensinde importeres ved en fejl (fx under en refaktorering), vil de lyde, den afspiller, ignorere spillerens lydstyrke- og mute-indstillinger, fordi de ikke går gennem `sfxGain`/`masterGain`.
**Anbefaling:** Slet `SoundFX.js`. Det er ren dødvægt og en fælde for fremtidige imports.

### 2. Kun musik-lydstyrke er justerbar i UI'en
`AudioManager` understøtter separate `musicGain`/`sfxGain`-kanaler, men `VolumeControl.js` kalder kun `setMasterVolume(v)`, som mapper til `setMusicVolume` (se kommentaren "Backward-compatible master volume (maps to music)" i `SceneMusic.js:195-199`). SFX-lydstyrken er derfor låst til sin `localStorage`-standardværdi (0.7) eller sidst gemte værdi og kan ikke justeres fra UI'en, selvom infrastrukturen til det allerede findes.
**Anbefaling:** Enten tilføj en synlig SFX-lydstyrkeknap, eller — hvis én samlet skyder er et bevidst UX-valg for målgruppen (børn) — lad `VolumeControl` kalde både `setMusicVolume` og `setSfxVolume`, så "mute" reelt slukker alt, ikke kun musikken.

### 3. Ingen håndtering af faneskift/afbrydelse
`SceneMusic` lytter ikke til `document.visibilitychange` eller `AudioContext`s `statechange`-event. Musikken (drevet af `setInterval(playMelody, …)` og `setInterval(playPad, 8000)`) fortsætter med at planlægge noder, selv når fanen er skjult, hvilket spilder CPU/batteri på mobil og kan give en pludselig lydbrag, når man vender tilbage til fanen, hvis flere planlagte noder er stablet op.
**Anbefaling:** Suspendér `AudioContext` ved `document.hidden` og genoptag ved synlighed (standardmønster, se f.eks. iOS Safari-afbrydelseshåndtering).

### 4. `manifest.json` er stadig CRA's standardskabelon
`public/manifest.json` indeholder stadig `"short_name": "React App"` og `"name": "Create React App Sample"` — den er aldrig tilpasset til spillet. `theme_color` er sort og `background_color` hvid, uden sammenhæng med spillets faktiske farvepalet.
**Anbefaling:** Udfyld navn, kort navn, temafarve og ikoner, hvis siden nogensinde skal kunne installeres som PWA (se punkt 5).

### 5. Ingen service worker / ingen reel PWA
Der er intet service worker-register i `src/index.js`, og `reportWebVitals.js` er den eneste "extra" fra CRA-skabelonen. Appen er reelt en almindelig SPA uden offline-understøttelse eller cache-first-indlæsning, selvom `manifest.json` antyder PWA-hensigt.
**Anbefaling:** Enten fjern PWA-artefakterne helt for at undgå at love noget, siden ikke leverer, eller tilføj CRA's indbyggede `serviceWorkerRegistration` (kræver at skifte fra `register()`/`unregister()`-boilerplaten, som CRA 5 stadig leverer som opt-in).

### 6. Ubrugt asset-mappe
`public/music/` eksisterer, men er tom — sandsynligvis en rest fra en tidligere plan om at bruge indspillede lydfiler, før musikken blev lagt om til proceduralt genereret lyd.
**Anbefaling:** Fjern den tomme mappe, eller dokumentér hvorfor den er der, hvis den er tiltænkt fremtidig brug.

## Platformovervejelser

### Mobilhåndtering
- **Brugerinteraktions-oplåsning:** Håndteres korrekt — `App.js` viser en eksplicit "Aktivér lyd"-prompt (`enableSound` → `resumeAudioContext()`), som overholder browsernes autoplay-politik.
- **Afbrydelseshåndtering:** Mangler (se fund #3).
- **Baggrundslyd:** Ikke defineret opførsel — bør besluttes bevidst (se fund #3).

### Browserkompatibilitet
| Funktion | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| Web Audio API | ✓ | ✓ | ✓ | ✓ |
| `BiquadFilterNode` (bruges i `playPad`) | ✓ | ✓ | ✓ | ✓ |
| `webkitAudioContext`-fallback | ✓ (ikke nødvendig) | ✓ (ikke nødvendig) | Understøttet i `AudioManager.init()` — god praksis | ✓ |

---

## Optimeringstjekliste til weblansering: pony-frontend

Tilpasset til det, der faktisk er relevant for et CRA/React 19/framer-motion-projekt uden lydfiler eller WebGL.

### Build-optimering
- [ ] Kør `npm run build` og inspicér output med `source-map-explorer` eller `react-scripts`-standard bundle-rapporten — `framer-motion` er et relativt tungt afhængighed, og det er værd at bekræfte, at kun de nødvendige dele importeres.
- [ ] Overvej om Create React App (react-scripts 5, i praksis uvedligeholdt siden 2023) fortsat er det rette byggeværktøj, eller om en migrering til Vite ville reducere build-tid og bundle-størrelse — dette er en større beslutning og ikke noget, der skal gøres uden en eksplicit vurdering.
- [ ] CSS er allerede organiseret i design-tokens (jf. tidligere CSS-refaktorering) — bekræft at ubrugt CSS ikke akkumuleres, efterhånden som komponenter fjernes.

### Asset-optimering
- [x] **Lyd:** Ikke relevant — al lyd er proceduralt genereret, 0 KB lydassets.
- [ ] **Billeder:** Ponybilleder (`data.ponyImg`, hentet fra backend'en via `${API}${data.ponyImg}`) bør tjekkes for komprimering og passende opløsning — dette ligger i `web/`-backend'en, ikke i frontend-repoet, og er ikke gennemgået her.
- [ ] **Fonte:** Ingen brugerdefinerede web-fonte fundet i de gennemgåede filer — bekræft i `index.css`/`App.css` om systemfonte bruges (billigst) eller om der indlæses eksterne fonte, der bør subsettes.

### Runtime-ydeevne
- [ ] `SceneMusic`s `setInterval`-baserede node-planlægning (fund #3) bør profileres på en lav-effekt mobilenhed for at bekræfte, at det ikke giver mærkbare hak i `framer-motion`-animationerne, som kører samtidig på samme hovedtråd.
- [ ] Bekræft, at `activeNodesRef`/`activeNodes`-oprydningen i `AudioManager.scheduleNote` rent faktisk forhindrer akkumulering af oscillator-noder over en lang spilsession (koden ser korrekt ud ved gennemlæsning, men bør verificeres i praksis over 10+ minutters kørsel).

### Indlæsningsydeevne
- [ ] Mål First Contentful Paint / Time to Interactive med Lighthouse — ingen eksisterende måling er fundet i repoet.
- [ ] `api.loadContent()` kaldes ved opstart og har en fallback til `DEFAULT_PONIES`, hvis backend'en fejler (god praksis) — bekræft at brugeren ser en meningsfuld loading-tilstand, mens dette kald er undervejs (ser ud til at være tilfældet via `loading`-state i `App.js`).

### Mobiloptimering
- [ ] Berøringsmål: "🎲 KAST TERNINGERNE!"-knappen og navigationsknapperne bør måles for at bekræfte ≥48px berøringsflade, særligt for målgruppen (børn, som ofte har mindre præcis finger-styring).
- [ ] Bekræft responsivt layout på faktiske mobilskærme — ikke verificeret i denne gennemgang (kræver visuel test, se anbefaling nedenfor).

### PWA-tjekliste
- [ ] `manifest.json` er ikke udfyldt korrekt (fund #4) — enten ret det op, eller fjern PWA-ambitionen bevidst.
- [ ] Ingen service worker registreret (fund #5).

### Før lancering
- [ ] Kør browserkonsollen igennem for fejl/advarsler på alle sider (Home, Theme, PonySelect, GameScene, GameEnd).
- [ ] Bekræft at `SoundFX.js` fjernes, så det ikke ved en fejl importeres senere (fund #1).

## Ydeevnebudget
| Metrik | Budget | Status |
|---|---|---|
| Lyd-assets (KB) | 0 (proceduralt) | ✓ Opfyldt af design |
| Berøringsmål | ≥48px | Ikke målt i denne gennemgang |
| Initial indlæsning | <3s Time to Interactive | Ikke målt — kræver Lighthouse-kørsel i browser |

**Bemærkning om dækning:** Denne gennemgang er baseret på statisk kodelæsning, ikke en kørende måling i browseren (ingen Lighthouse-/DevTools-profil er kørt). Punkterne markeret "Ikke målt" bør verificeres ved faktisk at køre appen, før de afkrydses.
