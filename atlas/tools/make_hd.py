"""Normalize the artist's HD character sheets into fixed-grid atlases.

The source sheets are hand-laid (frames are not on an even grid), so each
frame is found by its alpha bounds, scaled to a consistent height, and
placed in a fixed cell with the foot on the pivot row. Cells are 2x the
logical size so the game can draw them smooth at any zoom.

    python3 make_hd.py SRC_DIR OUT_DIR
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])


def runs(mask, min_len=20):
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        if not v and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(mask)))
    return [r for r in out if r[1] - r[0] >= min_len]


def frames(name):
    """Rows of frames, each frame an RGBA crop to its alpha bounds."""
    im = Image.open(SRC / f"{name}.png").convert("RGBA")
    a = np.array(im)
    # Drop the soft matte the generator leaves around figures.
    a[a[:, :, 3] < 48] = 0
    solid = a[:, :, 3] > 0
    rows = []
    for r0, r1 in runs(solid.any(1)):
        row = []
        for c0, c1 in runs(solid[r0:r1].any(0)):
            sub = solid[r0:r1, c0:c1]
            ys, xs = np.nonzero(sub)
            crop = a[r0 + ys.min(): r0 + ys.max() + 1, c0 + xs.min(): c0 + xs.max() + 1]
            row.append(Image.fromarray(crop, "RGBA"))
        rows.append(row)
    return rows


def anchor_x(img):
    """Horizontal anchor: centre of the upper body, which stays steady in a stride."""
    a = np.array(img)[:, :, 3] > 0
    top = a[: max(1, int(a.shape[0] * 0.4))]
    xs = np.nonzero(top)[1]
    return xs.mean() if len(xs) else img.width / 2


def place(img, scale, cell, pivot, mirror=False):
    w, h = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    s = img.resize((w, h), Image.LANCZOS)
    if mirror:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    ax = anchor_x(s)
    out = Image.new("RGBA", cell, (0, 0, 0, 0))
    out.alpha_composite(s, (round(pivot[0] - ax), pivot[1] - h)) if 0 <= pivot[1] - h else out.paste(s, (round(pivot[0] - ax), pivot[1] - h), s)
    return out


def sheet(rows, cell, path):
    cols = max(len(r) for r in rows)
    out = Image.new("RGBA", (cols * cell[0], len(rows) * cell[1]), (0, 0, 0, 0))
    for y, row in enumerate(rows):
        for x, c in enumerate(row):
            out.alpha_composite(c, (x * cell[0], y * cell[1]))
    path.parent.mkdir(parents=True, exist_ok=True)
    out.save(path, optimize=True)
    print(path, out.size)


def median_h(row):
    return float(np.median([f.height for f in row]))


def humanoid(name, out, target, four_rows):
    """Erikk: rows down, up, left, right. Three-row sheets have one side view (facing right)."""
    cell, pivot = (128, 128), (64, 124)
    rows = frames(name)
    s = target / median_h(rows[0])
    if four_rows:
        down, up, left, right = rows[:4]
        res = [[place(f, s, cell, pivot) for f in r] for r in (down, up, left, right)]
    else:
        down, up, side = rows[:3]
        res = [
            [place(f, s, cell, pivot) for f in down],
            [place(f, s, cell, pivot) for f in up],
            [place(f, s, cell, pivot, mirror=True) for f in side],
            [place(f, s, cell, pivot) for f in side],
        ]
    sheet(res, cell, OUT / out)


def dog(name, out, target, directional):
    """Pongo: rows side (facing right), front, back in the source."""
    cell, pivot = (128, 96), (64, 92)
    rows = frames(name)
    s = target / median_h(rows[0])
    if directional:
        side, front, back = rows[:3]
        res = [
            [place(f, s, cell, pivot) for f in front],
            [place(f, s, cell, pivot) for f in back],
            [place(f, s, cell, pivot, mirror=True) for f in side],
            [place(f, s, cell, pivot) for f in side],
        ]
    else:
        res = [[place(f, s, cell, pivot) for f in r] for r in rows]
    sheet(res, cell, OUT / out)


humanoid("armed_idle", "player/erikk_idle.png", 118, True)
humanoid("armed_walk", "player/erikk_walk.png", 118, False)
humanoid("armed_run", "player/erikk_run.png", 116, False)
dog("pongo_walk", "cast/pongo/walk.png", 60, True)
dog("pongo_run", "cast/pongo/run.png", 56, True)
dog("pongo_idle", "cast/pongo/idle.png", 62, False)
