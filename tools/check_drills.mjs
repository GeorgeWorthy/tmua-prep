// Runs every generator many times and checks each question is well formed.
// Usage: node tools/check_drills.mjs
import { TOPICS, makeQuestion } from '../js/topics.js';
import { parseAnswer, sameValue } from '../js/util.js';

const RUNS = 400;
let bad = 0;
const fail = (topic, msg, q) => { bad++; if (bad <= 20) console.log(`FAIL ${topic}: ${msg}\n  ${q && q.prompt}`); };

for (const t of TOPICS) {
  const used = new Set(), kinds = new Set();
  for (let i = 0; i < RUNS; i++) {
    let q;
    try { q = makeQuestion(t.id, used); } catch (e) { fail(t.id, 'threw ' + e.message); continue; }
    kinds.add(q.prompt.replace(/[\d−]+/g, '#').slice(0, 30));
    if (!q.prompt || /undefined|NaN|Infinity/.test(q.prompt + q.worked)) fail(t.id, 'bad text', q);
    if (q.type === 'mc') {
      if (q.options.length < 4) fail(t.id, 'fewer than 4 options', q);
      if (new Set(q.options).size !== q.options.length) fail(t.id, 'duplicate options', q);
      if (q.answer < 0 || q.answer >= q.options.length) fail(t.id, 'answer not among options', q);
    } else {
      if (!Number.isFinite(q.value)) fail(t.id, 'non-finite value', q);
      // The displayed answer must itself be accepted when typed back in.
      if (!sameValue(parseAnswer(q.shown), q.value)) fail(t.id, `shown answer "${q.shown}" does not parse to ${q.value}`, q);
    }
  }
  console.log(`${t.id.padEnd(16)} ${t.bank ? t.bank.length + ' bank questions' : t.gens.length + ' generators'}`);
}
console.log(bad ? `\n${bad} problems` : `\nAll ${TOPICS.length} topics OK (${RUNS} runs each)`);
process.exit(bad ? 1 : 0);
