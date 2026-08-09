#!/usr/bin/env python3
"""
Proposal: makes one targeted balance change to themes.py per trial.
Uses simple string replacement — no regex.
"""
import os
import sys

repo = os.environ.get("AR_REPO_PATH", "/home/alex/pony")
trial = int(os.environ.get("AR_TRIAL", "1"))
themes_path = os.path.join(repo, "web/app/data/themes.py")

with open(themes_path, "r") as f:
    content = f.read()

# Each trial: find an old_string and replace with new_string
# Cycle through improvements based on trial number
improvements = [
    # Trial 1: Rainbow Dash scene 4 — make harder
    (
        '"aktion": "Gør Pinkies festkanon klar",\n                "stat": "krop", "svaer": "normal",',
        '"aktion": "Gør Pinkies festkanon klar",\n                "stat": "krop", "svaer": "svaert",',
    ),
    # Trial 2: Twilight scene 2 — make harder
    (
        '"aktion": "Kom forbi skyen af dansende ord",\n                "stat": "krop", "svaer": "normal",',
        '"aktion": "Kom forbi skyen af dansende ord",\n                "stat": "krop", "svaer": "svaert",',
    ),
    # Trial 3: Discord scene 4 — make harder
    (
        '"aktion": "Fang Discords sidste kaosgnist",\n                "stat": "sind", "svaer": "normal",',
        '"aktion": "Fang Discords sidste kaosgnist",\n                "stat": "sind", "svaer": "svaert",',
    ),
    # Trial 4: Angel scene 2 — make harder
    (
        '"aktion": "Spørg alle ponyer i Ponyville",\n                "stat": "sind", "svaer": "normal",',
        '"aktion": "Spørg alle ponyer i Ponyville",\n                "stat": "sind", "svaer": "svaert",',
    ),
    # Trial 5: Rarity scene 2 — make harder
    (
        '"aktion": "Spørg i Ponyville",\n                "stat": "krop", "svaer": "normal",',
        '"aktion": "Spørg i Ponyville",\n                "stat": "krop", "svaer": "svaert",',
    ),
]

idx = (trial - 1) % len(improvements)
old_s, new_s = improvements[idx]

if old_s in content:
    new_content = content.replace(old_s, new_s, 1)
    with open(themes_path, "w") as f:
        f.write(new_content)
    print(f"Trial {trial}: applied change (old->new)")
    sys.exit(0)
else:
    print(f"Trial {trial}: pattern not found in themes.py, skipping")
    sys.exit(1)