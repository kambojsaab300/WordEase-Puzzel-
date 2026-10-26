"""Draws the JSON from tools/render-map.ts as a PNG.
Usage: python tools/render-map.py <in.json> <out.png>"""
import json
import sys

from PIL import Image, ImageDraw

COLORS = ['#F7C59F', '#B5D99C', '#9AD0EC', '#F4E285', '#E5B3D6', '#C7B8EA', '#A8E0C8']

m = json.load(open(sys.argv[1], encoding='utf8'))
w, h = int(m['width']), int(m['height'])
img = Image.new('RGB', (w, h), '#FFF8EC')
d = ImageDraw.Draw(img)
d.polygon([tuple(p) for p in m['outline']], fill='#7FC3E0', outline='#1B5C86')
for gi, group in enumerate(m['groups']):
    for ring in group:
        if len(ring) > 2:
            d.polygon([tuple(p) for p in ring], fill=COLORS[gi], outline='#FFFFFF')
for pin in m['pins']:
    x, y = pin['at']
    d.ellipse([x - 9, y - 9, x + 9, y + 9], fill='#F2785C', outline='#FFFFFF', width=2)
    d.text((x - 5, y - 6), str(pin['id']), fill='#FFFFFF')
img.save(sys.argv[2])
print('saved', sys.argv[2])
