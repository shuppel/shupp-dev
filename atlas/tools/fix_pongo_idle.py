"""Scale Pongo's idle sheet down to match his walk and run sheets.

The art pack drew the idle cells about 1.24x larger than the walk cells, so
Pongo shrank when he started moving. This rescales each 128x96 idle cell
about its foot point (64, 92), keeping the cell grid and the pivot.

Usage: python3 atlas/tools/fix_pongo_idle.py SRC_IDLE.png OUT_IDLE.png [scale]
"""
import sys
from PIL import Image

CW, CH, FX, FY = 128, 96, 64, 92
src, out = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 0.81
im = Image.open(src).convert("RGBA")
res = Image.new("RGBA", im.size, (0, 0, 0, 0))
for r in range(im.height // CH):
    for c in range(im.width // CW):
        cell = im.crop((c * CW, r * CH, c * CW + CW, r * CH + CH))
        s = cell.resize((round(CW * k), round(CH * k)), Image.LANCZOS)
        # Keep the foot point where it was.
        x = c * CW + FX - round(FX * k)
        y = r * CH + FY - round(FY * k)
        res.alpha_composite(s, (x, y))
res.save(out, optimize=True)
