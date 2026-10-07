// Past paper practice: browse, mock mode and the wrong-answers queue.
import { state, save } from './store.js';
import { TOPICS, TOPIC } from './topics.js';

const app = document.getElementById('app');
const $ = sel => app.querySelector(sel);
const LETTERS = 'ABCDEFGH';
const MOCK_MS = 75 * 60 * 1000;
const clock = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

let QS = null, byId = {}, timer = null, prac = null, lastResult = null;

async function load() {
  if (!QS) {
    QS = await (await fetch('data/questions.json')).json();
    byId = Object.fromEntries(QS.map(q => [q.id, q]));
  }
  return QS;
}
// Saved results: att[id] = {n, c, last, ok}; wrong = queue of ids; mocks = finished mocks; mock = one in progress;
// log = every timed attempt, oldest first: {id, t, ms, ok, ans, src}. ans is null for a blank mock answer.
const P = () => {
  const p = state.papers || (state.papers = { att: {}, wrong: [], mocks: [], mock: null });
  p.log ||= [];
  return p;
};
const yl = y => (y === 'specimen' ? 'Specimen' : y);
const label = q => `${yl(q.year)} Paper ${q.paper} Q${q.number}`;
const letters = q => LETTERS.slice(0, q.options || 8).split('');
const worked = q => (q.worked_answer_pdf ? `<a href="${q.worked_answer_pdf}${q.page ? '#page=' + q.page : ''}" target="_blank" rel="noopener">Worked answer${q.page ? ' (page ' + q.page + ')' : ''}</a>` : '');

const when = t => new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const pill = a => `<span class="pill ${a.ok ? 'solid' : 'bad'}">${a.ok ? 'Right' : a.ans ? 'Wrong' : 'Blank'}</span>`;

// Practice stopwatch. Only counts while the page is visible, so a locked phone does not inflate the time.
let sw = null;
const swStart = () => { sw = { ms: 0, at: document.hidden ? 0 : Date.now() }; };
const swRead = () => sw.ms + (sw.at ? Date.now() - sw.at : 0);
document.addEventListener('visibilitychange', () => {
  if (!sw) return;
  if (document.hidden) { sw.ms = swRead(); sw.at = 0; } else sw.at = Date.now();
});

// Mock per-question time: `shown` is the question on screen, bank() adds the time since it was last counted.
let shown = null;
function bank() {
  const m = P().mock;
  if (!shown || !m) return;
  const now = Date.now();
  (m.times ||= {})[shown.id] = (m.times[shown.id] || 0) + now - shown.at;
  shown.at = now;
}

const logAttempt = (id, ans, ok, ms, src) => P().log.push({ id, t: Date.now(), ms: Math.round(ms), ok, ans, src });

function record(q, letter, ms, src) {
  const p = P(), ok = letter === q.correct, a = p.att[q.id] || (p.att[q.id] = { n: 0, c: 0 });
  a.n++; if (ok) a.c++; a.last = letter; a.ok = ok;
  logAttempt(q.id, letter, ok, ms, src);
  p.wrong = p.wrong.filter(id => id !== q.id);
  if (!ok) p.wrong.push(q.id);
  save();
  return ok;
}

export function leave() {
  clearInterval(timer); timer = null;
  if (shown) { bank(); save(); shown = null; }
}

// ---------- Home card ----------

export function homeCard() {
  const p = P();
  return `<section class="card">
    <h2>Past papers</h2>
    <div class="row">
      <a class="btn primary" href="#papers">Browse questions</a>
      <a class="btn" href="#mock">${p.mock ? 'Resume mock' : 'Mock paper'}</a>
      <a class="btn" href="#wrong">Wrong answers (${p.wrong.length})</a>
      <a class="btn" href="#history">History and timings</a>
    </div>
    <p class="muted">${Object.keys(p.att).length} of 360 questions attempted, ${p.mocks.length} mock${p.mocks.length === 1 ? '' : 's'} completed.</p>
    <div class="row"><button id="export">Export results (JSON)</button><button id="offline">Download for offline use</button></div>
    <p class="muted" id="offmsg"></p>
    <p class="muted">Official documents: <a href="spec/TMUA_Content_Specification.pdf" target="_blank">Content specification</a>,
      <a href="spec/Notes_on_Logic_and_Proof_June2025.pdf" target="_blank">Notes on Logic and Proof</a></p>
  </section>`;
}

export function bindHome() {
  $('#export').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
    a.download = `tmua-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  $('#offline').onclick = async () => {
    const msg = $('#offmsg'), qs = await load();
    if (!('caches' in window)) { msg.textContent = 'Offline storage is not available in this browser.'; return; }
    const cache = await caches.open('tmua-v1');
    let done = 0, failed = 0;
    for (let i = 0; i < qs.length; i += 8) {
      await Promise.all(qs.slice(i, i + 8).map(q => cache.add(q.image).then(() => done++, () => failed++)));
      msg.textContent = `Saved ${done} of ${qs.length} question images...`;
    }
    msg.textContent = failed ? `Saved ${done} images, ${failed} failed. Try again when online.` : `All ${done} question images saved for offline use.`;
  };
}

// ---------- Browse ----------

async function browse() {
  const qs = await load(), p = P();
  const f = Object.assign({ year: '', paper: '', topic: '', status: '' }, state.prefs.browse);
  const years = [...new Set(qs.map(q => String(q.year)))];
  const topics = TOPICS.filter(t => qs.some(q => q.topic === t.id));
  const opt = (v, text, cur) => `<option value="${v}" ${String(cur) === String(v) ? 'selected' : ''}>${text}</option>`;
  const match = q => (!f.year || String(q.year) === f.year) && (!f.paper || String(q.paper) === f.paper)
    && (!f.topic || (f.topic === 'none' ? !q.topic : q.topic === f.topic))
    && (!f.status || (f.status === 'new' ? !p.att[q.id] : f.status === 'wrong' ? p.att[q.id] && !p.att[q.id].ok : p.att[q.id] && p.att[q.id].ok));
  const list = qs.filter(match), groups = {};
  list.forEach(q => (groups[`${yl(q.year)} Paper ${q.paper}`] ||= []).push(q));
  app.innerHTML = `
    <div class="bar"><a class="btn small" href="#">Home</a><span>${list.length} questions</span></div>
    <section class="card">
      <div class="filters">
        <select id="f-year">${opt('', 'All years', f.year)}${years.map(y => opt(y, yl(y), f.year)).join('')}</select>
        <select id="f-paper">${opt('', 'Both papers', f.paper)}${opt(1, 'Paper 1', f.paper)}${opt(2, 'Paper 2', f.paper)}</select>
        <select id="f-topic">${opt('', 'All topics', f.topic)}${topics.map(t => opt(t.id, t.label, f.topic)).join('')}${opt('none', 'Untagged', f.topic)}</select>
        <select id="f-status">${opt('', 'Any status', f.status)}${opt('new', 'Not attempted', f.status)}${opt('wrong', 'Last answer wrong', f.status)}${opt('right', 'Last answer right', f.status)}</select>
      </div>
      <p class="muted">Topic tags are automatic and approximate; about 40% of questions are untagged.</p>
      ${list.length ? `<button class="primary" id="startall" style="width:100%">Practise these ${list.length} in order</button>` : '<p>No questions match.</p>'}
    </section>
    <section class="card">${Object.entries(groups).map(([g, items]) => `<h3>${g}</h3><div class="chips">${items.map(q => {
      const a = p.att[q.id];
      return `<button data-id="${q.id}" class="${a ? (a.ok ? 'right' : 'wrong') : ''}">${q.number}</button>`;
    }).join('')}</div>`).join('')}</section>`;
  ['year', 'paper', 'topic', 'status'].forEach(k => $('#f-' + k).onchange = e => {
    state.prefs.browse = Object.assign(f, { [k]: e.target.value }); save(); browse();
  });
  const ids = list.map(q => q.id);
  if (list.length) $('#startall').onclick = () => startPractice(ids, 0, 'Practice', '#papers');
  app.querySelectorAll('.chips button').forEach(b => b.onclick = () => startPractice(ids, ids.indexOf(b.dataset.id), 'Practice', '#papers'));
}

// ---------- Practice (instant feedback) ----------

function startPractice(ids, i, title, back) {
  prac = { ids, i, title, back };
  if (location.hash === '#practice') practice(); else location.hash = '#practice';
}

function practice() {
  const q = byId[prac.ids[prac.i]], n = prac.ids.length;
  prac.done = false;
  leave();
  app.innerHTML = `
    <div class="bar"><a class="btn small" href="${prac.back}">Back</a><span>${prac.title} ${prac.i + 1} / ${n}</span><span id="clock">0:00</span></div>
    <section class="card">
      <div class="tag">${label(q)}${q.topic ? ', ' + TOPIC[q.topic].label : ''}</div>
      <img class="q" src="${q.image}" alt="${label(q)}">
      <div class="letters">${letters(q).map(l => `<button data-l="${l}">${l}</button>`).join('')}</div>
      <div id="fb"></div>
      <div class="row nav"><button id="prev" ${prac.i ? '' : 'disabled'}>Previous</button><button id="skip">${prac.i + 1 < n ? 'Skip' : 'Finish'}</button></div>
    </section>
    <div id="past">${attempts(q.id)}</div>`;
  swStart();
  // Restart once the image has arrived so a slow download is not counted.
  $('img.q').onload = () => { if (!prac.done) swStart(); };
  timer = setInterval(() => { const el = $('#clock'); if (el) el.textContent = clock(swRead()); }, 500);
  const go = d => { prac.i += d; if (prac.i >= n) location.hash = prac.back; else practice(); };
  $('#prev').onclick = () => go(-1);
  $('#skip').onclick = () => go(1);
  $('.letters').onclick = e => { const b = e.target.closest('button'); if (b) pick(b.dataset.l); };
  window.scrollTo(0, 0);
  function pick(l) {
    if (prac.done) return;
    prac.done = true;
    const ms = swRead();
    leave();
    const ok = record(q, l, ms, prac.title);
    $('#clock').textContent = clock(ms);
    $('#past').innerHTML = attempts(q.id);
    app.querySelectorAll('.letters button').forEach(b => {
      b.disabled = true;
      if (b.dataset.l === q.correct) b.classList.add('right'); else if (b.dataset.l === l) b.classList.add('wrong');
    });
    $('#fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><strong class="${ok ? 'ok' : 'no'}">${ok ? 'Correct' : 'Incorrect'}</strong> <span class="muted">in ${clock(ms)}</span>
      <p>Answer: <b>${q.correct}</b>. ${worked(q)}</p>
      <button class="primary" id="next">${prac.i + 1 < n ? 'Next' : 'Finish'}</button></div>`;
    $('#next').onclick = () => go(1);
    $('#skip').style.display = 'none';
  }
  prac.pick = pick; prac.letters = letters(q);
}

// Every logged attempt at one question, newest first.
function attempts(id) {
  const rows = P().log.filter(a => a.id === id).reverse();
  return rows.length ? `<section class="card"><h2>Your attempts at this question</h2><table>${rows.map(a =>
    `<tr><td>${when(a.t)}</td><td class="muted">${a.src}</td><td>${pill(a)}</td><td class="n">${clock(a.ms)}</td></tr>`).join('')}</table></section>` : '';
}

async function wrongQueue() {
  await load();
  const ids = P().wrong.filter(id => byId[id]);
  if (!ids.length) {
    app.innerHTML = `<div class="bar"><a class="btn small" href="#">Home</a></div><section class="card"><h2>Wrong answers</h2><p>Nothing in the queue. Questions you get wrong in practice or in a mock appear here, and leave when you answer them correctly.</p></section>`;
    return;
  }
  startPractice(ids, 0, 'Wrong answers', '#');
}

// ---------- Mock ----------

async function mock() {
  const qs = await load(), p = P();
  if (p.mock) return runMock();
  if (lastResult) return showResult(lastResult);
  const years = [...new Set(qs.map(q => String(q.year)))];
  app.innerHTML = `
    <div class="bar"><a class="btn small" href="#">Home</a></div>
    <section class="card">
      <h2>Mock paper</h2>
      <p class="muted">20 questions, 75 minutes, no feedback until you submit.</p>
      <div class="filters">
        <select id="m-year">${years.map(y => `<option value="${y}">${yl(y)}</option>`).join('')}</select>
        <select id="m-paper"><option value="1">Paper 1</option><option value="2">Paper 2</option></select>
      </div>
      <button class="primary" id="m-go" style="width:100%">Start mock</button>
    </section>
    ${p.mocks.length ? `<section class="card"><h2>Completed mocks</h2><table>${p.mocks.map((m, i) =>
      `<tr><td><button class="link" data-m="${i}">${yl(m.year)} Paper ${m.paper}</button></td><td class="n">${m.score} / 20</td><td class="n">${clock(m.ms)}</td><td class="n">${m.date.slice(0, 10)}</td></tr>`).reverse().join('')}</table></section>` : ''}`;
  app.querySelectorAll('[data-m]').forEach(b => b.onclick = () => showResult(lastResult = p.mocks[+b.dataset.m]));
  $('#m-go').onclick = () => {
    const year = $('#m-year').value, paper = +$('#m-paper').value;
    const ids = qs.filter(q => String(q.year) === year && q.paper === paper).sort((a, b) => a.number - b.number).map(q => q.id);
    p.mock = { year, paper, ids, answers: {}, flags: {}, times: {}, i: 0, view: 'q', started: Date.now(), endsAt: Date.now() + MOCK_MS };
    save(); runMock();
  };
}

function runMock() {
  const m = P().mock;
  leave();
  let ticks = 0;
  timer = setInterval(() => {
    const left = m.endsAt - Date.now(), el = $('#clock');
    if (left <= 0) return submitMock();
    // Keep the per-question time saved in case the app is closed mid-question.
    if (++ticks % 20 === 0) { bank(); save(); }
    if (el) { el.textContent = clock(left); el.classList.toggle('low', left < 5 * 60 * 1000); }
  }, 500);
  if (m.endsAt <= Date.now()) return submitMock();
  const head = `<div class="bar"><span>${yl(m.year)} Paper ${m.paper}</span><span id="clock">${clock(m.endsAt - Date.now())}</span></div>`;
  if (m.view === 'review') {
    const blank = m.ids.filter(id => !m.answers[id]).length, flagged = m.ids.filter(id => m.flags[id]).length;
    app.innerHTML = `${head}<section class="card">
      <h2>Review</h2>
      <p class="muted">${blank} unanswered, ${flagged} flagged. Tap a question to go back to it.</p>
      <div class="chips big">${m.ids.map((id, i) => `<button data-i="${i}" class="${m.answers[id] ? 'done' : ''} ${m.flags[id] ? 'flag' : ''}">${i + 1}<small>${m.answers[id] || '–'}</small></button>`).join('')}</div>
      <button class="primary" id="submit" style="width:100%;margin-top:14px">Submit and mark</button>
    </section>`;
    app.querySelectorAll('.chips button').forEach(b => b.onclick = () => { m.i = +b.dataset.i; m.view = 'q'; save(); runMock(); });
    $('#submit').onclick = submitMock;
    return;
  }
  const q = byId[m.ids[m.i]];
  app.innerHTML = `${head}<section class="card">
    <div class="tag">Question ${m.i + 1} of 20${m.flags[q.id] ? ' (flagged)' : ''}</div>
    <img class="q" src="${q.image}" alt="Question ${m.i + 1}">
    <div class="letters">${letters(q).map(l => `<button data-l="${l}" class="${m.answers[q.id] === l ? 'on' : ''}">${l}</button>`).join('')}</div>
    <div class="row nav">
      <button id="prev" ${m.i ? '' : 'disabled'}>Previous</button>
      <button id="flag" class="${m.flags[q.id] ? 'flagged' : ''}">${m.flags[q.id] ? 'Unflag' : 'Flag'}</button>
      <button id="next">${m.i < 19 ? 'Next' : 'Review'}</button>
    </div>
    <button id="review" style="width:100%;margin-top:8px">Review and submit</button>
  </section>`;
  shown = { id: q.id, at: Date.now() };
  const set = fn => { fn(); save(); runMock(); };
  $('.letters').onclick = e => { const b = e.target.closest('button'); if (b) set(() => { if (m.answers[q.id] === b.dataset.l) delete m.answers[q.id]; else m.answers[q.id] = b.dataset.l; }); };
  $('#prev').onclick = () => { set(() => m.i--); window.scrollTo(0, 0); };
  $('#next').onclick = () => { set(() => { if (m.i < 19) m.i++; else m.view = 'review'; }); window.scrollTo(0, 0); };
  $('#flag').onclick = () => set(() => { if (m.flags[q.id]) delete m.flags[q.id]; else m.flags[q.id] = true; });
  $('#review').onclick = () => { set(() => m.view = 'review'); window.scrollTo(0, 0); };
}

function submitMock() {
  leave();
  const p = P(), m = p.mock;
  if (!m) return;
  let score = 0;
  const times = m.times || {};
  m.ids.forEach(id => {
    const q = byId[id], l = m.answers[id];
    if (l) { if (record(q, l, times[id] || 0, 'Mock')) score++; }
    else { logAttempt(id, null, false, times[id] || 0, 'Mock'); if (!p.wrong.includes(id)) p.wrong.push(id); }
  });
  lastResult = { year: m.year, paper: m.paper, score, times, ms: Math.min(Date.now(), m.endsAt) - m.started, date: new Date().toISOString(), answers: m.answers };
  p.mocks.push(lastResult); p.mock = null; save();
  showResult(lastResult, m.ids);
}

function showResult(r, ids) {
  ids = ids || QS.filter(q => String(q.year) === String(r.year) && q.paper === r.paper).sort((a, b) => a.number - b.number).map(q => q.id);
  const misses = ids.filter(id => r.answers[id] !== byId[id].correct);
  app.innerHTML = `
    <div class="bar"><a class="btn small" href="#">Home</a><span>${yl(r.year)} Paper ${r.paper}</span></div>
    <section class="card">
      <div class="score">${r.score} / 20</div>
      <p class="muted">Time used ${clock(r.ms)}.</p>
      <div class="row">${misses.length ? '<button class="primary" id="redo">Redo the misses now</button>' : ''}<button id="another">Another mock</button></div>
    </section>
    <section class="card"><h2>${misses.length ? 'Question by question' : 'All correct'}</h2><table>${ids.map(id => {
      const q = byId[id], l = r.answers[id], ok = l === q.correct;
      return `<tr><td>Q${q.number}</td><td>${pill({ ok, ans: l })}</td><td>${ok ? `<b>${l}</b>` : `You: <b>${l || 'blank'}</b>, answer: <b>${q.correct}</b>`}</td>
        <td class="n">${r.times ? clock(r.times[id] || 0) : ''}</td><td>${worked(q)}</td></tr>`;
    }).join('')}</table></section>`;
  if (misses.length) $('#redo').onclick = () => { lastResult = null; startPractice(misses, 0, 'Mock misses', '#'); };
  $('#another').onclick = () => { lastResult = null; mock(); };
  window.scrollTo(0, 0);
}

// ---------- History ----------

async function history() {
  await load();
  const log = P().log.filter(a => byId[a.id]), f = state.prefs.hist || 'all';
  const list = log.filter(a => f === 'all' || (f === 'right') === a.ok).reverse();
  const ids = [...new Set(list.map(a => a.id))], right = log.filter(a => a.ok).length;
  const avg = a => (a.length ? clock(a.reduce((s, x) => s + x.ms, 0) / a.length) : '–');
  app.innerHTML = `
    <div class="bar"><a class="btn small" href="#">Home</a><span>${list.length} attempt${list.length === 1 ? '' : 's'}</span></div>
    <section class="card">
      <h2>History and timings</h2>
      <div class="seg" id="hf">${[['all', 'All'], ['wrong', 'Wrong'], ['right', 'Right']].map(([v, t]) => `<button data-f="${v}" class="${v === f ? 'on' : ''}">${t}</button>`).join('')}</div>
      ${log.length ? `<p class="muted">${log.length} timed attempts, ${Math.round(100 * right / log.length)}% right.
        Average ${avg(log.filter(a => a.ok))} when right, ${avg(log.filter(a => !a.ok && a.ans))} when wrong.</p>`
    : '<p class="muted">No timed attempts yet. Every past paper question you answer from now on is listed here with its time and result.</p>'}
      ${ids.length ? `<button class="primary" id="redo" style="width:100%">Practise these ${ids.length} question${ids.length === 1 ? '' : 's'}</button>` : ''}
    </section>
    ${list.length ? `<section class="card"><table>${list.slice(0, 300).map(a => `<tr>
      <td><button class="link" data-id="${a.id}">${label(byId[a.id])}</button><div class="muted">${when(a.t)}, ${a.src}</div></td>
      <td>${pill(a)}${a.ans ? ` <span class="muted">${a.ans}</span>` : ''}</td><td class="n">${clock(a.ms)}</td></tr>`).join('')}</table>
      ${list.length > 300 ? '<p class="muted">Showing the latest 300. Export results from the home screen for the full log.</p>' : ''}</section>` : ''}`;
  $('#hf').onclick = e => { const b = e.target.closest('button'); if (b) { state.prefs.hist = b.dataset.f; save(); history(); } };
  if (ids.length) $('#redo').onclick = () => startPractice(ids, 0, 'Review', '#history');
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => startPractice([b.dataset.id], 0, 'Review', '#history'));
}

// ---------- Routing and keys ----------

// Returns true if the hash belongs to this module.
export function route(hash) {
  leave();
  if (hash !== '#mock') lastResult = null;
  if (hash === '#papers') browse();
  else if (hash === '#wrong') wrongQueue();
  else if (hash === '#mock') mock();
  else if (hash === '#history') history();
  else if (hash === '#practice') { if (prac && QS) practice(); else location.replace('#papers'); }
  else return false;
  return true;
}

document.addEventListener('keydown', e => {
  if (location.hash !== '#practice' || !prac || prac.done || e.ctrlKey || e.metaKey || e.altKey) return;
  const l = e.key.toUpperCase();
  if (l.length === 1 && prac.letters.includes(l)) prac.pick(l);
});
