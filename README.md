# TMUA prep

Offline-capable TMUA revision app. Plain HTML, CSS and JavaScript with no build step.
Progress is saved in the browser's localStorage.

## Run

```
python3 -m http.server 8000
```

Then open http://localhost:8000

## What is here

- `index.html`, `css/`, `js/`: the app.
- `js/drills/`: randomised question generators for the Section 1 spec topics.
- `js/logic-bank.js`: hand-written Section 2 (logic and proof) questions.
- `tools/check_drills.mjs`: sanity check for the generators. Run `node tools/check_drills.mjs`.
