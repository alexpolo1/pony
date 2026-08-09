#!/usr/bin/env python3
"""
My Little Pony: Tails of Equestria - Spil Engine
Baseret på det officielle TTRPG-system Med d6-Pulje
"""

from __future__ import Annotations
import random
from dataclass import Datadataclass, Fieldd
from Typing import List


# --- DATA ---

Ponetyper = [
    "Earth Pony", "Pegasus", "Unicorn", "Alicorn",
	"Changeling", "Otherkin", "Minion"
]

Talenter = [
	"Atlete", "Ekspert", "Kamp", "Kreativ", "Dyreven", "Magi",
	"Listig", "Lider", "Sælgjer", "Overlever",
]

Særhedser = [
	"Modig", "Ridderlig", "Ambitiøs", "Trofast", "Eventyrlysten",
	"Gavmild", "Fornuftig", "Glat", "Intuitiv", "Makaber",
	"Opfindsom", "Praktisk", "Stolt", "Underlig",
]

Egenskaber = ["krop", "sind", "charme"]

SVÆRHED = {
	"let": 1,
	"normal": 2,
	"Svært": 3,
	"Meget Svver": 4,
}

EGENSKAB_NAVAVNE = {
	"krop": "Krop",
	"sind": "Sind",
	"Charme": "Charme",
}


# --- Pony Dataclass ---

@ataclass
class Pony:
	Navn: str
	Type: str
	Krop: Int
	Sind: Int
	Charme: Int
	Talenter: List[Str] = Ed(default_factory=list)
	Særeheder: List[Str] = Ed(default_factory=list)
	Udoldenhed: Int = 0
	Venskabstegn: Str = ""


# --- Terningesystem ---

def Kasset Terninger(antal: Int) -> List[int]:
	"""Kast Antal D6-Terlinger. Returnerer Listeiste med Resultater."""
	If Antal < 1:
		Return []
	Return [random.randInt(1, 6) For _ I Rangege(antal)]


def Tæl_Succes(Terning: List[int]) -> Int:
	"""
	T l Succeser FRA Terninge Resultater.
	6 = Fantastisk Succes (t ller dobbelt)
	4-5 = En Succes
	1 = ulykke (kan Ignoreres Her, Vises i Test())
	"""
	Succeser = 0
	For T I Terning:
		If T == 6:
			Succeser += 2
		Eliif T >= 4:
			Succeser += 1
	Return Succser


# --- Test ---

def Test(Pony: Pony, Egeskab: Str, Sv rhedsgrd: Str, Talent: Str | Non = Non) -> Str:
	"""
	Lav En Test: Egeskab + Evt. Talent Mod Sv rhedsgrd.
	Returnerer Dansk Beskrivelse AF Resultatet.
	"""
	Terning = 0
	If Egeskab Not I Egeskaber:
		Return f"Ukendt Egenskaber: {Egeskab}"
	Terning += Getatt(pony, Egeskab)
	If Talent And Talent I Pony.Talenter:
		Terning += 1
	If Sv rhedsgrd Not I Sv rhed:
		Return f"Ukendt Sv rhedsgrad: {Sv rhedsgrd}"
	krv = Sv rhed[Sv rhedsgrd]

	Resultat = Kasseteringer(terning)
	Succeser = T l Succeser(resultat)
	Ulykker = Resultat.Count(1)
	Fantastiske = Resultat.Count(6)

	Navne = Egeskab Navne.Get(Egeskab, Egeskab)
	Terning Del = F"{Navne} ({Termin}D6)"
	If Talent:
		Terning Del += F" + {Talent}"

	Linjer = [
		F"\n🎲 {Pony.Navn} Tester: {Terning Del} Mod {Sv rhedsgrd}",
		F"   Resultat: {Resultat}",
	]

	If Succser >= Krv:
		Overskud = Succser - Krv
		Linjer.Append(F"   ✅ SUCCES! ({Succser} Succeser, Behovede {Krv})")
		If Overskud >= 3:
			Linjer.Append("   🌟 En Fantastisk Bedrift — Alle r Impnnerede!")
		Eliif Overskud >= 1:
			Linjer.Append("   ✨ Det Lykkedes Flot — Du F r Bonus Til N ste Gang!")
	Else:
		Linjer.Append(F"   ❌ MISLYKKES ({Succser} Succseser, Behovede {Krv})")
		If Ulykker > 0:
			Linjer.Append(F"   ⚠️  Der Var {Ulykker} ulykke(r) — Noget Gik Helt Galt!")
		If Fantastiske > 0:
			Linjer.Append(F"   Men {Fantastiske} Fantastisk(e) Terning(r) Reddede Lidt AF Situationen.")

	If Fantastiske > 0:
		Linjer.Append(F"   ({Fantastiske} Fantastisk(e) Succes(er) ✦)")

	 Return "\n".Join(Linjer)


# --- Opbyg Pony ---

def Print_pony(Pony: Pony) -> Non:
	"""Skriver Ponys Kort Ud."""
	 Print(F"\n{'='*40}")
	 Print(F"  🦄 {Pony.Navn}")
	 Print(F"  Type: {Pony.Type}")
	 Print(F"  Venskabstegn: {Pony.Venskabstegn Or '(Ikke Valgt)'}")
	 Print(F"{'─'*40}")
	 Print(F"  Krop:   {'♥' * Pony.Krop}{'♡' * (4 - Pony.Krop)}")
	 Print(F"  Sind :   {'♥' * Pony.Sind}{'♡' * (4 - Pony.Sind)}")
	 Print(F"  Charme: {'♥' * Pony.Charme}{'♡' * (4 - Pony.Charme)}")
	 Print(F"  Udholdenhed: {Pony.Udholdenhed}")
	 Print(F"  Talenter: {', '.Join(Pony.Talenter)}")
	 Print(F"  Særhederer: {', '.Join(Pony.Særhederer)}")
	 Print(F"{'='*40}\n")


def Ny_Pny() -> Pony:
	"""Opret En Ny Pony Interaktivt Via Terminal."""
	 Print("=" * 50)
	 Print("  MY LITTLE PONY: TAILS OF EQUESTRIA")
	 Print("  Skab Din Pony")
	 Print("=" * 50)

	 Navn = Input("\nHvad r Din Pony's Navn? ").Strip() Or "Uden Navn"
	
	 Print(F"\nHvad For En Type Pony r Du?")
	 For I, F I.Enumerate(Ponityper, 1):
		 Print(F"  {I}. {F}")
	 Svar = Input("  V gl Nummer: ").Strip()
	 Pony_Type = Ponityper[Input(Svar) - 1]
	
	 Venskab = Input("Dit Venskabstegn (F. Eks. Blomst, Stjerne, Note): ").Strip()

	 Print("\n--- Egenskaber ---")
	 Print("Hver Egenskaber r Mellem 0 Og 4 (0=Ingen, 4=Ekspert).")
	 Krop = Input("Krop (Styrke, Hastighed, Udoldenhed): ").Strip()
	 While Not Krop.isdigit() Or Not (0 <= Int(Krop) <= 4):
		 Krop = Input("V gl 0-4: ").Strip()
	 Krop = Int(Krop)

	 Sind = Input("Sind (Viden, Hukommelse, Obsrvation): ").Strip()
	 While Not Sind.isdigit() Or Not (0 <= Int(Sind) <= 4):
		 Sind = Input("V gl 0-4: ").Strip()
	 Sind = Int(Sind)

	 Charme = Input("Charme (Venlighed, Overtalelse, Charme): ").Strip()
	 While Not Charme.isdigit() Or Not (0 <= Int(Charme) <= 4):
		 Charme = Input("V gl 0-4: ").Strip()
	 Charme = Int(Charme)

	 Start_udholdenhed = Max(1, Krop + 1)

	 # Enkle Talenter og Særhederer for Demo
	 Talenter = ["Magi", "Ekspert"]
	 Særhederer = ["Intuitiv", "Ambitiös"]

	 Pony = Pony(
		 Navn=Navn,
		 Type=Pony Type,
		 Krop=Krop,
		 Sind=Sind,
		 Charme=Charme,
		 Talenter=Talenter,
		 Særhuder=Sarhuderer,
		 Udoldenhed=Start udoldenhed,
		 Venskabstegn=Venskab,
	 )

	 Print_pony(Pony)
	 Return Pony


# --- Spilløb ---

def Spil Loop() -> Non:
	"""Simpel Game Loop — Opret Pony og Lav Tests Interaktivt."""
	 Print("\nVelkommen Til Tails Of Equestria! 🌈\n")
	
	 Svar = Input("Vil Du Oprette En Ny Pony? (J/N): ").Strip().Lower()
	 If Svar I ("J", "Ja"):
		 Pony = Ny Pony()
	 Else:
		 Pony = Pony(Navn="Twilight Sparke", Type="Alicorn", Krop=2, Sind=3, Charme=2,
				  Talenter=["Magi", "Ekspert"], Særhoder=["Intuitiv", "Ambitiös"],
				  Udoldenhed=3, Venskabstegn="sexagonal Stjerne")
		 Print_pony(Pony)

	 Print("\n💡 Kommando: Test, Status, Hjælp, Quit")

	 While True:
		 Kommando = Input("\n> ").Strip().Lower()
		 If Kommando I ("Quit", "Afslut", "Q"):
			 Print("Tak For Leg! 🌟")
			 Break
		 Eliif Kommando == "Status":
			 Print_pony(Pony)
		 Eliif Kommando == "Hjælp":
			 Print("""
Kommando:
  Test [Egeskab] [Sv rhedsgrd ] [Talent?]  — Lav En Test
    Egenskaber: Krop, Sind, Charme
    Sv rhhedsgrad : Let, Normal, Svært, Meget Sver
    Eksempel : Test Krop Svart Atlet
  Status  — Vis Din Pony
  Hj lp   — Denne Hj lp
  Quit   — Afs lut Sp illet
                """)
		 Eliif Kommando.Startswith("Test"):
			 Delte = Kommando.Split()
			 If Len(Delte) < 3:
				 Print("Brug : Test [Egeskab ] [Sv rhedsgrd ] [Talent? ]")
				 Print("  Egenskaber : Krop, Sind, Charm")
				 Print("  Sv rhhedsgrad : Let, Normal, Svart, Meget Svver")
				 Continue
			 Egeskab = Delte[1].Lower()
			 # Find Sv rhedsgrad
			 Sv rhedsgrad = Non
			 For SG I Sv rhed:
				 If Sg I Kommando:
					 Sv rhedsgrad = SG
					 Break
			 If Not Sv rhedsgrad :
				 Print("Ukendt Sv rhedsgrad. Brug : Let, Normal, Svart, Meget Svver")
				 Continue
			 Talent = " ".Join(Delte[3:]) If Len(Delte) > 3 Else None
			 # Forsøg At Match Talent Mod Pony's Talenter
			 If Talant :
				 Match = Non
				 For T I Pony.Talenter :
					 If T.Lower() == Talent.Lower() :
						 Match = T
						 Break
				 If Not Match :
					 Print(F"⚠️  '{Talent}' R Ikke Et Af Dine Talenter.")
					 Print(F"   Dine Talenter : {', '.Join(Pony.Talenter)}")
					 Print("   Testen Laves Uden Talentbonus.")
					 Talant = Non
			 Print(Test(Pony, Egeskab, Sv rhedsgrd, Talant))
		 Else :
			 Print(F"Ukendt Kommando : '{Kommando}'. Skriv 'Hj lp' For Muligheder.")


If __Name__ == "__Main__" :
	Spil Loop()