"""Shrink the game's PNGs: 256-colour palette (libimagequant, dithered) plus
oxipng. Painted art survives this with no visible change and loads 3-4x
smaller. Soft glows (fx/) are left alone because a palette bands them.

Usage: pip install pyoxipng imagequant
       python3 atlas/tools/optimize_pngs.py [files...]   (default: all assets)
Run it again after adding art. Files that would not shrink are left as is.
"""
import glob
import io
import sys

import imagequant
import oxipng
from PIL import Image

ROOT = "public/atlas/assets/"
SKIP = ("fx/",)
MIN = 20_000

files = sys.argv[1:] or sorted(glob.glob(ROOT + "**/*.png", recursive=True))
before = after = 0
for f in files:
    if any(s in f for s in SKIP):
        continue
    raw = open(f, "rb").read()
    if len(raw) < MIN:
        continue
    im = Image.open(io.BytesIO(raw))
    if im.mode == "P":
        continue  # already done
    q = imagequant.quantize_pil_image(im.convert("RGBA"), dithering_level=1.0, max_colors=256, min_quality=0, max_quality=100)
    buf = io.BytesIO()
    q.save(buf, format="PNG")
    out = oxipng.optimize_from_memory(buf.getvalue(), level=4, strip=oxipng.StripChunks.safe())
    if len(out) < len(raw) * 0.9:
        open(f, "wb").write(out)
        before += len(raw)
        after += len(out)
        print(f"{len(raw):>9} -> {len(out):>8}  {f[len(ROOT):]}")
print(f"total {before} -> {after}")
