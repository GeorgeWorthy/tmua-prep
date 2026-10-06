#!/usr/bin/env python3
"""Download TMUA past papers into papers/ and the spec documents into spec/.

Usage: python3 tools/fetch_papers.py
"""
import os
import re
import urllib.request

PAGE = "https://esat-tmua.ac.uk/tmua-preparation-materials/"
SPEC = [
    "https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2024/05/03165619/TMUA_Content_Specification.pdf",
    "https://uat-wp.s3.eu-west-2.amazonaws.com/wp-content/uploads/2025/06/25160507/Notes_on_Logic_and_Proof_June2025.pdf",
]
YEARS = ["2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "early-specimen"]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=60).read()


def fetch(url, folder):
    path = os.path.join(ROOT, folder, url.rsplit("/", 1)[1])
    if not os.path.exists(path):
        with open(path, "wb") as f:
            f.write(get(url))
    return path


def main():
    os.makedirs(os.path.join(ROOT, "papers"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "spec"), exist_ok=True)
    html = get(PAGE).decode("utf-8", "replace")
    links = sorted(set(re.findall(r'href="([^"]+/TMUA-[^"]+\.pdf)"', html)))
    for url in links:
        fetch(url, "papers")
    for url in SPEC:
        fetch(url, "spec")
    names = {u.rsplit("/", 1)[1]: u for u in links}
    # Record the official URLs so the app can link to worked answers without hosting them.
    with open(os.path.join(ROOT, "papers", "urls.txt"), "w") as f:
        f.writelines(f"{n}\t{u}\n" for n, u in sorted(names.items()))
    missing = []
    for y in YEARS:
        key = "TMUA-early-specimen-paper-answer-keys.pdf" if y == "early-specimen" else f"TMUA-{y}-answer-keys.pdf"
        want = [key] + [f"TMUA-{y}-paper-{p}{s}.pdf" for p in (1, 2) for s in ("", "-worked-answers")]
        missing += [w for w in want if w not in names]
    print(f"{len(links)} paper PDFs, {len(SPEC)} spec PDFs")
    print("MISSING: " + ", ".join(missing) if missing else "All 45 expected files present")


if __name__ == "__main__":
    main()
