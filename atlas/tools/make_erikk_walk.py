"""Erikk's walk cycle from the 6-frame turnaround sheet.

Usage: python3 atlas/tools/make_erikk_walk.py
Reads atlas/tools/sources/erikk-walk-sheet.png (rows: front, back, side facing
right; six frames each). Writes public/atlas/assets/player/erikk_walk.png:
6 x 4 cells of 128 x 128, rows Down/Up/Left/Right, feet at y 124, the same
layout and scale as the idle and run sheets. Left is the side row mirrored.
"""
import numpy as np
from PIL import Image

SRC = "atlas/tools/sources/erikk-walk-sheet.png"
OUT = "public/atlas/assets/player/erikk_walk.png"
ROWS = [(0, 293), (293, 588), (588, 887)]
HEIGHT = 118  # px tall in a 128 cell, matching idle/run

sheet = np.array(Image.open(SRC).convert("RGBA"))
# Drop the faint red fringe the generator left around the figures.
r, g, b, a = (sheet[..., i].astype(int) for i in range(4))
fringe = (a < 230) & (r > g + 60) & (r > b + 60)
sheet[..., 3] = np.where(fringe | (a < 24), 0, sheet[..., 3])
img = Image.fromarray(sheet, "RGBA")


def premul_resize(im, size):
    x = np.array(im, dtype=np.float32) / 255.0
    x[..., :3] *= x[..., 3:4]
    p = np.array(Image.fromarray((x * 255).astype(np.uint8), "RGBA").resize(size, Image.LANCZOS), dtype=np.float32) / 255.0
    al = np.maximum(p[..., 3:4], 1e-3)
    p[..., :3] = np.where(p[..., 3:4] > 1e-3, p[..., :3] / al, 0)
    return Image.fromarray((np.clip(p, 0, 1) * 255).astype(np.uint8), "RGBA")


def figures(y0, y1):
    """Split a row into its six figures by the empty columns between them."""
    band = sheet[y0:y1, :, 3] > 40
    cols = band.sum(0) > 3
    runs, start = [], None
    for x, on in enumerate(list(cols) + [False]):
        if on and start is None:
            start = x
        elif not on and start is not None:
            if x - start > 20:
                runs.append((start, x))
            start = None
    assert len(runs) == 6, (y0, runs)
    out = []
    for x0, x1 in runs:
        ys = np.where(band[:, x0:x1].any(1))[0]
        out.append((x0, y0 + ys.min(), x1, y0 + ys.max() + 1))
    return out


rows = [figures(*r) for r in ROWS]
tallest = max(b[3] - b[1] for row in rows for b in row)
scale = HEIGHT / tallest
out = Image.new("RGBA", (6 * 128, 4 * 128), (0, 0, 0, 0))
for src_row, dst_rows in [(0, [0]), (1, [1]), (2, [3, 2])]:
    for i, (x0, y0, x1, y1) in enumerate(rows[src_row]):
        fig = img.crop((x0, y0, x1, y1))
        w, h = max(1, round(fig.width * scale)), max(1, round(fig.height * scale))
        small = premul_resize(fig, (w, h))
        # Centre on the head and shoulders so the stride doesn't jitter.
        top = np.array(small)[: h * 2 // 5, :, 3] > 60
        xs = np.where(top.any(0))[0]
        cx = (xs.min() + xs.max() + 1) / 2 if len(xs) else w / 2
        for d in dst_rows:
            f = small if d != 2 else small.transpose(Image.FLIP_LEFT_RIGHT)
            fx = cx if d != 2 else w - cx
            out.alpha_composite(f, (i * 128 + round(64 - fx), d * 128 + 124 - h))
out.save(OUT)
print("scale", round(scale, 3))
