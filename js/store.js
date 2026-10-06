// All saved progress lives under one localStorage key.
const KEY = 'tmua.v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export const state = Object.assign({ drill: {}, prefs: {} }, load());

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable: carry on unsaved */ }
}

// Per-topic drill stats: n attempts, c correct, ms total time.
export function recordDrill(topic, ok, ms) {
  const s = state.drill[topic] || (state.drill[topic] = { n: 0, c: 0, ms: 0 });
  s.n++; if (ok) s.c++; s.ms += ms;
  save();
}

export function drillStatus(topic) {
  const s = state.drill[topic];
  if (!s || !s.n) return { status: 'Not started', cls: 'none' };
  const acc = s.c / s.n, avg = s.ms / s.n;
  const solid = acc >= 0.8 && s.n >= 10;
  return { status: solid ? 'Solid' : 'Shaky', cls: solid ? 'solid' : 'shaky', acc, avg, n: s.n };
}
