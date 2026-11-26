"""Terri the Technician: cut the character sheet into the game's cast files.

Usage: python3 atlas/tools/make_terri.py
Reads atlas/tools/sources/terri-technician-sheet.png (top row: front, back,
left and right turnarounds; bottom row: soft smile, grin, talk, surprised).
Writes public/atlas/assets/cast/technician/:
  npc_hd.png                 4 x (96 x 128) overworld sprite at 2x, Down/Up/Left/Right,
                             drawn smooth at 48 x 64 like Erikk (feet at y 124)
  faces.png                  4 x (256 x 352) dialogue portraits
  calls.png                  4 x (192 x 256) hologram call heads
"""
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

SRC = "atlas/tools/sources/terri-technician-sheet.png"
OUT = "public/atlas/assets/cast/technician/"
sheet = Image.open(SRC).convert("RGBA")
W = sheet.width
BODY_Y = (0, 460)
BUST_Y = (460, sheet.height)


def bbox(im, thresh=40):
    a = np.array(im.getchannel("A")) > thresh
    ys, xs = np.where(a)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def premul_resize(im, size):
    """Resize without dark fringes from transparent pixels."""
    a = np.array(im, dtype=np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    p = Image.fromarray((a * 255).astype(np.uint8), "RGBA").resize(size, Image.LANCZOS)
    b = np.array(p, dtype=np.float32) / 255.0
    m = b[..., 3:4] > 0.001
    b[..., :3] = np.where(m, b[..., :3] / np.maximum(b[..., 3:4], 0.001), 0)
    return Image.fromarray((np.clip(b, 0, 1) * 255).astype(np.uint8), "RGBA")


# --- Overworld sprite -------------------------------------------------------
# The four figures sit in quarters of the top row. Erikk stands ~117 px tall
# in his 2x cells; Terri is a touch shorter.
cells = []
for i in range(4):
    q = sheet.crop((i * W // 4, BODY_Y[0], (i + 1) * W // 4, BODY_Y[1]))
    x0, y0, x1, y1 = bbox(q)
    fig = q.crop((x0, y0, x1, y1))
    h = 112
    w = max(1, round(fig.width * h / fig.height))
    small = premul_resize(fig, (w, h))
    small = ImageEnhance.Contrast(ImageEnhance.Color(small).enhance(1.15)).enhance(1.08)
    cell = Image.new("RGBA", (96, 128), (0, 0, 0, 0))
    cell.alpha_composite(small, ((96 - w) // 2, 124 - h))
    # Thin dark rim so she separates from the floor, like the rest of the cast.
    rim = Image.new("RGBA", cell.size, (24, 14, 22, 0))
    rim.putalpha(cell.getchannel("A").filter(ImageFilter.MaxFilter(3)).point(lambda v: v * 3 // 4))
    rim.alpha_composite(cell)
    cells.append(rim)


def strip(frames):
    out = Image.new("RGBA", (frames[0].width * len(frames), frames[0].height), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        out.alpha_composite(f, (i * f.width, 0))
    return out


strip(cells).save(OUT + "npc_hd.png")

# --- Portraits ----------------------------------------------------------------
# Busts touch each other, so cut around each head and let the shoulders run
# off the cell edges like the other portraits.
busts = []
for i in range(4):
    q = sheet.crop((i * W // 4, BUST_Y[0], (i + 1) * W // 4, BUST_Y[1]))
    head = q.crop((0, 0, q.width, 120))
    hx0, _, hx1, _ = bbox(head)
    cx = i * W // 4 + (hx0 + hx1) // 2
    _, ty, _, _ = bbox(q)
    half = 170
    busts.append(sheet.crop((cx - half, BUST_Y[0] + ty, cx + half, BUST_Y[1])))


def fit(im, cw, ch, pad=2):
    s = (cw - 2 * pad) / im.width
    h = round(im.height * s)
    if h > ch - pad:
        s = (ch - pad) / im.height
        h = ch - pad
    w = round(im.width * s)
    r = premul_resize(im, (w, h))
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    cell.alpha_composite(r, ((cw - w) // 2, ch - h))
    return cell


strip([fit(b, 256, 352) for b in busts]).save(OUT + "faces.png")


def holo(cell):
    a = np.array(cell, dtype=np.float32)
    lum = (0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]) / 255.0
    lum = np.clip(lum * 1.15 + 0.08, 0, 1)
    tint = np.stack([40 + 120 * lum, 90 + 150 * lum, 170 + 85 * lum], -1)
    rgb = 0.75 * tint + 0.25 * a[..., :3]
    rgb[::3] *= 0.82  # scan lines
    alpha = a[..., 3].copy()
    h = alpha.shape[0]
    fade = np.clip((h - np.arange(h)) / 22.0, 0, 1)[:, None]  # soft bottom edge
    alpha *= fade
    out = Image.fromarray(np.dstack([np.clip(rgb, 0, 255), alpha]).astype(np.uint8), "RGBA")
    glow = Image.new("RGBA", out.size, (110, 190, 255, 0))
    glow.putalpha(out.getchannel("A").filter(ImageFilter.GaussianBlur(3)).point(lambda v: v // 2))
    glow.alpha_composite(out)
    return glow


strip([holo(fit(b.crop((0, 0, b.width, round(b.height * 0.82))), 192, 256)) for b in busts]).save(OUT + "calls.png")
print("ok")
