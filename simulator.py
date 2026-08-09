#!/usr/bin/env python3
"""Simulerer en voksen og et 4-årigt barn der spiller My Little Pony: Tails of Equestria."""

import subprocess
import sys
import textwrap

PDF = "/home/alex/pony/My_Little_Pony_Dansk.pdf"
HERMES = "/home/alex/.hermes-remote/venv/bin/hermes"

ADULT_SYSTEM = f"""Du er en voksen forælder der spiller My Little Pony: Tails of Equestria med sit 4-årige barn.
Du er Fortæller (GM). Du har læst reglerne i {PDF}.

Regler for dig:
- Beskriv scener enkelt og billedligt — som en godnathistorie
- Still barnet simple valg: "Vil du gå til venstre eller højre?"
- Når barnet skal slå terning: sig "Tag den lyserøde terning og kast den!"
- Brug barnets ponykarakter ved navn hele tiden
- Hold turen kort — max 3-4 sætninger
- Svar KUN som Fortæller, ikke som dig selv

Barnets karakter: Regnbuestjerne — en lyserød pegasus-pony med glitter-mane.
Scenarie: Regnbuestjerne er i Ponyville og hører at kæledyret Lynet er forsvundet.

Start eventyret nu med en kort, begejstret introduktion."""

CHILD_SYSTEM = """Du er et 4-årigt barn der spiller My Little Pony for første gang med din forælder.
Du hedder ikke noget — din pony hedder Regnbuestjerne.

Regler for dig:
- Svar som et begejstret 4-årigt barn ville — kort, direkte, lidt usammenhængende
- Du elsker ponyer og glimmer
- Du stiller af og til spørgsmål der ikke har med spillet at gøre ("Må jeg få juice?")
- Når du slår terning: beskriv det med begejstring ("JEG SLOG 5!!!")
- Du har MEGET kort opmærksomhedsspænd men vender altid tilbage til ponyer
- Max 2-3 sætninger per tur
- Svar på hvad Fortælleren lige sagde"""


def hermes_say(prompt: str, label: str) -> str:
    """Kald hermes oneshot og returner svaret."""
    print(f"\n{'='*60}", flush=True)
    print(f"  {label}", flush=True)
    print(f"{'='*60}", flush=True)

    for attempt in range(3):
        try:
            result = subprocess.run(
                [HERMES, "-z", prompt],
                capture_output=True,
                text=True,
                timeout=300,
                cwd="/home/alex/pony"
            )
            response = result.stdout.strip()
            if response:
                break
            response = result.stderr.strip() or "(ingen respons)"
            break
        except subprocess.TimeoutExpired:
            if attempt < 2:
                print(f"  [Timeout — forsøg {attempt+2}/3...]", flush=True)
            else:
                response = "(svarede ikke inden for tid)"

    # Wrap tekst pænt
    for line in response.split("\n"):
        if line.strip():
            print(textwrap.fill(line, width=70, initial_indent="  ", subsequent_indent="  "))
        else:
            print()
    return response


def main():
    history = []
    turns = 6  # Antal runder

    print("\n🎠  MY LITTLE PONY SIMULATOR  🎠")
    print("Voksen + 4-årigt barn · Tails of Equestria")
    print("=" * 60)

    # Første tur: voksne starter
    adult_prompt = ADULT_SYSTEM
    adult_reply = hermes_say(adult_prompt, "🧑 VOKSEN (Fortæller)")
    history.append(("Fortæller", adult_reply))

    for turn in range(turns):
        # Barn svarer
        child_context = "\n".join(
            f"{role}: {text}" for role, text in history[-3:]
        )
        child_prompt = (
            f"{CHILD_SYSTEM}\n\n"
            f"Det der skete:\n{child_context}\n\n"
            f"Hvad siger/gør du som det 4-årige barn?"
        )
        child_reply = hermes_say(child_prompt, "👧 BARN (4 år)")
        history.append(("Barn", child_reply))

        if turn == turns - 1:
            break

        # Voksen svarer på barnet
        adult_context = "\n".join(
            f"{role}: {text}" for role, text in history[-4:]
        )
        adult_prompt = (
            f"{ADULT_SYSTEM}\n\n"
            f"Samtalen indtil nu:\n{adult_context}\n\n"
            f"Fortsæt eventyret som Fortæller. Svar på barnets reaktion."
        )
        adult_reply = hermes_say(adult_prompt, "🧑 VOKSEN (Fortæller)")
        history.append(("Fortæller", adult_reply))

    print("\n" + "=" * 60)
    print("  SIMULATION FÆRDIG")
    print("=" * 60)


if __name__ == "__main__":
    main()
