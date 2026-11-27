"""Engine room: Erikk's background with the doorway painted in, plus the
amber glow that pulses over that doorway.

Writes public/atlas/assets/scenes/engine_room.png (1280 x 720) and
public/atlas/assets/fx/glow_engine_door.png (logical px, box + 14 px margin).
Run optimize_pngs.py on the scene afterwards.
"""
from PIL import Image, ImageDraw, ImageFilter

SRC = "atlas/tools/sources/engine-room-door.png"
Image.open(SRC).convert("RGB").resize((1280, 720), Image.LANCZOS).save("public/atlas/assets/scenes/engine_room.png")

# Door frame in logical pixels (matches fx::GLOWS).
BOX = (7, 85, 54, 239)
M = 14
w, h = BOX[2] - BOX[0] + 2 * M, BOX[3] - BOX[1] + 2 * M
S = 4  # draw big, then shrink for a soft edge
glow = Image.new("RGBA", (w * S, h * S), (0, 0, 0, 0))
d = ImageDraw.Draw(glow)
frame = (M * S, M * S, (w - M) * S, (h - M) * S)
d.rounded_rectangle(frame, radius=10 * S, outline=(255, 176, 70, 255), width=4 * S)
halo = glow.filter(ImageFilter.GaussianBlur(6 * S))
inner = Image.new("RGBA", glow.size, (0, 0, 0, 0))
ImageDraw.Draw(inner).rounded_rectangle((frame[0] + 6 * S, frame[1] + 6 * S, frame[2] - 6 * S, frame[3]), radius=8 * S, fill=(255, 190, 90, 70))
inner = inner.filter(ImageFilter.GaussianBlur(4 * S))
out = Image.alpha_composite(halo, halo)
out = Image.alpha_composite(out, inner)
out = Image.alpha_composite(out, glow.filter(ImageFilter.GaussianBlur(1.2 * S)))
out.resize((w, h), Image.LANCZOS).save("public/atlas/assets/fx/glow_engine_door.png", optimize=True)
print(w, h)
