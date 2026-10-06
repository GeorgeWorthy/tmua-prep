// Topic registry for the TMUA spec. Topic ids are also used to tag past paper questions.
import * as A from './drills/alevel.js';
import * as G from './drills/gcse.js';
import { BANK } from './logic-bank.js';
import { pick, shuffle } from './util.js';

export const GROUPS = [
  { id: 'p1', label: 'Section 1, Part 1: AS pure' },
  { id: 'gcse', label: 'Section 1, Part 2: GCSE' },
  { id: 'logic', label: 'Section 2: Logic and proof' },
];

const t = (id, label, group, gens) => ({ id, label, group, gens });
const l = (id, label) => ({ id, label, group: 'logic', bank: BANK[id] });

export const TOPICS = [
  t('indices', 'Indices and surds', 'p1', A.indices),
  t('quadratics', 'Quadratics and discriminant', 'p1', A.quadratics),
  t('inequalities', 'Inequalities', 'p1', A.inequalities),
  t('polynomials', 'Polynomials, factor and remainder theorem', 'p1', A.polynomials),
  t('series', 'Arithmetic and geometric series', 'p1', A.series),
  t('binomial', 'Binomial expansion', 'p1', A.binomial),
  t('lines', 'Straight lines', 'p1', A.lines),
  t('circles', 'Circles', 'p1', A.circles),
  t('trig', 'Trig identities and exact values', 'p1', A.trig),
  t('triggraphs', 'Trig graphs', 'p1', A.triggraphs),
  t('logs', 'Exponentials and logs', 'p1', A.logs),
  t('differentiation', 'Differentiation', 'p1', A.differentiation),
  t('integration', 'Integration and trapezium rule', 'p1', A.integration),
  t('graphs', 'Graph sketching and transformations', 'p1', A.graphs),
  t('number', 'Number and bounds', 'gcse', G.number),
  t('ratioprop', 'Ratio and proportion', 'gcse', G.ratioprop),
  t('algebra', 'Algebra', 'gcse', G.algebra),
  t('geometry', 'Geometry and circle theorems', 'gcse', G.geometry),
  t('statistics', 'Statistics', 'gcse', G.statistics),
  t('probability', 'Probability', 'gcse', G.probability),
  l('implication', 'Implication'),
  l('converse', 'Converse and contrapositive'),
  l('necsuff', 'Necessary and sufficient'),
  l('quantifiers', 'Quantifiers and negation'),
  l('proof', 'Proof types'),
  l('errors', 'Spotting errors in proofs'),
];
export const TOPIC = Object.fromEntries(TOPICS.map(x => [x.id, x]));

// Build one question for a topic. `used` is a Set that stops bank questions repeating within a set.
export function makeQuestion(topicId, used = new Set()) {
  const topic = TOPIC[topicId];
  let q;
  if (topic.bank) {
    let free = topic.bank.map((_, i) => i).filter(i => !used.has(`${topicId}:${i}`));
    if (!free.length) { topic.bank.forEach((_, i) => used.delete(`${topicId}:${i}`)); free = topic.bank.map((_, i) => i); }
    const i = pick(free), b = topic.bank[i];
    used.add(`${topicId}:${i}`);
    const options = b.fixed ? b.o : shuffle(b.o);
    q = { type: 'mc', prompt: b.q, options, answer: options.indexOf(b.o[b.fixed ? b.a : 0]), worked: b.why };
  } else {
    for (let tries = 0; !q; tries++) {
      try { q = pick(topic.gens)(); } catch (e) { if (tries > 50) throw e; }
    }
  }
  q.topic = topicId;
  return q;
}
