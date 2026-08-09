# Hermes / vLLM / Qwen — Analyse og Fixes
**Dato:** 26. juni 2026  
**Stack:** Hermes Agent v0.13.0 · vLLM (TP2, fp8) · Qwen3.6-27B-fp8 @ 192.168.1.98:8010

---

## Symptomer (udgangspunkt)

- Hermes lavede ingen tool calls — svarede fra hukommelse og hallucerede
- Dansk PDF af My Little Pony-reglerne blev aldrig oprettet
- Sessioner med mange beskeder/tokens crashede med "Connection error after 3 retries"
- Hermes tog 20–30 sekunder at starte op

---

## Rodårsager — lag for lag

### 1. Hermes-konfiguration

**`tool_use_enforcement: auto` (primær fejl)**  
Med `auto` lader Hermes modellen selv bestemme om den bruger tools. Qwen3 springer tool calls over når den tror den allerede kender svaret — typisk fordi den kan se CWD i session-banneret. Resultatet: den hallucerede filnavne og stier i stedet for at bruge `list_files` eller `execute_code`.

**`streaming: false`**  
Uden streaming venter Hermes på hele HTTP-responsen før den viser noget. Hvis modellen er langsom (stor kontekst, mange tokens) og TCP-forbindelsen stilles, taber Hermes alt arbejde og genstarter fra scratch.

**Auxiliary auto-detect (startup-overhead)**  
Ved hvert opstart lavede Hermes 5–6 separate API-kald til vLLM for at "auto-detecte" hvilken model der understøtter vision, komprimering, session-søgning osv. Ingen af disse providers var konfigureret eksplicit, så Hermes prøvede dem alle.

**Kontekst-komprimering for sen**  
Komprimeringstærsklen var 50% af kontekstvinduet. Sessioner voksede til 40–56 beskeder (~18k tokens) inden komprimering sparkede ind — på det tidspunkt er KV-cache-presset allerede højt.

---

### 2. Modellen (Qwen3.6-27B)

**Thinking mode er nødvendig for tool calls**  
Qwen3 genererer interne `<think>...</think>` reasoning-tokens inden den svarer. Tests viste at uden thinking-tokens laver modellen ikke tool calls — den genererer tekst i stedet. Thinking mode skal være **slået til** på hoved-agenten.

**Thinking tokens er dyre ved store prompts**  
Med 28+ tool-definitioner i system-prompten og lang samtalehistorik kan Qwen generere hundredvis af thinking-tokens. Ved 24 tok/s = mange sekunders forsinkelse. Det forklarer den høje gennemsnitlige TTFT.

**vLLM-metrikker (samlet siden opstart):**

| Metrik | Værdi |
|---|---|
| Gennemsnitlig time-to-first-token | 73 sekunder |
| Gennemsnitlig e2e latency | 104 sekunder |
| Genereringshastighed | 24 tok/s |
| KV-cache hit rate | 76% |
| Samlede requests | 161 |
| Samlede prompt-tokens | 4,5 millioner |
| Samlede genererede tokens | 116.000 |

Den høje gennemsnitlige TTFT skyldes primært thinking-tokens + store prompts. 76% KV-cache hit rate er god og reducerer prefill-tid markant ved gentagne system-prompts.

---

### 3. vLLM / netværk

**Connection errors er netværks-events, ikke timeouts**  
Alle 12 connection errors i loggen kan grupperes i klynger: tre sessioner fejlede inden for 1 sekund af hinanden (kl. 21:04:54–55). Det er ikke Hermes der timer ud — det er AI-hosten (.98) der mister routing eller går ned kortvarigt. vLLM-serveren selv rapporterer 0 errors og 0 aborts i sine metrics.

**Fejlene skalerer med sessionslængde:**

| Tokens ved fejl | Antal hændelser |
|---|---|
| ~5–7k tokens | 4 |
| ~10–18k tokens | 5 |
| ~37–49k tokens | 3 |

Større sessioner er mere eksponeret fordi de tager længere tid og giver netværksfejl flere chancer for at afbryde dem.

**vLLM konfiguration er sund:**  
- Tensor parallelism 2 (TP2) — to GPU'er
- Spec decoding aktiv (55.786 drafts, ~35% accept rate)
- Ingen preemptions, ingen server-side errors

---

## Rettede fixes (anvendt 26. juni 2026)

### Hermes `~/.hermes/config.yaml`

| Indstilling | Før | Efter | Effekt |
|---|---|---|---|
| `agent.tool_use_enforcement` | `auto` | `required` | Modellen skal altid forsøge tool call |
| `agent.api_max_retries` | 3 | 7 | Overlever kortvarige netværksdrop |
| `display.streaming` | `false` | `true` | Partial tokens gemmes ved connection drop |
| `compression.threshold` | `0.5` | `0.3` | Komprimerer tidligere → mindre KV-cache pres |
| `compression.target_ratio` | `0.2` | `0.1` | Komprimerer mere aggressivt |
| `providers.custom.request_timeout_seconds` | ikke sat | `600` | Eksplicit timeout i stedet for uvicorn-default |
| `providers.custom.stale_timeout_seconds` | ikke sat | `600` | Forhindrer tidlig HTTP-disconnect |
| Alle `auxiliary.*` | `provider: auto` | `provider: custom` (eksplicit) | Eliminerer 5–6 auto-detect API-kald ved startup |
| Auxiliary `extra_body` | ikke sat | `{chat_template_kwargs: {enable_thinking: false}}` | Thinking slået fra på titel/komprimering/søgning — ikke nødvendigt der |

### Verificeret efter fixes

```
$ hermes -z "hvad er diskforbruget på /home/alex mappen? brug dine tools"
→ Kaldte execute_code med 'du -sh /home/alex/*'
→ Returnerede korrekt svar: 41 GB total, comfy/ = 25 GB
→ Tid: 29 sekunder (tool call + svar)
```

Tool calls virker nu konsistent.

---

## Hvad der stadig mangler (kræver adgang til .98)

**Netværksrouting**  
Connection errors opstår fordi AI-hosten (.98) mister routing kortvarigt. Fix: stabil routing/failover på netværkslaget, evt. keepalive-indstillinger på NIC'en eller switch-porten.

**vLLM opstart med eksplicit model-config**  
Overvej at starte vLLM med:
```
--max-model-len 65536   # Reducér fra 262k hvis lange kontekster ikke bruges
--gpu-memory-utilization 0.90
```
Et mindre `max-model-len` giver mere KV-cache til samtidige requests og reducerer risikoen for OOM ved lange sessioner.

**Thinking budget**  
Qwen3 understøtter `thinking_budget` i `chat_template_kwargs` for at begrænse antal thinking-tokens. Et budget på fx 1024 ville reducere TTFT på store prompts uden at miste tool-call-evnen:
```yaml
# I Hermes config for hoved-modellen (IKKE auxiliary):
# Kan sættes via extra_body når Hermes understøtter det
```

---

## Konklusion

Kerneproblemet var en kombination af to Hermes-indstillinger (`tool_use_enforcement: auto` + `streaming: false`) der tilsammen betød at modellen aldrig lavede tool calls og at fejl ikke kunne overleves. Netværksinstabiliteten på .98 forværrede situationen men er ikke den primære årsag til at tool calls udeblev.

Efter fixes kan Hermes nu konsistent kalde tools, overleve korte netværksdrop, og starte op uden 5–6 unødvendige model-kald.
