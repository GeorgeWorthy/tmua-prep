#!/usr/bin/env python3
"""Crop every past paper question into questions/*.png and write data/questions.json.

Needs poppler (pdftoppm, pdftotext) and Pillow. Run tools/fetch_papers.py first.
Usage: python3 tools/build_questions.py [--no-images]
"""
import glob
import json
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAPERS = os.path.join(ROOT, "papers")
YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, "specimen"]
DPI = 130
S = DPI / 72  # points to pixels
LETTERS = "ABCDEFGH"


def stem(year):
    return "TMUA-early-specimen" if year == "specimen" else f"TMUA-{year}"


def run(*cmd):
    return subprocess.run(cmd, capture_output=True, text=True, check=True).stdout


def decode(tok):
    """Some early papers use fonts with a shifted encoding. Undo it for digits and option letters."""
    out = ""
    for ch in tok:
        cp = ord(ch)
        if 0x372 <= cp <= 0x37B:
            out += chr(cp - 0x342)
        elif cp == 0x2B9:  # U+0374 after normalisation
            out += "2"
        elif cp == 0x37E or ch == ";":
            out += ch
        elif 4 <= cp <= 11:
            out += chr(cp + 0x3D)
        elif cp == 3 or ch.isspace():
            continue
        else:
            out += ch
    return out


def words(pdf):
    """Per page: (width, height, [(x0, y0, x1, y1, text)])."""
    pages = []
    for chunk in run("pdftotext", "-bbox", pdf, "-").split("<page ")[1:]:
        w, h = map(float, re.match(r'width="([\d.]+)" height="([\d.]+)"', chunk).groups())
        ws = [(float(a), float(b), float(c), float(d), decode(t))
              for a, b, c, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', chunk)]
        pages.append((w, h, [x for x in ws if x[4]]))
    return pages


def leftmost(word, ws):
    return not any(abs(o[1] - word[1]) < 4 and o[0] < word[0] - 1 for o in ws)


def find_starts(pages):
    """Question starts as (page index, y): the numbers 1..20 in order in the left margin column."""
    starts, num_x, n = [], None, 1
    for pi, (w, h, ws) in enumerate(pages):
        if pi == 0:
            continue
        for word in sorted(ws, key=lambda x: (x[1], x[0])):
            if n > 20:
                break
            # In the re-encoded papers a two-digit number is split into two adjacent words.
            tok = word[4] + "".join(o[4] for o in ws if abs(o[1] - word[1]) < 3 and 0 < o[0] - word[0] <= 12 and o[4].isdigit())
            if word[4] not in (str(n), f"{n}.") and tok != str(n):
                continue
            if word[0] > 100 or (num_x is not None and abs(word[0] - num_x) > 6) or not leftmost(word, ws):
                continue
            num_x = word[0]
            starts.append((pi, word[1]))
            n += 1
    return starts, num_x


def bottom_limit(page):
    w, h, ws = page
    foot = [x[1] for x in ws if x[1] > h - 75]
    return (min(foot) - 3) if foot else h - 62


def body_words(page):
    w, h, ws = page
    return [x for x in ws if x[1] <= h - 75]


def regions(pages, starts):
    """For each question, a list of (page index, y top, y bottom) segments in points."""
    out = []
    for i, (pi, y) in enumerate(starts):
        nxt = starts[i + 1] if i + 1 < len(starts) else None
        segs = []
        if nxt and nxt[0] == pi:
            segs.append((pi, y - 8, nxt[1] - 8))
        else:
            segs.append((pi, y - 8, bottom_limit(pages[pi])))
            last = nxt[0] if nxt else len(pages)
            for pj in range(pi + 1, last):
                bw = body_words(pages[pj])
                if len(bw) >= 12 and not any("BLANK" in x[4].upper() for x in bw):
                    segs.append((pj, 30, bottom_limit(pages[pj])))
        out.append(segs)
    return out


def count_options(pages, segs, num_x):
    """Number of answer letters: the last run A, B, C... at the start of lines."""
    def run_from_last_a(items):
        letters = [it[0] for it in items]
        if "A" not in letters:
            return 0, None
        i = len(letters) - 1 - letters[::-1].index("A")
        n, last = 0, None
        for it in items[i:]:
            if n < 8 and it[0] == LETTERS[n]:
                n, last = n + 1, it
        return n, last
    col, anyx = [], []
    for pi, y0, y1 in segs:
        ws = [x for x in pages[pi][2] if y0 <= x[1] <= y1]
        for word in sorted(ws, key=lambda x: (round(x[1] / 6), x[0])):
            if len(word[4]) == 1 and word[4] in LETTERS:
                anyx.append((word[4], pi, word))
                if num_x + 10 < word[0] < num_x + 60 and leftmost((word[0], word[1]), [o for o in ws if o[0] > num_x + 10]):
                    col.append((word[4], pi, word))
    n, last = run_from_last_a(col)
    # Options laid out in a grid are not all in the left column, so also count letters anywhere.
    m = run_from_last_a(anyx)[0]
    return (n, last) if n >= m else (m, None)


def extra_letters(png_for, segs, last):
    """The re-encoded papers lose the letters F, G and H in text extraction.
    Count the ink blobs below option E in the option letter column instead."""
    _, pi, word = last
    y1 = next(s[2] for s in segs if s[0] == pi)
    im = Image.open(png_for[pi]).convert("L")
    strip = im.crop((int((word[0] - 1) * S), int(word[1] * S), int((word[2] + 2) * S), int(y1 * S)))
    rows = [min(strip.crop((0, y, strip.width, y + 1)).getdata()) < 140 for y in range(strip.height)]
    # The strip starts at the top of E's text box, so the first blob is E itself.
    return max(0, sum(1 for y in range(len(rows)) if rows[y] and (y == 0 or not rows[y - 1])) - 1)


def crop(png_for, segs, out_path):
    parts = []
    for pi, y0, y1 in segs:
        im = Image.open(png_for[pi]).convert("L")
        part = im.crop((0, max(0, int(y0 * S)), im.width, min(im.height, int(y1 * S))))
        box = ImageChops.invert(part).point(lambda v: 255 if v > 60 else 0).getbbox()
        if box:
            parts.append(part.crop((0, box[1], part.width, box[3])))
    if not parts:
        return False
    sheet = Image.new("L", (parts[0].width, sum(p.height for p in parts) + 14 * (len(parts) - 1)), 255)
    y = 0
    for p in parts:
        sheet.paste(p, (0, y))
        y += p.height + 14
    box = ImageChops.invert(sheet).point(lambda v: 255 if v > 60 else 0).getbbox()
    pad = 14
    sheet = sheet.crop((max(0, box[0] - pad), 0, min(sheet.width, box[2] + pad), sheet.height))
    framed = Image.new("L", (sheet.width, sheet.height + 2 * pad), 255)
    framed.paste(sheet, (0, pad))
    framed.quantize(16).save(out_path, optimize=True)
    return True


def answer_keys(pdf):
    """Return {1: {n: letter}, 2: {n: letter}}. Keys are either side by side or one after the other."""
    keys = {1: {}, 2: {}}
    for line in run("pdftotext", "-layout", pdf, "-").splitlines():
        pairs = re.findall(r"\b(\d{1,2})\s+([A-H])\b", line)
        if len(pairs) == 2:
            for p, (n, l) in zip((1, 2), pairs):
                keys[p][int(n)] = l
        elif len(pairs) == 1:
            n, l = int(pairs[0][0]), pairs[0][1]
            keys[2 if n in keys[1] else 1][n] = l
    return keys


def worked_pages(pdf):
    """Page of each question in the worked answers, from the contents list, checked against the page text."""
    npages = int(re.search(r"Pages:\s+(\d+)", run("pdfinfo", pdf)).group(1))
    text = [run("pdftotext", "-f", str(p), "-l", str(p), "-layout", pdf, "-") for p in range(1, npages + 1)]
    toc = {int(n): int(p) for n, p in re.findall(r"Question\s+(\d+)\s+[. ]{6,}\s*(\d+)", "\n".join(text[:3]))}
    pages = {}
    for n in range(1, 21):
        head = re.compile(rf"^\s*Question\s+{n}\b(?!\s*\.)", re.M)
        p = toc.get(n)
        if p and p <= npages and head.search(text[p - 1][:400]):
            pages[n] = p
            continue
        for q in range(3, npages + 1):  # fall back to searching for the heading
            if head.search(text[q - 1][:400]):
                pages[n] = q
                break
    body = {}
    for n, p in pages.items():
        end = pages.get(n + 1, npages + 1)
        body[n] = "\n".join(text[p - 1:max(p, end - 1)])
    return pages, body


# Keyword rules for topic tags. A question is only tagged when one topic clearly dominates.
RULES = {
    "indices": r"surd|indices|rationalis",
    "quadratics": r"discriminant|complet\w+ the square|quadratic",
    "inequalities": r"inequalit",
    "polynomials": r"factor theorem|remainder theorem|polynomial|cubic",
    "series": r"arithmetic (?:progression|sequence|series)|geometric (?:progression|sequence|series)|common ratio|common difference|sum to infinity",
    "binomial": r"binomial|coefficient of",
    "lines": r"gradient|perpendicular|straight line|midpoint",
    "circles": r"circle|radius",
    "trig": r"\bsin\b|\bcos\b|\btan\b|sin2|cos2",
    "triggraphs": r"\bperiod",
    "logs": r"\blog|logarithm|exponential",
    "differentiation": r"differentiat|derivative|stationary|turning point|maximum point|minimum point",
    "integration": r"integra|trapezium",
    "graphs": r"translation|stretch|reflection|transformation|sketch",
    "number": r"upper bound|lower bound|percentage|per cent",
    "ratioprop": r"\bratio\b|proportional",
    "geometry": r"triangle|\bangle|pythagoras|similar",
    "statistics": r"\bmean\b|median",
    "probability": r"probabilit",
}
LOGIC = {
    "converse": r"converse|contrapositive",
    "necsuff": r"necessary|sufficient",
    "quantifiers": r"there exists|negation|negate|quantifier",
    "proof": r"counterexample|counter-example|contradiction|proof by",
    "errors": r"error|mistake|flaw|incorrect step|line \(?[ivx\d]+\)? ",
    "implication": r"implies|if and only if|\bimplication",
}


def tag(text, paper):
    text = text.lower()
    rules = dict(RULES, **LOGIC) if paper == 2 else RULES
    scores = sorted(((len(re.findall(rx, text)) * (2 if paper == 2 and t in LOGIC else 1), t) for t, rx in rules.items()), reverse=True)
    (top, topic), (second, _) = scores[0], scores[1]
    return topic if top >= 3 and top >= 2 * max(second, 1) else None


def main():
    images = "--no-images" not in sys.argv
    urls = dict(line.rstrip("\n").split("\t") for line in open(os.path.join(PAPERS, "urls.txt")))
    os.makedirs(os.path.join(ROOT, "questions"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    out, problems = [], []
    print(f"{'paper':<16}{'questions':>10}{'answers':>9}{'worked':>8}{'tagged':>8}")
    for year in YEARS:
        key_name = "TMUA-early-specimen-paper-answer-keys.pdf" if year == "specimen" else f"TMUA-{year}-answer-keys.pdf"
        keys = answer_keys(os.path.join(PAPERS, key_name))
        for paper in (1, 2):
            name = f"{stem(year)}-paper-{paper}.pdf"
            pdf = os.path.join(PAPERS, name)
            pages = words(pdf)
            garbled = "\u0373" in run("pdftotext", pdf, "-")
            starts, num_x = find_starts(pages)
            segs = regions(pages, starts)
            wname = f"{stem(year)}-paper-{paper}-worked-answers.pdf"
            wpages, wtext = worked_pages(os.path.join(PAPERS, wname))
            with tempfile.TemporaryDirectory() as tmp:
                png_for = []
                if images:
                    run("pdftoppm", "-r", str(DPI), "-gray", "-png", pdf, os.path.join(tmp, "p"))
                    png_for = sorted(glob.glob(os.path.join(tmp, "p-*.png")))
                tagged = 0
                for i, seg in enumerate(segs):
                    n = i + 1
                    qid = f"{year}-p{paper}-q{n}"
                    image = f"questions/{qid}.png"
                    if images:
                        crop(png_for, seg, os.path.join(ROOT, image))
                    correct = keys[paper].get(n)
                    opts, last = count_options(pages, seg, num_x)
                    if garbled and images and opts == 5 and last:
                        opts += min(3, extra_letters(png_for, seg, last))
                    if correct:
                        opts = max(opts, LETTERS.index(correct) + 1)
                    qtext = " ".join(x[4] for pi, y0, y1 in seg for x in pages[pi][2] if y0 <= x[1] <= y1)
                    topic = tag(wtext.get(n, "") + " " + qtext, paper)
                    tagged += topic is not None
                    out.append({
                        "id": qid, "year": year, "paper": paper, "number": n, "image": image,
                        "correct": correct, "options": opts if opts >= 4 else None, "topic": topic,
                        "worked_answer_pdf": urls.get(wname), "page": wpages.get(n),
                    })
            label = f"{year} paper {paper}"
            print(f"{label:<16}{len(segs):>10}{len(keys[paper]):>9}{len(wpages):>8}{tagged:>8}")
            if len(segs) != 20 or len(keys[paper]) != 20:
                problems.append(f"{label}: {len(segs)} questions, {len(keys[paper])} answers")
            if len(wpages) != 20:
                problems.append(f"{label}: worked answer page found for only {len(wpages)} questions")
    with open(os.path.join(ROOT, "data", "questions.json"), "w") as f:
        json.dump(out, f, indent=0)
    noopt = [q["id"] for q in out if not q["options"]]
    print(f"\n{len(out)} questions written, {sum(1 for q in out if q['topic'])} tagged with a topic")
    if noopt:
        print(f"Option count not detected for {len(noopt)} (the app shows A to H): {', '.join(noopt)}")
    print("\nFLAGGED:\n  " + "\n  ".join(problems) if problems else "Every paper has 20 questions and 20 answers.")


if __name__ == "__main__":
    main()
