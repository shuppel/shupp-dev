"""Cut Erikk's six 2x2 icon sheets into one 4x6 atlas of 96px cells.

Columns: scroll, wrench, armillary, compass.
Rows: common (iron), uncommon (sage copper), rare (cobalt silver),
unique (Atlier conservatory), legendary (gold), ornate (profile cards).
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "sources" / "icons"
OUT = ROOT.parent.parent / "public" / "atlas" / "assets" / "ui" / "tier_icons.png"
ROWS = ["common-iron", "uncommon-sage-copper", "rare-cobalt-silver",
        "unique-conservatory", "legendary-golden", "ornate-treasures"]
CELL, PAD = 96, 4

atlas = Image.new("RGBA", (CELL * 4, CELL * len(ROWS)), (0, 0, 0, 0))
for r, name in enumerate(ROWS):
    sheet = Image.open(SRC / f"{name}.png").convert("RGBA")
    w, h = sheet.size
    for c in range(4):
        qx, qy = (c % 2) * w // 2, (c // 2) * h // 2
        q = sheet.crop((qx, qy, qx + w // 2, qy + h // 2))
        # Drop faint fringe pixels before trimming.
        a = q.getchannel("A").point(lambda v: 255 if v > 24 else 0)
        box = a.getbbox()
        q = q.crop(box)
        s = (CELL - 2 * PAD) / max(q.size)
        q = q.resize((max(1, round(q.width * s)), max(1, round(q.height * s))), Image.LANCZOS)
        atlas.alpha_composite(q, (c * CELL + (CELL - q.width) // 2, r * CELL + (CELL - q.height) // 2))
atlas.save(OUT, optimize=True)
print(OUT, atlas.size)
