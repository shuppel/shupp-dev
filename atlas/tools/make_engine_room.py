"""Slice the engine room art into game files.

The artist's prop sheets are hand-laid with a coloured halo around each
piece. This crops each prop, strips saturated halo pixels near the edge,
builds Dave's 6-frame work loop in 128 x 128 cells (foot at 64, 124) and
scales the backdrop to the 1280 x 720 plate.

    python3 make_engine_room.py SRC OUT

SRC holds sheet9.png (3 x 3 machines), misc.png (hatches, toolbox, crate,
spool, ladder, railing, pipes), dave_work.png and backdrop.png.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)


def clean(im):
    a = np.array(im.convert("RGBA")).astype(int)
    a[a[:, :, 3] < 70] = 0
    solid = Image.fromarray(((a[:, :, 3] > 0) * 255).astype(np.uint8))
    inner = np.array(solid.filter(ImageFilter.MinFilter(13))) > 0
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)
    a[(~inner) & (a[:, :, 3] > 0) & (mx - mn > 90) & (mx > 150)] = 0
    out = Image.fromarray(a.astype(np.uint8), "RGBA")
    alpha = np.array(out)[:, :, 3] > 0
    rows = np.nonzero(alpha.sum(1) > 4)[0]
    cols = np.nonzero(alpha.sum(0) > 4)[0]
    return out.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))


sheet = Image.open(SRC / "sheet9.png")
names = ["reactor_core", "console", "status_board", "flywheel", "piston_bank",
         "coolant_tank", "grow_tube", "gauge_cluster", "warning_lamp"]
for i, n in enumerate(names):
    c = 418
    clean(sheet.crop(((i % 3) * c, (i // 3) * c, (i % 3 + 1) * c, (i // 3 + 1) * c))).save(OUT / f"{n}.png")

misc = Image.open(SRC / "misc.png")
boxes = {
    "hatch_closed": (0, 0, 450, 443), "hatch_open": (450, 0, 880, 443),
    "toolbox": (880, 0, 1350, 443), "crate_small": (1350, 0, 1774, 443),
    "cable_spool": (0, 443, 460, 887), "ladder": (460, 443, 700, 887),
    "railing": (700, 443, 1250, 887), "pipe_run": (1250, 443, 1774, 887),
}
for n, box in boxes.items():
    clean(misc.crop(box)).save(OUT / f"{n}.png")

dave = Image.open(SRC / "dave_work.png")
w = dave.width // 6
frames = [clean(dave.crop((i * w, 0, (i + 1) * w, dave.height))) for i in range(6)]
scale = 118 / max(f.height for f in frames)
work = Image.new("RGBA", (128 * 6, 128))
for i, f in enumerate(frames):
    g = f.resize((round(f.width * scale), round(f.height * scale)), Image.LANCZOS)
    legs = np.array(g)[int(g.height * 0.8):, :, 3] > 0
    ax = np.nonzero(legs)[1].mean()
    work.alpha_composite(g, (i * 128 + round(64 - ax), 124 - g.height))
work.save(OUT / "dave_work.png")

Image.open(SRC / "backdrop.png").convert("RGB").resize((1280, 720), Image.LANCZOS).save(OUT / "plate.png")
