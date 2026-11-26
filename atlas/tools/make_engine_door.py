"""A bulkhead doorway for the engine room's left side (replaces the ladder):
a copper-framed arch with warm garden light spilling from the stairwell.

Usage: python3 atlas/tools/make_engine_door.py
Writes public/atlas/assets/props/engine_room/doorway.png (2x, 92 x 136).
"""
from PIL import Image, ImageDraw, ImageFilter

W, H = 92, 136
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
# Outer frame: brushed steel-blue bulkhead with a copper trim, rounded top.
d.rounded_rectangle([0, 0, W - 1, H - 1], radius=40, fill=(92, 104, 140, 255))
d.rounded_rectangle([5, 5, W - 6, H - 1], radius=36, fill=(196, 124, 78, 255))
d.rounded_rectangle([10, 10, W - 11, H - 1], radius=32, fill=(70, 80, 112, 255))
# Opening: warm light at the top fading into the stairwell's shadow.
op = Image.new("RGBA", (W - 32, H - 26), (0, 0, 0, 0))
od = ImageDraw.Draw(op)
for y in range(op.height):
    t = y / op.height
    c = (int(255 - 190 * t), int(196 - 150 * t), int(120 - 70 * t), 255)
    od.line([(0, y), (op.width, y)], fill=c)
m = Image.new("L", op.size, 0)
ImageDraw.Draw(m).rounded_rectangle([0, 0, op.width - 1, op.height + 30], radius=26, fill=255)
img.paste(op, (16, 16), m)
# Steps going up into the light.
for i in range(5):
    y = H - 10 - i * 14
    d.line([(18 + i * 2, y), (W - 19 - i * 2, y)], fill=(255, 214, 150, 200), width=2)
# Rivets on the frame.
for x, y in [(7, 50), (7, 80), (7, 110), (W - 8, 50), (W - 8, 80), (W - 8, 110)]:
    d.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(240, 180, 120, 255))
# Two green status lamps like the room's light strips.
for x in (24, W - 25):
    d.rounded_rectangle([x - 6, 4, x + 6, 8], radius=2, fill=(120, 230, 200, 255))
img = img.filter(ImageFilter.SMOOTH)
img.save("public/atlas/assets/props/engine_room/doorway.png")
print(img.size)
