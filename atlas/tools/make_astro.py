"""Astro the Archivist: cut the four-way turnaround into the HD overworld sprite.

Reads atlas/tools/sources/astro-archivist-sheet.png (front, back, left, right).
Writes public/atlas/assets/cast/archivist/npc_hd.png: 4 x (96 x 128) cells,
Down/Up/Left/Right, drawn smooth at 48 x 64 (feet at y 124). Astro is a kid,
so he stands shorter than Terri.
"""
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

SRC = "atlas/tools/sources/astro-archivist-sheet.png"
OUT = "public/atlas/assets/cast/archivist/npc_hd.png"
sheet = Image.open(SRC).convert("RGBA")
W = sheet.width


def bbox(im, thresh=40):
    a = np.array(im.getchannel("A")) > thresh
    ys, xs = np.where(a)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def premul_resize(im, size):
    a = np.array(im, dtype=np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    p = Image.fromarray((a * 255).astype(np.uint8), "RGBA").resize(size, Image.LANCZOS)
    b = np.array(p, dtype=np.float32) / 255.0
    m = b[..., 3:4] > 0.001
    b[..., :3] = np.where(m, b[..., :3] / np.maximum(b[..., 3:4], 0.001), 0)
    return Image.fromarray((np.clip(b, 0, 1) * 255).astype(np.uint8), "RGBA")


# Sheet order is front, back, left-facing, right-facing; the game wants
# Down, Up, Left, Right. The third figure faces left (book on the left).
cells = []
for i in range(4):
    q = sheet.crop((i * W // 4, 0, (i + 1) * W // 4, sheet.height))
    x0, y0, x1, y1 = bbox(q)
    fig = q.crop((x0, y0, x1, y1))
    h = 84
    w = max(1, round(fig.width * h / fig.height))
    small = premul_resize(fig, (w, h))
    small = ImageEnhance.Contrast(ImageEnhance.Color(small).enhance(1.1)).enhance(1.06)
    cell = Image.new("RGBA", (96, 128), (0, 0, 0, 0))
    cell.alpha_composite(small, ((96 - w) // 2, 124 - h))
    rim = Image.new("RGBA", cell.size, (24, 14, 22, 0))
    rim.putalpha(cell.getchannel("A").filter(ImageFilter.MaxFilter(3)).point(lambda v: v * 3 // 4))
    rim.alpha_composite(cell)
    cells.append(rim)

out = Image.new("RGBA", (96 * 4, 128), (0, 0, 0, 0))
for i, c in enumerate(cells):
    out.alpha_composite(c, (i * 96, 0))
out.save(OUT, optimize=True)
print(OUT, out.size)
