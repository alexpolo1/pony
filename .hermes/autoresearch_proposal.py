#!/usr/bin/env python3
"""
Simple proposal: makes one targeted balance change to themes.py based on trial number.
Cycles through known adjustments that improve balance.
"""
import os
import sys
import re

repo = os.environ.get("AR_REPO_PATH", "/home/alex/pony")
trial = int(os.environ.get("AR_TRIAL", "1"))
themes_path = os.path.join(repo, "web/app/data/themes.py")

with open(themes_path, "r") as f:
    content = f.read()

# Define a set of potential improvements — each trial tries a different one
improvements = [
    # Trial 1: Rainbow Dash scene 4 (krop/normal) -> krop/svaert to add challenge
    ('Rainbow Dash har fødselsdag', 'Gør Pinkies festkanon klar', 'krop', 'normal', 'svaert'),
    # Trial 2: Lunas forsvundne stjerner — make scene 1 harder
    ('Lunas forsvundne stjerner', 'Find Lunas stjerner', 'sind', 'let', 'normal'),
    # Trial 3: Twilights forsvundne bog scene 2 (krop/normal) -> krop/svaert
    ('Twilights forsvundne bog', 'Kom forbi skyen af dansende ord', 'krop', 'normal', 'svaert'),
    # Trial 4: Angel scene 5 (charme/svaert) -> already hard, try body scene 2
    ('Angel er løbet væk', 'Spørg alle ponyer i Ponyville', 'sind', 'normal', 'svaert'),
    # Trial 5: Discord scene 4 (sind/normal) -> svaert
    ('Discord laver sjov', 'Fang Discords sidste kaosgnist', 'sind', 'normal', 'svaert'),
]

idx = (trial - 1) % len(improvements)
tema_title, action, stat, old_diff, new_diff = improvements[idx]

# Find and replace the specific scene
# Match: "aktion": "Gør Pinkies festkanon klar",\n                "stat": "krop", "svaer": "normal",
pattern = re.escape(f'"{action}"') + r',\s*("stat":\s*"' + re.escape(stat) + r'",\s*"svaer":\s*")' + re.escape(old_diff) + r'('
replacement = r'\1' + new_diff + r'\2'

if old_diff != new_diff:
    new_content = re.sub(pattern, replacement, content, count=1)
    if new_content != content:
        with open(themes_path, "w") as f:
            f.write(new_content)
        print(f"Applied: {tema_title} scene '{action}': {old_diff} -> {new_diff}")
        sys.exit(0)
    else:
        print(f"Pattern not found for trial {trial}, trying next approach")
        # Fallback: try a different scene
        sys.exit(1)
else:
    print(f"No change needed for trial {trial}")
    sys.exit(1)