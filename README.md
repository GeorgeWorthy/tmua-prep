# TMUA prep

Offline-capable TMUA revision app. Plain HTML, CSS and JavaScript with no build step.
Progress is saved in the browser's localStorage (use "Export results" on the home screen to back it up).

## Run

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## What it does

- **Spec drills**: randomised short questions for every Section 1 topic and a hand-written bank for Section 2 logic, with per-topic accuracy, average time and a Not started / Shaky / Solid status.
- **Past papers**: all 360 questions from 2016 to 2023 and the specimen papers, browsable by year, paper, topic or status, marked instantly with a link to the official worked answer.
- **Mock mode**: one paper, 20 questions, 75 minutes, flag for review, no feedback until you submit.
- **Wrong answers**: a queue of every question you missed. A question leaves when you get it right.

## Files

- `index.html`, `css/`, `js/`, `sw.js`: the app.
- `questions/`: one cropped image per question. `data/questions.json`: answers, worked answer pages and topic tags.
- `spec/`: the official content specification and Notes on Logic and Proof.
- `tools/`: scripts used to build the data. They are not needed to run the app.

## Rebuilding the past paper data

Needs poppler (`pdftoppm`, `pdftotext`) and Pillow.

```
python3 tools/fetch_papers.py      # downloads the PDFs into papers/ (not committed)
python3 tools/build_questions.py   # crops questions, writes data/questions.json
python3 tools/contact_sheet.py     # writes papers/contact-*.png for spot-checking
node tools/check_drills.mjs        # sanity check for the drill generators
```

## Known limits

- Topic tags on past paper questions are keyword-based and approximate. About 40% are untagged.
- Worked answer links open the official PDFs online, so they need a connection.
- Offline use only works on the deployed site (the service worker is disabled on localhost). Tap "Download for offline use" once while online.
