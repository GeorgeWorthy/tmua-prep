// Shared helpers for question generators. No DOM access, so this also runs in node.

export const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[ri(0, a.length - 1)];
export const nz = (a, b) => { let v; do v = ri(a, b); while (v === 0); return v; };
export const shuffle = a => {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = ri(0, i);[a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const nCr = (n, r) => { let v = 1; for (let i = 1; i <= r; i++) v = v * (n - r + i) / i; return Math.round(v); };

// Display helpers. Negative numbers use a proper minus sign.
export const num = n => (n < 0 ? '−' + (-n) : '' + n);
export function frac(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? num(n) : `${num(n)}/${d}`;
}
// Negative numbers in brackets, for use inside working: par(-4) -> (−4).
export const par = n => (n < 0 ? `(${num(n)})` : '' + n);
export const sup = (b, e) => `${b}<sup>${e}</sup>`;
const pw = (v, p) => (p === 0 ? '' : p === 1 ? v : sup(v, p));

// Signed trailing term: st(3,'x') -> " + 3x", st(-1,'y') -> " − y", st(0,'x') -> "".
export function st(c, suffix = '') {
  if (!c) return '';
  const m = Math.abs(c);
  return ` ${c < 0 ? '−' : '+'} ${m === 1 && suffix ? '' : m}${suffix}`;
}
// Polynomial from [coefficient, power] pairs, e.g. poly([[4,3],[-6,1]]) -> 4x³ − 6x.
export function poly(terms, v = 'x') {
  let s = '';
  for (const [c, p] of terms) {
    if (!c) continue;
    const t = st(c, pw(v, p));
    s += s ? t : (c < 0 ? '−' : '') + t.slice(3);
  }
  return s || '0';
}
// Linear factor with root k: lin(2) -> (x − 2), lin(-3) -> (x + 3).
export const lin = k => (k === 0 ? 'x' : `(x${st(-k)})`);

// Question constructors.
// Multiple choice: duplicates of the answer are dropped; throws if too few distractors remain
// so the caller can retry with new random values.
export function mc(prompt, answer, wrong, worked, fixed) {
  const seen = new Set([answer]), w = [];
  for (const x of wrong) if (!seen.has(x)) { seen.add(x); w.push(x); }
  if (w.length < 3) throw new Error('too few distractors');
  const options = fixed ? fixed : shuffle([answer, ...w.slice(0, 4)]);
  return { type: 'mc', prompt, options, answer: options.indexOf(answer), worked };
}
// Typed numeric answer n/d. `shown` overrides how the correct answer is displayed.
export function typed(prompt, n, d, worked, shown) {
  return { type: 'typed', prompt, value: n / d, shown: shown ?? frac(n, d), worked };
}

// Parse a typed answer such as "7", "-3/4", "2.5". Returns NaN if it is not a number.
export function parseAnswer(s) {
  const m = s.replace(/[−–]/g, '-').replace(/\s+/g, '').match(/^(-?\d*\.?\d+)(?:\/(-?\d*\.?\d+))?$/);
  if (!m) return NaN;
  const v = m[2] === undefined ? +m[1] : +m[1] / +m[2];
  return Number.isFinite(v) ? v : NaN;
}
export const sameValue = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
