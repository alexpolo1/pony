"""
Catalog of the source pixel-art pack ("Pixel Ponies") this game's pixel
sprites were drawn from. The pack itself lives outside the repo (a /tmp
extraction of a user-supplied zip) and is not committed, so this module is
the durable record of what was in it: every file was actually rendered and
visually inspected (not judged by filename) before being categorized, after
an earlier pass mistakenly treated several eye-icon glyphs as hair styles
because their filenames (dramatic.png, fabulous.png, ...) sounded plausible.

Only a small subset was actually usable and copied into the game at
pony-frontend/public/sprites/pony/ (character parts) and
pony-frontend/public/sprites/scenes/ (scene icons, see SCENE_ICONS below).
Everything else here is a record of what was reviewed and *not* used, and why.
"""

# --- NES Style/ folder: the sheet set the game's pony sprites are drawn from ---
NES_STYLE_ASSETS = [
    {
        "filename": "pony base.png",
        "width": 256, "height": 256,
        "category": "base-body",
        "subject": "Full pony body walk-cycle sheet. Row 0: 8 side-facing standing/walking poses (clear magenta/red body, blue eye). Row 1: front-facing poses. Row 2: rear/back poses. Row 3: sparse (a few side poses only in col 0, 6, 7). Row 4: another front-facing variant set. Row 5: mostly sparse, one front pose in col 0 and col 6. Row 6: fully empty. Row 7: one small pose in col 0.",
        "idle_frame": "row 0, col 0",
        "notes": "Matches game assumption exactly; frame (0,0) is a clean, fully-populated side-facing idle pose. Confirms BASE_SPRITE usage in spriteData.js is correct.",
    },
    {
        "filename": "bookish.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair/mane art: an orange/gold swept-back mane silhouette sitting on top of a pony head, matching the same pose grid as pony base.png (row 0 = 8 side poses, row 1-2 = front/rear variants, row 4 = another pose set).",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) is a clean, non-empty hair silhouette that aligns with the base body's idle frame. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "bubbly.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a curly/poofy orange mane silhouette, same pose-grid layout as pony base.png.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "clean.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a short, neat swept mane silhouette (smaller/tighter than bookish/bubbly), same pose-grid layout.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "dialog.png",
        "width": 40, "height": 24,
        "category": "ui-dialog",
        "subject": "Small UI sheet, NOT a pose grid (too small for 8x8/32px frames). Contains three elements side by side: a rounded-corner purple dialog/text-box panel with a gray beveled border (~24x24px), a white up/down chevron scroll-indicator arrow, and a small gray/white corner or gear-like icon.",
        "idle_frame": None,
        "notes": "Correctly excluded from the pose-grid logic already (not referenced in spriteData.js). Genuinely a UI dialog box asset as its filename suggests.",
    },
    {
        "filename": "dramatic.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Small black-and-white eyebrow/eye glyphs (looks like a raised-eyebrow 'surprised' expression icon), only a few pixels tall, floating in the frame rather than sitting on a head silhouette. Grid is sparsely populated: row 0 has 8 single-eye variants, row 1 has 4 paired-eye variants, row 4 has more expression variants (wink, closed eyes, tongue-out, blush), most other cells empty.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding: this is an eye/expression icon glyph, not hair. Correctly excluded from MANE_STYLES in spriteData.js.",
    },
    {
        "filename": "fabulous.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same style/layout as dramatic.png -- small eye/eyebrow expression glyphs, not a hair silhouette.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "fancy.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a rounded bob-style orange mane silhouette, same pose-grid layout as pony base.png.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "fiesty.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a spiky/wild swept mane silhouette (matches 'fiesty' personality), same pose-grid layout.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "font.png",
        "width": 945, "height": 8,
        "category": "ui-font",
        "subject": "A single-row 8px-tall bitmap font strip: printable ASCII glyphs (! \" # $ % & ' ( ) * + , - . / 0-9 : ; < = > ? @ A-Z [ \\ ] ^ ' a-z { | } ~) followed by a handful of extra pictographic glyphs (looks like a flag/pennant, hand/pointer, lock, a filled square, an X-in-box, and a checkmark).",
        "idle_frame": None,
        "notes": "Not a pose grid; correctly excluded from spriteData.js pony logic. Genuinely a bitmap font, as filename suggests.",
    },
    {
        "filename": "friendly.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png -- small paired-eye and single-eye icons, not a hair silhouette.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "genki.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: an upward-swept, energetic yellow/orange mane silhouette, same pose-grid layout.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "inquisitive.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "intelligent.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "pegasus wing.png",
        "width": 256, "height": 256,
        "category": "other",
        "subject": "NOT usable wing art. Every one of the 8x8 cells contains only a tiny 3-8px reddish dot/blob (an alignment marker), never a wing silhouette. Frame (0,0) bounding box is only 5x4px.",
        "idle_frame": None,
        "notes": "Confirms the note already in spriteData.js: this sheet is just 1-3px alignment markers, not visible wing art. WING_STYLES in spriteData.js are correctly hand-drawn instead of sourced from this file.",
    },
    {
        "filename": "perky.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "ponytail.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a mane with a distinct trailing ponytail shape, same pose-grid layout.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "ponyville.png",
        "width": 256, "height": 256,
        "category": "background-tileset",
        "subject": "A town/environment tileset, not a pony pose sheet: grass, house/roof pieces, windows, doors, water/pond tiles, fences, trees, and paths in the upper ~5 rows; the bottom two rows contain a row of small tan/gold achievement- or stat-style icon badges (apple, horseshoe, hourglass, heart, book, paw, tree, etc.) plus a few flat color swatches in the bottom-right corner.",
        "idle_frame": None,
        "notes": "Happens to be 256x256 (same overall canvas size as the pony sheets) but is unrelated content -- a scene/tileset plus a small icon set, not a walk-cycle. Not referenced in spriteData.js at all; flagging in case it's meant to be used for a town background or achievement icons elsewhere in the game.",
    },
    {
        "filename": "practical.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "reserved.png",
        "width": 256, "height": 256,
        "category": "mane-hair",
        "subject": "Genuine hair art: a modest, close-fitting mane silhouette (fits the 'reserved' personality), same pose-grid layout.",
        "idle_frame": "row 0, col 0",
        "notes": "Frame (0,0) populated and aligned. Confirms current MANE_STYLES inclusion is correct.",
    },
    {
        "filename": "stoic.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png (flat/neutral eye glyph, fitting 'stoic').",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "tough.png",
        "width": 256, "height": 256,
        "category": "eye-expression-icon",
        "subject": "NOT hair. Same eye/expression glyph style as dramatic.png.",
        "idle_frame": "row 0, col 0 (populated, but wrong content type)",
        "notes": "Confirms prior finding. Correctly excluded from MANE_STYLES.",
    },
    {
        "filename": "unicorn horn.png",
        "width": 256, "height": 256,
        "category": "other",
        "subject": "NOT usable horn art. Every cell contains only a tiny 2-4px reddish dot/blob (an alignment marker), never a horn silhouette. Frame (0,0) bounding box is only 3x2px.",
        "idle_frame": None,
        "notes": "Confirms the note already in spriteData.js: this sheet is just 1-3px alignment markers, not visible horn art. HORN_STYLES in spriteData.js are correctly hand-drawn instead of sourced from this file.",
    },
]

# --- Root folder: ~50 individually named files, mixed quality/relevance ---
ROOT_ASSETS = [
    {
        "filename": "16x16 twi walk sprite test.png",
        "width": 512, "height": 64,
        "category": "animation-frames",
        "subject": "8-frame walk-cycle test sheet, two 64x32 rows: top row a dark-haired pony head-and-shoulders portrait bobbing during walk, bottom row a small pink pony full-body walk cycle",
        "usable_for_game": True,
        "notes": "Two visually mismatched rows (dark-haired portrait vs. pink body) stacked in one 'test' file; usable individually but not as a single cohesive character.",
    },
    {
        "filename": "MLG Idle And Walk Forward 3x.png",
        "width": 384, "height": 192,
        "category": "animation-frames",
        "subject": "8-frame idle+walk-forward sheet, 4 rows of different characters: magenta-maned pony in red vest, blue armored/robotic quadruped, gold-maned character, plain orange pony body",
        "usable_for_game": False,
        "notes": "3x-upscaled duplicate of MLG Idle And Walk Forward.png. One row is a robot, not a pony; mixed styles.",
    },
    {
        "filename": "MLG Idle And Walk Forward.png",
        "width": 128, "height": 64,
        "category": "animation-frames",
        "subject": "Native-resolution duplicate of MLG Idle And Walk Forward 3x.png: 8-frame idle/walk cycle, 4 character/color rows including a robot variant",
        "usable_for_game": False,
        "notes": "Same content as the 3x version; only the 16x16-per-frame native resolution differs.",
    },
    {
        "filename": "derpy 3x.png",
        "width": 176, "height": 48,
        "category": "animation-frames",
        "subject": "Derpy Hooves-style walk/idle cycle: blonde-maned gray pony with derp/cross eyes; portrait head-bob row plus full-body walk row and rear-view idle poses",
        "usable_for_game": True,
        "notes": "Filename matches content well. Style is consistent with the existing NES-style character set.",
    },
    {
        "filename": "derpy.png",
        "width": 176, "height": 48,
        "category": "animation-frames",
        "subject": "Same Derpy Hooves walk/idle cycle content as derpy 3x.png (gray pony, blonde mane, derp eyes)",
        "usable_for_game": True,
        "notes": "Appears to be a near-duplicate of derpy 3x.png at the same pixel dimensions.",
    },
    {
        "filename": "doctor.png",
        "width": 288, "height": 24,
        "category": "animation-frames",
        "subject": "Single-row ~12-frame walk cycle of a tan/brown earth pony wearing a blue bowtie (Doctor Whooves style), plus a stationary greeting pose",
        "usable_for_game": True,
        "notes": "Filename matches content; clean, small, consistent style.",
    },
    {
        "filename": "eight way base.png",
        "width": 640, "height": 768,
        "category": "reference-art",
        "subject": "Large multi-directional pony turnaround/template sheet with magenta grid guide-lines baked into the image; rows of gray/white pony poses across many rotation angles, plus rows of hand/paw/fist gesture icons and dust-cloud particles near the bottom, with a large blank white area",
        "usable_for_game": False,
        "notes": "Raw production/WIP sheet, not isolated frames -- magenta cell guides and blank space are part of the pixel data and would need cropping/cleanup before use.",
    },
    {
        "filename": "eightway.png",
        "width": 32, "height": 80,
        "category": "character-sprite",
        "subject": "Two columns of cream/tan pony body-part segments stacked vertically: a rear-body/haunches crop on top, a head-and-shoulders crop with teal eyes below",
        "usable_for_game": False,
        "notes": "Shows partial body segments/pieces, not full pose frames; too fragmentary to use as-is despite the '8-way' filename implying full directional sprites.",
    },
    {
        "filename": "feisty mane.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of isolated blue mane/hairstyle sprites: spiky manes, windswept/flowing manes, and curly cluster manes in several style variants, plus one small red curled shape",
        "usable_for_game": True,
        "notes": "Filename accurate; clean isolated overlay art on transparent background, good hair-accessory candidate.",
    },
    {
        "filename": "feisty tail.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of isolated blue tail sprites, comma/curl-shaped, in multiple style variants (flowing, poofy, small)",
        "usable_for_game": True,
        "notes": "Filename accurate; clean isolated overlay art, matches feisty mane.png in style/color.",
    },
    {
        "filename": "ff1 ponies.png",
        "width": 320, "height": 180,
        "category": "character-sprite",
        "subject": "Busy multi-character sheet in Final Fantasy 1-style overworld/battle scale: a unicorn pony, a red-and-blue armored pony/knight, a small pink dragon-like creature, a blue swimming creature, and several mini battle-portrait rows of colorful ponies (cyan, white, pink, orange, yellow)",
        "usable_for_game": False,
        "notes": "Distinct 8-bit JRPG chibi-battle style differs from the existing NES-style set; disconnected assortment rather than one clean character.",
    },
    {
        "filename": "ff6 Style Twilight.png",
        "width": 546, "height": 748,
        "category": "animation-frames",
        "subject": "Large SNES-JRPG-chibi-style sprite sheet for Twilight Sparkle: many rows of idle/walk/turn frames in multiple directions plus injured/dizzy variant poses, and an inset box with Mane-Six portrait icons (Rainbow Dash, Rarity, Fluttershy, Applejack, another yellow pony, and a cropped purple figure)",
        "usable_for_game": True,
        "notes": "Filename accurate (genuinely Twilight, FF6-esque chibi style). Good quality and clean, but the SNES-JRPG proportions differ somewhat from the existing NES-style pony set and may need reconciliation.",
    },
    {
        "filename": "fly1 behind.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of ~15 grayscale/white outstretched-feather wing shapes shown from behind; monochrome silhouettes, rest of the large canvas is empty",
        "usable_for_game": False,
        "notes": "Colorless (white/gray only) alpha-shape, would need tinting/recoloring; most of the 256x256 canvas is unused.",
    },
    {
        "filename": "fly1 front.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of ~30 grayscale wing/feather and hand-like shapes shown from the front, in 3 dense rows, monochrome",
        "usable_for_game": False,
        "notes": "Contains a hidden, very-low-opacity repeating watermark reading \"PAIN\" tiled along the right edge of the canvas (only visible when contrast is boosted/cropped). Flagging this explicitly since it's an unexplained embedded artifact. Also monochrome, needs recoloring.",
    },
    {
        "filename": "fly2 behind.png",
        "width": 256, "height": 256,
        "category": "misc",
        "subject": "Completely blank/fully transparent image -- zero non-transparent pixels",
        "usable_for_game": False,
        "notes": "Filename implies wing content but the file is empty. Confirmed via alpha-channel pixel count (0 of 65536 opaque).",
    },
    {
        "filename": "fly2 front.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of ~30 grayscale flame/leaf-droplet-shaped glyphs in 3 dense rows, monochrome",
        "usable_for_game": False,
        "notes": "Despite the 'fly' naming (implying wings), these shapes read more like flame or leaf droplets than wings. Monochrome silhouette, not colored art.",
    },
    {
        "filename": "fly3 behind.png",
        "width": 256, "height": 256,
        "category": "misc",
        "subject": "Completely blank/fully transparent image -- zero non-transparent pixels",
        "usable_for_game": False,
        "notes": "Same issue as fly2 behind.png: empty file despite the filename implying wing art.",
    },
    {
        "filename": "fly3 front.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of ~30 grayscale mitten/paw-like wing shapes in 3 dense rows, monochrome",
        "usable_for_game": False,
        "notes": "Monochrome silhouette; would need recoloring. No watermark detected in this one (checked the same corner region as fly1 front.png).",
    },
    {
        "filename": "fly4 behind.png",
        "width": 256, "height": 256,
        "category": "misc",
        "subject": "Completely blank/fully transparent image -- zero non-transparent pixels",
        "usable_for_game": False,
        "notes": "Same issue as fly2 behind.png and fly3 behind.png: empty file. All three '...behind.png' files in this set of four are blank; only fly1 behind.png has content.",
    },
    {
        "filename": "fly4 front.png",
        "width": 256, "height": 256,
        "category": "accessory",
        "subject": "Grid of ~30 grayscale curled tentacle/wing shapes in 3 dense rows, monochrome",
        "usable_for_game": False,
        "notes": "Monochrome silhouette; part of the fly1-4 front/behind wing-shape set, but colorless and would need cleanup/recoloring to use.",
    },
    {
        "filename": "flying_pony_notransparent.png",
        "width": 144, "height": 144,
        "category": "animation-frames",
        "subject": "Sprite sheet for a specific named OC character 'RockWall': a white pegasus-pony walk/idle cycle, a blue armored/robotic quadruped ('RockWall') walk cycle, a row of small sparkle/star particles, and a portrait card with pixel-font text reading \"Her name is RockWall\"",
        "usable_for_game": False,
        "notes": "The 'notransparent' part of the filename is accurate (solid opaque brown background, no real alpha). But 'flying_pony' is misleading -- the dominant content is a ground-based named OC character sheet with baked-in text, not a generic flying pony.",
    },
    {
        "filename": "isometric cloud map.png",
        "width": 1024, "height": 1024,
        "category": "tileset",
        "subject": "Large isometric environment tileset: grass/dirt/stone/water diamond tiles, evergreen trees, pink/magenta castle-wall and roof pieces, cloud/loop-shaped platform outlines, ramps, a large 3-sided cube prop with lake faces, and a handful of tiny pony icon markers scattered among the tiles",
        "usable_for_game": False,
        "notes": "Isometric perspective is incompatible with the flat/side-view pony sprites used elsewhere; this is environment tile art, not character-configurator content.",
    },
    {
        "filename": "isometric earth pony.png",
        "width": 256, "height": 256,
        "category": "character-sprite",
        "subject": "Rows of a small pink pony shown in a semi-isometric 3/4 view across many rotation/walk frames, plus unrelated extra critters: a green frog/blob creature, an orange pony pair icon, and two brown-hooded owl-like characters flanking a small caped wizard figure",
        "usable_for_game": False,
        "notes": "Filename says 'earth pony' but the sheet also contains unrelated owl and wizard sprites mixed in -- not a clean single-subject file.",
    },
    {
        "filename": "jousting pony.png",
        "width": 144, "height": 144,
        "category": "animation-frames",
        "subject": "Near-duplicate of flying_pony_notransparent.png: same white pegasus-pony + blue robotic 'RockWall' walk cycles, sparkle particles, and \"Her name is RockWall\" text card (pixel data differs slightly but composition matches)",
        "usable_for_game": False,
        "notes": "Filename 'jousting pony' does not match the content at all -- no jousting is depicted. This is a re-export/variant of the same RockWall OC sheet as flying_pony_notransparent.png.",
    },
    {
        "filename": "key.png",
        "width": 64, "height": 64,
        "category": "ui-icon",
        "subject": "4x4 grid = 16-frame spin/rotation animation of a single ornate gold key icon",
        "usable_for_game": True,
        "notes": "Filename accurate; clean, small, well-suited for an item-pickup/spin animation.",
    },
    {
        "filename": "manesix 16x16.png",
        "width": 256, "height": 288,
        "category": "animation-frames",
        "subject": "6 rows, one per Mane Six pony (Twilight purple, Pinkie pink, Rainbow Dash cyan, Rarity white, Applejack orange, Fluttershy yellow), each with many walk/idle/sit/fly frames in a consistent 16x16-chibi style; transparent background",
        "usable_for_game": True,
        "notes": "Filename accurate; large, coherent, high-value set covering all six main characters in one consistent style.",
    },
    {
        "filename": "manesix bg.png",
        "width": 256, "height": 288,
        "category": "animation-frames",
        "subject": "Identical layout/content to manesix 16x16.png (all six Mane Six characters, same frame grid) but composited on a solid bright-green chroma-key background instead of alpha transparency",
        "usable_for_game": True,
        "notes": "Duplicate of manesix 16x16.png with a baked-in green screen; would need color-keying (remove green) before direct use -- prefer manesix 16x16.png which already has real alpha.",
    },
    {
        "filename": "meegan walk.png",
        "width": 128, "height": 96,
        "category": "character-sprite",
        "subject": "Multi-directional walk/portrait cycle of a human girl character (blonde ponytail with red bow, orange top, gray overalls, red boots) -- this is the G1 MLP human character 'Megan', not a pony",
        "usable_for_game": False,
        "notes": "Filename is accurate (this is Megan), but it depicts a human, not a pony -- not usable for a pony-only configurator unless the game adds a human companion feature.",
    },
    {
        "filename": "megan riding.png",
        "width": 256, "height": 256,
        "category": "animation-frames",
        "subject": "Megan (human girl) multi-directional walk cycle (7 rows facing different directions), plus small blue and pink pony icons and a frame of Megan riding a blue pony",
        "usable_for_game": False,
        "notes": "Filename accurate; content is a human character (plus a small riding-pony frame), not standalone pony art.",
    },
    {
        "filename": "megan.png",
        "width": 256, "height": 256,
        "category": "animation-frames",
        "subject": "Same Megan (human) multi-directional walk cycle as megan riding.png, plus small blue/pink pony icons and a Megan-riding-pony frame",
        "usable_for_game": False,
        "notes": "Appears to substantially duplicate megan riding.png's content.",
    },
    {
        "filename": "pegasus.png",
        "width": 256, "height": 256,
        "category": "character-sprite",
        "subject": "Grid of a gray-blue quadruped creature with pointed ears and glowing yellow eyes, shown in walk-cycle, head-portrait, and rear-view rows -- no wings are visible in any frame",
        "usable_for_game": False,
        "notes": "Significant filename mismatch flagged explicitly: despite being named 'pegasus', there are no wings anywhere in this sheet. The creature reads as a wolf/hound-like design, matching the creature in pony.png (likely the same base).",
    },
    {
        "filename": "pet test.png",
        "width": 384, "height": 128,
        "category": "character-sprite",
        "subject": "3 near-identical frames of Megan (human girl) posed beside a white/cream armored quadruped companion (matching the 'RockWall'-style robot pony seen in flying_pony_notransparent.png/jousting pony.png)",
        "usable_for_game": False,
        "notes": "Test file combining a human character with a companion creature; not isolated pony art.",
    },
    {
        "filename": "pony template flying 32x32 eight way.png",
        "width": 640, "height": 768,
        "category": "reference-art",
        "subject": "Very large, dense WIP production sheet: a huge grid of white pegasus-pony pose/rotation variants (many cells with magenta guide borders baked in), rows of hand/wing/feather doodle icons, several small colored (blue) mini flying-pony icons and a tiny red flag icon, and a solid dark-purple unfinished block area",
        "usable_for_game": False,
        "notes": "Raw/unfinished production sheet with guide gridlines, inconsistent crop boxes, and blank areas -- needs significant cleanup before use, though it is the richest single pegasus/wing reference sheet in the pack.",
    },
    {
        "filename": "pony.png",
        "width": 192, "height": 192,
        "category": "character-sprite",
        "subject": "Grid of the same gray-blue quadruped creature as pegasus.png (pointed ears, glowing yellow eyes, wolf-like stance) in walk-cycle, portrait, and rear-view rows -- no wings, no cutie mark",
        "usable_for_game": False,
        "notes": "Generic filename, but content matches pegasus.png's creature closely -- likely the same base creature reused. Does not read as a classic MLP pony design (looks more like a wolf/hound).",
    },
    {
        "filename": "rear pony legs.png",
        "width": 256, "height": 256,
        "category": "misc",
        "subject": "Nearly blank image -- only about 220 of 65536 pixels are non-transparent, consisting of scattered small red tick/dash marks with no recognizable leg or pony shape",
        "usable_for_game": False,
        "notes": "Strong filename mismatch: confirmed via pixel/alpha analysis that this file is essentially empty (~0.3% opaque pixels), not usable art despite the descriptive filename.",
    },
    {
        "filename": "roguelike sprite hair.png",
        "width": 212, "height": 86,
        "category": "character-sprite",
        "subject": "Left half: an orange pony with a reddish-brown mane and a gray pony with a teal mane, each in multi-angle rotation/walk cycles (visible hairstyles), plus small owl/griffon head icons. Right half: unrelated roguelike dungeon content -- small creature icons (fox, egg-creature, pig, frog, wolf/dog heads), hooded NPC walk cycles, and pink and green creature walk cycles",
        "usable_for_game": False,
        "notes": "Filename is only partially accurate: only the left portion actually relates to pony 'hair' (visible manes on two ponies); the right half is generic roguelike monster/NPC art with no hair/mane content at all. Flagging as mixed/misleading given the project's history of hair-filename mistakes.",
    },
    {
        "filename": "roguelike sprites six frame.png",
        "width": 288, "height": 288,
        "category": "animation-frames",
        "subject": "6 rows x 6-frame walk cycles: orange pony, purple pony, blue pony, gray pony, a green winged griffon-like creature, and a tan/pink pony, in a consistent chibi style",
        "usable_for_game": True,
        "notes": "Clean, consistent recolor-template quality; good multi-color walk-cycle set (note one row is a griffon, not a pony).",
    },
    {
        "filename": "roguelike sprites three frame.png",
        "width": 64, "height": 304,
        "category": "animation-frames",
        "subject": "Same 6 character/color rows as roguelike sprites six frame.png (orange/purple/blue/gray ponies, green griffon, tan pony) but cropped to a narrower frame subset arranged in a single column",
        "usable_for_game": True,
        "notes": "Companion/subset file of roguelike sprites six frame.png; same style and characters.",
    },
    {
        "filename": "sprite tinkering.png",
        "width": 298, "height": 307,
        "category": "reference-art",
        "subject": "Messy work-in-progress grid of chibi bust portraits with oversized eyes in tan/cream, teal/cyan sparkly (crystal-pony-style), and purple (Twilight-like) color variants; includes unfinished black/empty placeholder cells and a diagonal-cross placeholder box",
        "usable_for_game": False,
        "notes": "Unfinished scratch sheet with inconsistent cropping. Also contains a small red \"cc0\" license watermark text baked into the image (bottom right) -- worth noting since it may indicate licensing intent (public domain) for this particular sheet.",
    },
    {
        "filename": "tileset.png",
        "width": 112, "height": 80,
        "category": "tileset",
        "subject": "Right half is genuine tile/prop art: green/gray/water-blue square tiles, a stone-texture tile, cyan sparkle/star icons, two red flame icons, a lime-green blob, and green grass tufts. Left half duplicates pony content: two columns of purple Twilight-like and blue Rainbow-Dash-like pony rotation/portrait frames",
        "usable_for_game": False,
        "notes": "Mixed-purpose sheet; the tile art itself is usable but is bundled with pony portraits that duplicate content found elsewhere (compare twilight and trixie combat.png, which has nearly identical layout but is not pixel-identical).",
    },
    {
        "filename": "timberwolf.png",
        "width": 48, "height": 32,
        "category": "character-sprite",
        "subject": "Single detailed pose of a dark brown/black wolf-like creature built from wood/metal-scrap-textured chunks with glowing green eyes (Timberwolf-monster style), plus a separate close-up head icon",
        "usable_for_game": False,
        "notes": "Filename is accurate, but this is a monster/enemy design, not a pony or customization accessory -- out of scope for the pony configurator unless the game adds enemy creatures.",
    },
    {
        "filename": "twilight and trixie combat.png",
        "width": 112, "height": 80,
        "category": "tileset",
        "subject": "Near-duplicate of tileset.png: two columns of purple Twilight-like pony rotation frames, two columns of a blue pony with a white/blue-striped mane and cape (Trixie-style) rotation frames, plus the same tile/prop art (colored tiles, stone tile, sparkle stars, two red gem/diamond icons, lime slime blob, grass tufts)",
        "usable_for_game": False,
        "notes": "Filename implies a combat scene, but roughly half the image is generic tileset art (identical in kind to tileset.png) and the rest is pony rotation frames, not any depicted combat action. Likely an edited variant/duplicate of tileset.png (icons differ slightly: gem vs. flame).",
    },
    {
        "filename": "twily.png",
        "width": 128, "height": 32,
        "category": "animation-frames",
        "subject": "Two Twilight Sparkle portrait-head icon variants, a side-view walk cycle, and rear-view walk frames -- consistent purple pony with dark blue/pink-striped mane",
        "usable_for_game": True,
        "notes": "Filename accurate (Twily = Twilight nickname); clean, small, good-quality asset.",
    },
    {
        "filename": "wings.png",
        "width": 256, "height": 256,
        "category": "misc",
        "subject": "Sparse grid of very small (roughly 8-16px) blue glyphs -- rounded pill/blob shapes and tiny comma/lightning-fragment shapes -- arranged in loose rows across an otherwise mostly empty canvas",
        "usable_for_game": False,
        "notes": "Significant filename mismatch: at actual pixel scale these shapes do NOT read as wings -- they look more like small gem/particle or eye-glint glyphs. Flagging explicitly per this project's known issue pattern of small glyphs being misclassified from filename alone. Do not treat as a wing accessory without further confirmation from the source/original artist.",
    },
    {
        "filename": "wip g1 base.png",
        "width": 256, "height": 256,
        "category": "animation-frames",
        "subject": "Rows of a single flat salmon/coral-pink G1-style pony (chunky rounded body, big head) in quadruped walk-cycle, bust-portrait, and rear-view rows; the same frame set appears twice, stacked",
        "usable_for_game": True,
        "notes": "Flat, single-color, unshaded 'base' body with no cutie mark or eye detail -- usable as a starting template for recoloring/detailing, not a finished asset as-is. Filename accurate (WIP G1-style base).",
    },
]

# --- 32x32/ folder: 76 anonymized/hash-named files, scraped fan collection. ---
# Surveyed by category rather than file-by-file (see module docstring) since
# the filenames carry no information. Verdict: different, more detailed art
# style than the game's own sprites (multi-tone shading vs. flat 2-3 tone),
# inconsistent non-transparent backgrounds -- reference material, not usable
# as-is.
GRID_32_SURVEY = {
    "total_files_reviewed": 75,
    "categories": [
        {
            "name": "Fully-assembled character rotation sheets",
            "description": "20-column x 8-row (640x256) sprite sheets showing a complete, already-colored pony (body + mane + tail + face all combined) turning/posing through many angles. Several are immediately recognizable as G4 MLP main-cast or background-pony color palettes (e.g. Pinkie-Pie-pink/magenta, Rainbow-Dash-blue/rainbow, Rarity-white/purple, Twilight-Sparkle-purple/indigo, Applejack-orange/blonde), not generic OCs.",
            "file_count": 20,
            "example_files": ["21 - ewxs8v8.png", "38 - FfQ2UHS.png", "41 - Cn3R2a6.png", "44 - DEZH6Pt.png", "50 - WQWDjEP.png", "58 - VRt3kZh.png", "62 - pkZK9DS.png", "65 - 48yGXDw.png", "67 - PJtEeGd.png"],
            "usable_for_game": False,
            "notes": "Much higher shading/outline detail than the game's current base.png (multi-tone shading, distinct black outlines, eyelash/iris detail) vs. the game's flat 2-3 color chunky look. Backgrounds are inconsistent across files (some flat opaque grey, some white, some true alpha/checker) so none are drop-in ready even ignoring style. Several palettes directly match well-known Hasbro G4 character designs, which is a licensing consideration beyond style-fit if repurposed for a commercial/public product.",
        },
        {
            "name": "Body-only base template sheets (no mane/tail/face)",
            "description": "Same 20x8 rotation-sheet layout but showing only an undyed/single-color pony body silhouette, meant as a recolorable base layer.",
            "file_count": 3,
            "example_files": ["2 - D1HlpcU.png", "16 - YhSMd0R.png", "17 - EJXyNF2.png"],
            "usable_for_game": False,
            "notes": "16 and 17 use magenta (#FF00FF) chroma-key backgrounds, an RPG-Maker convention, not real alpha transparency, so they'd need cleanup before use. Also a much larger/more detailed grid (multi-directional walk cycle + baby/foal variants + separate hoof/paw close-up rows) than what this game needs; the game's own base.png is a much simpler single-palette, mostly-front-facing icon grid.",
        },
        {
            "name": "Isolated mane/tail/hair/limb accessory pieces",
            "description": "Single-color curl, lock, or limb shapes (no body) rotating through the same 20x8 grid, intended to be layered on top of a body-base sheet to build a custom-colored pony (paired with categories above).",
            "file_count": 34,
            "example_files": ["3 - rQncTc6.png", "6 - PioL25O.png", "10 - 1XkVIuX.png", "24 - GNxSeHc.png", "32 - FbaDD39.png", "42 - lUvY4dN.png", "48 - pLN3LDv.png", "60 - SCkkkua.png", "64 - Z8JJCBl.png"],
            "usable_for_game": False,
            "notes": "Same higher-detail art style mismatch as the assembled sheets. Background handling is inconsistent per-file: some already have real alpha transparency (checkerboard visible), others are flattened onto solid grey/white/black fill, one (35 - sSBtUTX.png) onto pure black. Would need per-file background removal/normalization before any reuse.",
        },
        {
            "name": "Sparse micro-icon sheets (eyes / blink accents)",
            "description": "Same 640x256 grid but almost entirely empty — only a tiny 2-4 pixel eye-pair glyph occupies a handful of cells, presumably a blink/eye-color overlay layer meant to composite onto the body sheets.",
            "file_count": 15,
            "example_files": ["5 - sC8KGX1.png", "9 - 1c5mLF6.png", "13 - YJprghA.png", "68 - Luv78cD.png", "70 - K843OZQ.png", "75 - hJI7Z4i.png"],
            "usable_for_game": False,
            "notes": "Low individual value on their own (mostly blank canvas). Three of them (19, 20, 23) are so faint/low-contrast that even a 5x zoom barely shows content — flagged as outliers below since they read as almost-corrupted at a glance.",
        },
        {
            "name": "Detailed multi-angle character portrait/bust sheet",
            "description": "A single 128x128 sheet (56 - bIzN1So.png) showing 4 different characters in hooded cloaks/armor from 4 angles (back, front, close-up face, 3/4 view) at much higher rendering fidelity than anything else in the pack.",
            "file_count": 1,
            "example_files": ["56 - bIzN1So.png"],
            "usable_for_game": False,
            "notes": "Completely different subject matter and art style from the rest of the pack and from the game's ponies — reads like RPG portrait icons (armored/cloaked figures), not simple pastel ponies. Clear outlier, not reusable as-is.",
        },
        {
            "name": "Non-pony asset from an unrelated game",
            "description": "One file (57 - dWV6Uha.png) is a skeleton-creature walk/attack animation sheet with a magenta chroma-key background, matching RPG Maker sprite conventions used for enemy mobs — not pony content at all.",
            "file_count": 1,
            "example_files": ["57 - dWV6Uha.png"],
            "usable_for_game": False,
            "notes": "Confirms this folder is a mixed scrape, not a curated single-source pony pack — this file has nothing to do with My Little Pony.",
        },
        {
            "name": "JPG reference/preview image",
            "description": "\"Comet Tail and Roseluck sample.jpg\" is a single static illustration (192x288, RGB, lavender background) of an assembled character labeled 'Comet Tail', not a tiled sprite sheet.",
            "file_count": 1,
            "example_files": ["Comet Tail and Roseluck sample.jpg"],
            "usable_for_game": False,
            "notes": "Useful only as a human-readable label/preview confirming the source and palette of one of the assembled character sheets (likely 62/63, the blue-maned pony) — not directly usable as a game sprite.",
        },
    ],
    "outliers": [
        {
            "filename": "56 - bIzN1So.png",
            "description": "Detailed hooded/armored character portrait bust sheet, 128x128, wildly different art style and subject from the rest of the pack — clearly sourced from a different project.",
        },
        {
            "filename": "57 - dWV6Uha.png",
            "description": "Skeleton-creature animation sheet with RPG-Maker-style magenta chroma-key background; not a pony asset at all, the most out-of-place file in the folder.",
        },
        {
            "filename": "35 - sSBtUTX.png",
            "description": "Isolated mane/tail accessory sheet rendered on a solid pure-black background, unlike every neighboring file's grey/white/transparent fill — looks like a flattening mistake in the original export.",
        },
        {
            "filename": "19 - Jq2yoLI.png",
            "description": "Eye/blink micro-icon sheet so faint and sparse it is nearly indistinguishable from a blank canvas even at 5x zoom.",
        },
        {
            "filename": "20 - 3cGmaM7.png",
            "description": "Same near-blank issue as 19 - Jq2yoLI.png; only a few faint white specks visible on a transparent checkerboard background.",
        },
        {
            "filename": "23 - 8P0CK6J.png",
            "description": "Another near-blank eye-icon sheet; content is barely visible even zoomed in, borderline unusable.",
        },
        {
            "filename": "Comet Tail and Roseluck sample.jpg",
            "description": "Single reference/preview illustration (not a sprite sheet) — confirms the pack's likely origin as a downloaded MLP fan-art 'pony base' sprite collection rather than the game's own assets.",
        },
        {
            "filename": "1 - 7ACUcQs.gif",
            "description": "GIF file present in the folder but skipped per task instructions (PNG/JPG only); not reviewed.",
        },
    ],
}

# --- Scene icons actually integrated into the game ---
# Cropped from NES Style/ponyville.png's icon-badge strip (a set of 16x16
# achievement-style icons) and copied to
# pony-frontend/public/sprites/scenes/icon-<name>.png. Chosen to visually
# match each adventure's story content -- see themes.py for the stories.
SCENE_ICONS = {
    "regnbues-fødselsdag": "trophy",     # birthday celebration
    "angel-er-løbet-væk": "heart",       # Fluttershy's love for her animal friends
    "æblerne-ruller": "apple",           # Sweet Apple Acres harvest
    "raritys-glimmer-sten": "sparkle",   # the missing gem's glimmer
    "discord-laver-sjov": "potion",      # chaos magic
    "twilights-forsvundne-bog": "book",  # the flying book
    "lunas-forsvundne-stjerner": "sparkle",  # starlight
    "pinkies-ballonkarrusel": "hourglass",   # the cake must land before the party
}

# Icons cropped but not currently mapped to a theme -- free for future use.
UNUSED_SCENE_ICONS = ["horseshoe", "tree"]


def get_scene_icon(theme_id):
    """Return the scene icon name for a theme id, or None if unmapped."""
    return SCENE_ICONS.get(theme_id)


def usable_root_assets():
    """Root-folder assets judged usable for the game (clean, isolated, style-consistent)."""
    return [a for a in ROOT_ASSETS if a["usable_for_game"]]
