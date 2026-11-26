"""Workbench prop for the dockyard: reuse the engine room console art and
build its white interaction glow (a soft halo of the silhouette).

Usage: python3 atlas/tools/make_workbench.py
Writes public/atlas/assets/fx/glow_workbench.png. The prop itself is drawn
from props/engine_room/console.png at 56 x 48 logical (see lib.rs WORKBENCH).
"""
from PIL import Image, ImageFilter

A = "public/atlas/assets/"
W, H, PAD = 56, 48, 14
src = Image.open(A + "props/engine_room/console.png").convert("RGBA").resize((W * 2, H * 2), Image.LANCZOS)
alpha = src.getchannel("A").point(lambda a: 255 if a > 40 else 0)
canvas = Image.new("L", ((W + 2 * PAD) * 2, (H + 2 * PAD) * 2), 0)
canvas.paste(alpha, (PAD * 2, PAD * 2))
halo = canvas.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(7))
halo = halo.point(lambda a: min(255, int(a * 1.4)))
out = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
out.putalpha(halo)
out = out.resize((W + 2 * PAD, H + 2 * PAD), Image.LANCZOS)
out.save(A + "fx/glow_workbench.png")
print(out.size)
