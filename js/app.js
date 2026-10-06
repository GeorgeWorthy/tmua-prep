import { GROUPS, TOPICS, TOPIC, makeQuestion } from './topics.js';
import { state, save, recordDrill, drillStatus } from './store.js';
import { parseAnswer, sameValue, pick } from './util.js';

const app = document.getElementById('app');
const $ = sel => app.querySelector(sel);
const LETTERS = 'ABCDEFGH';
const clock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const secs = ms => (ms / 1000).toFixed(1) + 's';

let session = null, ticker = null;

// ---------- Home ----------

function home() {
  stopTicker(); session = null;
  const p = Object.assign({ topic: 'all', n: 10, perQ: 0 }, state.prefs);
  const rows = g => TOPICS.filter(t => t.group === g).map(t => {
    const s = drillStatus(t.id);
    return `<tr><td><button class="link" data-topic="${t.id}">${t.label}</button></td>
      <td><span class="pill ${s.cls}">${s.status}</span></td>
      <td class="n">${s.n ? Math.round(s.acc * 100) + '%' : ''}</td><td class="n">${s.n ? secs(s.avg) : ''}</td></tr>`;
  }).join('');
  app.innerHTML = `
    <section class="card">
      <h2>Spec drills</h2>
      <label>Topic
        <select id="topic">
          <option value="all">Mixed: all spec</option>
          ${GROUPS.map(g => `<option value="g:${g.id}">Mixed: ${g.label}</option>`).join('')}
          ${GROUPS.map(g => `<optgroup label="${g.label}">${TOPICS.filter(t => t.group === g.id).map(t => `<option value="${t.id}">${t.label}</option>`).join('')}</optgroup>`).join('')}
        </select>
      </label>
      <div class="seg" id="size">${[10, 20, 30].map(n => `<button data-n="${n}" class="${n === p.n ? 'on' : ''}">${n} questions</button>`).join('')}</div>
      <label>Timer
        <select id="timer">
          <option value="0">No limit (time is still recorded)</option>
          ${[30, 45, 60, 90].map(s => `<option value="${s}">${s} seconds per question</option>`).join('')}
        </select>
      </label>
      <button class="primary" id="go" style="width:100%">Start</button>
    </section>
    <section class="card">
      <h2>Progress</h2>
      <p class="muted">Tap a topic to drill it. Solid means at least 80% over 10 or more attempts.</p>
      ${GROUPS.map(g => `<h3>${g.label}</h3><table>${rows(g.id)}</table>`).join('')}
      <p><button id="reset">Reset drill stats</button></p>
    </section>`;
  $('#topic').value = p.topic; if (!$('#topic').value) $('#topic').value = 'all';
  $('#timer').value = String(p.perQ);
  const prefs = () => {
    state.prefs = { topic: $('#topic').value, n: +$('#size .on').dataset.n, perQ: +$('#timer').value };
    save(); return state.prefs;
  };
  $('#size').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    app.querySelectorAll('#size button').forEach(x => x.classList.toggle('on', x === b)); prefs();
  };
  $('#topic').onchange = $('#timer').onchange = prefs;
  $('#go').onclick = () => { const q = prefs(); startDrill(q.topic, q.n, q.perQ); };
  app.querySelectorAll('[data-topic]').forEach(b => b.onclick = () => { const q = prefs(); startDrill(b.dataset.topic, q.n, q.perQ); });
  $('#reset').onclick = () => { if (confirm('Clear all drill stats?')) { state.drill = {}; save(); home(); } };
}

// ---------- Drill ----------

function startDrill(sel, n, perQ) {
  const ids = sel === 'all' ? TOPICS.map(t => t.id) : sel.startsWith('g:') ? TOPICS.filter(t => t.group === sel.slice(2)).map(t => t.id) : [sel];
  session = {
    sel, n, perQ, ids, used: new Set(), i: 0, results: [], started: Date.now(), limit: perQ * n * 1000,
    title: sel === 'all' ? 'Mixed: all spec' : sel.startsWith('g:') ? GROUPS.find(g => g.id === sel.slice(2)).label : TOPIC[sel].label,
  };
  if (location.hash !== '#drill') location.hash = '#drill';
  ticker = setInterval(tick, 250);
  nextQuestion();
}

function stopTicker() { clearInterval(ticker); ticker = null; }

function tick() {
  if (!session) return;
  const elapsed = Date.now() - session.started, el = $('#clock');
  if (session.limit && elapsed >= session.limit) return finish(true);
  if (el) el.textContent = session.limit ? clock(session.limit - elapsed) : clock(elapsed);
}

function nextQuestion() {
  if (session.i >= session.n) return finish(false);
  const q = session.q = makeQuestion(pick(session.ids), session.used);
  session.answered = false; session.qStart = Date.now();
  const input = q.type === 'mc'
    ? `<div class="opts">${q.options.map((o, i) => `<button data-i="${i}"><b>${LETTERS[i]}</b><span>${o}</span></button>`).join('')}</div>`
    : `<form class="typed"><input type="text" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="e.g. 7, -3/4, 2.5"><button class="primary">Check</button></form><div class="muted" id="hint"></div>`;
  app.innerHTML = `
    <div class="bar"><button id="quit">Quit</button><span>${session.i + 1} / ${session.n}</span><span id="clock"></span></div>
    <section class="card">
      <div class="tag">${TOPIC[q.topic].label}</div>
      <div class="prompt">${q.prompt}</div>
      ${input}
      <div id="fb"></div>
    </section>`;
  tick();
  $('#quit').onclick = () => (session.results.length ? finish(false) : goHome());
  if (q.type === 'mc') {
    $('.opts').onclick = e => { const b = e.target.closest('button'); if (b) answer(+b.dataset.i); };
  } else {
    $('#ans').focus();
    $('form').onsubmit = e => {
      e.preventDefault();
      const v = parseAnswer($('#ans').value);
      if (Number.isNaN(v)) { $('#hint').textContent = 'Enter a number or a fraction such as -3/4.'; return; }
      answer(v);
    };
  }
}

function answer(given) {
  if (!session || session.answered) return;
  const q = session.q, ms = Date.now() - session.qStart;
  session.answered = true;
  const ok = q.type === 'mc' ? given === q.answer : sameValue(given, q.value);
  const correct = q.type === 'mc' ? `${LETTERS[q.answer]}: ${q.options[q.answer]}` : q.shown;
  const yours = q.type === 'mc' ? `${LETTERS[given]}: ${q.options[given]}` : $('#ans').value;
  recordDrill(q.topic, ok, ms);
  session.results.push({ q, ok, ms, yours, correct });
  if (q.type === 'mc') {
    app.querySelectorAll('.opts button').forEach((b, i) => {
      b.disabled = true;
      if (i === q.answer) b.classList.add('right'); else if (i === given) b.classList.add('wrong');
    });
  } else {
    $('#ans').disabled = true; $('form button').disabled = true; $('#hint').textContent = '';
  }
  const last = session.i + 1 >= session.n;
  $('#fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}">
    <strong class="${ok ? 'ok' : 'no'}">${ok ? 'Correct' : 'Incorrect'}</strong> <span class="muted">in ${secs(ms)}</span>
    ${ok ? '' : `<p>Answer: <b>${correct}</b></p>`}
    <p>${q.worked}</p>
    <button class="primary" id="next">${last ? 'Finish' : 'Next'}</button></div>`;
  $('#next').onclick = () => { session.i++; nextQuestion(); };
  $('#next').focus();
}

function finish(timeUp) {
  stopTicker();
  const r = session.results, right = r.filter(x => x.ok).length, total = r.reduce((s, x) => s + x.ms, 0), s = session;
  const misses = r.filter(x => !x.ok);
  session = null;
  app.innerHTML = `
    <section class="card">
      <h2>${s.title}</h2>
      ${timeUp ? `<p><strong>Time up.</strong> You answered ${r.length} of ${s.n}.</p>` : ''}
      <div class="score">${right} / ${r.length}</div>
      <p class="muted">${r.length ? `${Math.round(100 * right / r.length)}% correct, ${clock(total)} answering, ${secs(total / r.length)} per question` : 'No questions answered.'}</p>
      <div class="row"><button class="primary" id="again">Same again</button><button id="home">Home</button></div>
    </section>
    ${misses.length ? `<section class="card"><h2>Review your misses</h2>${misses.map(m => `<div class="miss">
      <div class="tag">${TOPIC[m.q.topic].label}, ${secs(m.ms)}</div><div>${m.q.prompt}</div>
      <p class="muted">Your answer: ${m.yours}</p><p>Answer: <b>${m.correct}</b></p><p class="muted">${m.q.worked}</p></div>`).join('')}</section>` : ''}`;
  $('#again').onclick = () => startDrill(s.sel, s.n, s.perQ);
  $('#home').onclick = goHome;
  window.scrollTo(0, 0);
}

// ---------- Routing and keys ----------

function goHome() {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  home();
}

window.addEventListener('hashchange', () => { if (location.hash !== '#drill') home(); });

// Letter or number keys pick a multiple choice option.
document.addEventListener('keydown', e => {
  if (!session || session.answered || session.q.type !== 'mc' || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), i = k >= '1' && k <= '8' ? +k - 1 : 'abcdefgh'.indexOf(k);
  if (i >= 0 && i < session.q.options.length) answer(i);
});

goHome();
