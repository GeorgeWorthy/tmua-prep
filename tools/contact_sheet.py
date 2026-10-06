#!/usr/bin/env python3
"""Make contact sheets of cropped questions with their parsed answers, for spot-checking.

Usage: python3 tools/contact_sheet.py [question numbers, default 1 10 20]
Writes papers/contact-*.png (the papers folder is not committed).
"""
import json
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = 520


def main():
    nums = [int(a) for a in sys.argv[1:]] or [1, 10, 20]
    qs = json.load(open(os.path.join(ROOT, "data", "questions.json")))
    papers = sorted({(str(q["year"]), q["paper"]) for q in qs})
    for s in range(0, len(papers), 3):
        cols = []
        for year, paper in papers[s:s + 3]:
            tiles = []
            for q in qs:
                if str(q["year"]) == year and q["paper"] == paper and q["number"] in nums:
                    im = Image.open(os.path.join(ROOT, q["image"])).convert("L")
                    im = im.resize((W, max(1, im.height * W // im.width)))
                    tile = Image.new("L", (W, im.height + 22), 255)
                    tile.paste(im, (0, 22))
                    d = ImageDraw.Draw(tile)
                    d.rectangle((0, 0, W, 20), fill=0)
                    d.text((4, 4), f"{q['id']}  answer {q['correct']}  options {q['options']}  topic {q['topic']}  p{q['page']}", fill=255)
                    tiles.append(tile)
            col = Image.new("L", (W, sum(t.height for t in tiles)), 255)
            y = 0
            for t in tiles:
                col.paste(t, (0, y))
                y += t.height
            cols.append(col)
        sheet = Image.new("L", ((W + 10) * len(cols), max(c.height for c in cols)), 200)
        for i, c in enumerate(cols):
            sheet.paste(c, (i * (W + 10), 0))
        out = os.path.join(ROOT, "papers", f"contact-{s // 3 + 1}.png")
        sheet.save(out)
        print(out, sheet.size)


if __name__ == "__main__":
    main()
