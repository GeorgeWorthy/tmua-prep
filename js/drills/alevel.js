// Section 1, Part 1 (AS pure) generators. Each returns a question built by mc() or typed().
import { ri, nz, pick, shuffle, gcd, nCr, num, par, frac, sup, st, poly, lin, mc, typed } from '../util.js';

const x2 = 'x<sup>2</sup>', x3 = 'x<sup>3</sup>';
const pt = (x, y) => `(${num(x)}, ${num(y)})`;
const int = (a, b, body) => `∫<sub>${num(a)}</sub><sup>${num(b)}</sup> ${body} dx`;

export const indices = [
  () => {
    const [r, q] = pick([[2, 2], [3, 2], [5, 2], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [2, 5]]);
    const base = r ** q;
    let p; do p = ri(1, q === 2 ? 3 : q + 1); while (gcd(p, q) !== 1);
    const neg = ri(0, 1), v = r ** p, s = neg ? '−' : '';
    return typed(`Evaluate ${sup(base, `${s}${p}/${q}`)}`, neg ? 1 : v, neg ? v : 1,
      `${sup(base, `1/${q}`)} = ${r}, and ${sup(r, s + p)} = ${neg ? '1/' + v : v}.`);
  },
  () => {
    const k = ri(2, 6), m = pick([2, 3, 5, 6, 7]);
    return mc(`Simplify √${k * k * m}`, `${k}√${m}`,
      [`${m}√${k}`, `${k * k}√${m}`, `${k}√${m * k}`, `${k + 1}√${m}`, `${k - 1}√${m}`],
      `${k * k * m} = ${k * k} × ${m}, so √${k * k * m} = ${k}√${m}.`);
  },
  () => {
    const a = ri(1, 4), b = ri(1, 3), c = ri(1, 5);
    return typed(`Find x: ${sup(2, 'x')} = (${sup(4, a)} × ${sup(8, b)}) ÷ ${sup(2, c)}`, 2 * a + 3 * b - c, 1,
      `${sup(4, a)} = ${sup(2, 2 * a)} and ${sup(8, b)} = ${sup(2, 3 * b)}, so x = ${2 * a} + ${3 * b} − ${c} = ${num(2 * a + 3 * b - c)}.`);
  },
  () => {
    const b = pick([2, 3, 5, 7]); let a; do a = ri(2, 5); while (a * a <= b);
    const d = a * a - b, f = (sign, den) => (den === 1 ? `${a} ${sign} √${b}` : `(${a} ${sign} √${b})/${den}`);
    return mc(`Rationalise the denominator: 1/(${a} + √${b})`, f('−', d),
      [f('+', d), f('−', a * a + b), f('+', a * a + b), f('−', a + b), f('−', 2 * a)],
      `Multiply top and bottom by (${a} − √${b}). The denominator becomes ${a * a} − ${b} = ${d}.`);
  },
];

export const quadratics = [
  () => {
    const a = ri(1, 5), b = ri(-9, 9), c = nz(-6, 6);
    return typed(`Find the discriminant of ${poly([[a, 2], [b, 1], [c, 0]])}`, b * b - 4 * a * c, 1,
      `b² − 4ac = ${b * b} − 4 × ${a} × ${par(c)} = ${num(b * b - 4 * a * c)}.`);
  },
  () => {
    const p = ri(1, 3), q = ri(1, 5);
    return typed(`${poly([[p * p, 2]])} + kx + ${q * q} = 0 has equal roots and k &gt; 0. Find k.`, 2 * p * q, 1,
      `Equal roots need k² = 4 × ${p * p} × ${q * q} = ${4 * p * p * q * q}, so k = ${2 * p * q}.`);
  },
  () => {
    const up = ri(0, 1), h = nz(-5, 5), c = ri(-9, 9), b = 2 * h;
    if (up) return typed(`Find the minimum value of ${poly([[1, 2], [b, 1], [c, 0]])}`, c - h * h, 1,
      `Complete the square: (x${st(h)})² ${st(c - h * h).trim() || '+ 0'}. Minimum is ${num(c - h * h)}.`);
    return typed(`Find the maximum value of ${poly([[-1, 2], [b, 1], [c, 0]])}`, c + h * h, 1,
      `Complete the square: −(x${st(-h)})² ${st(c + h * h).trim() || '+ 0'}. Maximum is ${num(c + h * h)}.`);
  },
  () => {
    const a = ri(1, 4), b = nz(-9, 9); let c; do c = nz(-8, 8); while (b * b - 4 * a * c < 0);
    const sum = ri(0, 1), eq = `${poly([[a, 2], [b, 1], [c, 0]])} = 0`;
    return sum
      ? typed(`Find the sum of the roots of ${eq}`, -b, a, `Sum of roots = −b/a = ${frac(-b, a)}.`)
      : typed(`Find the product of the roots of ${eq}`, c, a, `Product of roots = c/a = ${frac(c, a)}.`);
  },
];

export const inequalities = [
  () => {
    const k = nz(-6, 6), m = nz(-4, 4); let a; do a = nz(-5, 6); while (a === m);
    const c = a - m, b = ri(-9, 9), d = b + m * k, op = pick(['&lt;', '&gt;']);
    const less = (op === '&lt;') === (m > 0);
    const ans = `x ${less ? '&lt;' : '&gt;'} ${num(k)}`;
    return mc(`Solve ${poly([[a, 1], [b, 0]])} ${op} ${poly([[c, 1], [d, 0]])}`, ans,
      [`x ${less ? '&gt;' : '&lt;'} ${num(k)}`, `x &lt; ${num(-k)}`, `x &gt; ${num(-k)}`, `x ${less ? '&lt;' : '&gt;'} ${num(k + 1)}`],
      `Collect terms: ${poly([[m, 1]])} ${op} ${num(m * k)}. ${m < 0 ? 'Dividing by a negative number reverses the inequality. ' : ''}So ${ans}.`);
  },
  () => {
    const p = ri(-6, 4), q = ri(p + 1, 6), lt = ri(0, 1);
    const inside = (a, b) => `${num(a)} &lt; x &lt; ${num(b)}`, outside = (a, b) => `x &lt; ${num(a)} or x &gt; ${num(b)}`;
    const ans = lt ? inside(p, q) : outside(p, q);
    return mc(`Solve ${poly([[1, 2], [-(p + q), 1], [p * q, 0]])} ${lt ? '&lt;' : '&gt;'} 0`, ans,
      [lt ? outside(p, q) : inside(p, q), inside(-q, -p), outside(-q, -p), `x &lt; ${num(p)}`, `x &gt; ${num(q)}`],
      `Factorise: ${lin(p)}${lin(q)}. The parabola is ${lt ? 'below' : 'above'} the axis ${lt ? 'between' : 'outside'} the roots ${num(p)} and ${num(q)}.`);
  },
  () => {
    const a = ri(-9, 9), b = ri(2, 9), strict = ri(0, 1);
    return typed(`How many integers x satisfy |x${st(-a)}| ${strict ? '&lt;' : '≤'} ${b}?`, strict ? 2 * b - 1 : 2 * b + 1, 1,
      `${num(a - b)} ${strict ? '&lt;' : '≤'} x ${strict ? '&lt;' : '≤'} ${num(a + b)}, which contains ${strict ? 2 * b - 1 : 2 * b + 1} integers.`);
  },
];

export const polynomials = [
  () => {
    const a = ri(-5, 5), b = ri(-5, 5), c = ri(-5, 5), k = nz(-3, 3), v = k ** 3 + a * k * k + b * k + c;
    return typed(`Find the remainder when ${poly([[1, 3], [a, 2], [b, 1], [c, 0]])} is divided by ${lin(k)}`, v, 1,
      `By the remainder theorem the remainder is f(${num(k)}) = ${num(v)}.`);
  },
  () => {
    const k = nz(-3, 3), a = nz(-5, 5), b = nz(-6, 6), c = -(k ** 3 + a * k * k + b * k);
    return typed(`${lin(k)} is a factor of ${x3} + a${x2}${st(b, 'x')}${st(c)}. Find a.`, a, 1,
      `f(${num(k)}) = 0 gives ${num(k ** 3)} + ${k * k === 1 ? '' : k * k}a ${st(b * k).trim()} ${st(c).trim()} = 0, so a = ${num(a)}.`);
  },
  () => {
    const p = nz(-4, 4), q = nz(-4, 4), r = nz(-4, 4), which = ri(0, 2);
    const expr = `${lin(p)}${lin(q)}${lin(r)}`;
    if (which === 0) return typed(`Find the coefficient of ${x2} in the expansion of ${expr}`, -(p + q + r), 1,
      `The ${x2} coefficient is minus the sum of the roots: ${num(-(p + q + r))}.`);
    if (which === 1) return typed(`Find the coefficient of x in the expansion of ${expr}`, p * q + q * r + r * p, 1,
      `The x coefficient is the sum of products of roots in pairs: ${num(p * q + q * r + r * p)}.`);
    return typed(`Find the constant term in the expansion of ${expr}`, -p * q * r, 1,
      `Multiply the constant terms: ${num(-p)} × ${par(-q)} × ${par(-r)} = ${num(-p * q * r)}.`);
  },
];

export const series = [
  () => {
    const a = ri(-9, 12), d = nz(-6, 7), n = ri(8, 30);
    return typed(`Find the ${n}th term of the arithmetic sequence ${num(a)}, ${num(a + d)}, ${num(a + 2 * d)}, ...`, a + (n - 1) * d, 1,
      `a + (n − 1)d = ${num(a)} + ${n - 1} × ${par(d)} = ${num(a + (n - 1) * d)}.`);
  },
  () => {
    const a = ri(-5, 12), d = nz(-4, 6), n = ri(6, 20), s = n * (2 * a + (n - 1) * d) / 2;
    return typed(`Find the sum of the first ${n} terms of the arithmetic series whose terms are ${num(a)}, ${num(a + d)}, ${num(a + 2 * d)}, ...`, s, 1,
      `S = n/2 × (2a + (n − 1)d) = ${n}/2 × ${par(2 * a + (n - 1) * d)} = ${num(s)}.`);
  },
  () => {
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [-1, 2], [-1, 3], [-2, 3]]);
    const a = ri(1, 4) * q * q;
    return typed(`Find the sum to infinity of the geometric series ${a}, ${num(a * p / q)}, ${num(a * p * p / (q * q))}, ...`, a * q, q - p,
      `r = ${frac(p, q)}, so S = a/(1 − r) = ${a} ÷ ${frac(q - p, q)} = ${frac(a * q, q - p)}.`);
  },
  () => {
    const a = ri(1, 5), r = pick([2, 3, -2, -3]), n = ri(4, 6);
    return typed(`Find the ${n}th term of the geometric sequence ${a}, ${num(a * r)}, ${num(a * r * r)}, ...`, a * r ** (n - 1), 1,
      `ar<sup>n−1</sup> = ${a} × ${sup(`(${num(r)})`, n - 1)} = ${num(a * r ** (n - 1))}.`);
  },
];

export const binomial = [
  () => {
    const n = ri(4, 7), k = ri(2, 3), a = nz(-3, 3), v = nCr(n, k) * a ** k;
    return typed(`Find the coefficient of ${sup('x', k)} in the expansion of ${sup(`(1${st(a, 'x')})`, n)}`, v, 1,
      `<sup>${n}</sup>C<sub>${k}</sub> × ${sup(`(${num(a)})`, k)} = ${nCr(n, k)} × ${num(a ** k)} = ${num(v)}.`);
  },
  () => {
    const n = ri(3, 5), k = ri(1, 2), a = ri(2, 3), b = nz(-2, 2), v = nCr(n, k) * a ** (n - k) * b ** k;
    return typed(`Find the coefficient of ${k === 1 ? 'x' : x2} in the expansion of ${sup(`(${a}${st(b, 'x')})`, n)}`, v, 1,
      `<sup>${n}</sup>C<sub>${k}</sub> × ${sup(a, n - k)} × ${sup(`(${num(b)})`, k)} = ${nCr(n, k)} × ${a ** (n - k)} × ${num(b ** k)} = ${num(v)}.`);
  },
  () => {
    const n = ri(5, 10), r = ri(2, 4);
    return typed(`Evaluate <sup>${n}</sup>C<sub>${r}</sub>`, nCr(n, r), 1, `n!/(r!(n − r)!) = ${nCr(n, r)}.`);
  },
];

export const lines = [
  () => {
    const x1 = ri(-6, 6), y1 = ri(-6, 6), x2 = x1 + nz(-6, 6), y2 = y1 + ri(-8, 8);
    return typed(`Find the gradient of the line through ${pt(x1, y1)} and ${pt(x2, y2)}`, y2 - y1, x2 - x1,
      `(${num(y2)} − ${par(y1)}) ÷ (${num(x2)} − ${par(x1)}) = ${frac(y2 - y1, x2 - x1)}.`);
  },
  () => {
    const a = nz(-6, 6), b = nz(-6, 6), c = ri(-9, 9);
    return typed(`Find the gradient of a line perpendicular to ${poly([[a, 1]])}${st(b, 'y')} = ${num(c)}`, b, a,
      `The line has gradient ${frac(-a, b)}. The perpendicular gradient is the negative reciprocal, ${frac(b, a)}.`);
  },
  () => {
    const [p, q, h] = pick([[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [9, 12, 15]]);
    const x1 = ri(-6, 6), y1 = ri(-6, 6), sw = ri(0, 1), dx = (sw ? q : p) * pick([1, -1]), dy = (sw ? p : q) * pick([1, -1]);
    return typed(`Find the distance between ${pt(x1, y1)} and ${pt(x1 + dx, y1 + dy)}`, h, 1,
      `√(${Math.abs(dx)}² + ${Math.abs(dy)}²) = √${h * h} = ${h}.`);
  },
  () => {
    const m = nz(-5, 5), x1 = nz(-5, 5), y1 = ri(-8, 8);
    return typed(`A line with gradient ${num(m)} passes through ${pt(x1, y1)}. Find its y-intercept.`, y1 - m * x1, 1,
      `c = y − mx = ${num(y1)} − (${num(m)})(${num(x1)}) = ${num(y1 - m * x1)}.`);
  },
];

const circleEq = (h, k, r) => `${x2} + y<sup>2</sup>${st(-2 * h, 'x')}${st(-2 * k, 'y')}${st(h * h + k * k - r * r)} = 0`;
export const circles = [
  () => {
    const h = nz(-6, 6), k = nz(-6, 6), r = ri(2, 9);
    return typed(`Find the radius of the circle ${circleEq(h, k, r)}`, r, 1,
      `Complete the square: (x${st(-h)})² + (y${st(-k)})² = ${r * r}, so the radius is ${r}.`);
  },
  () => {
    const h = nz(-6, 6), k = nz(-6, 6), r = ri(2, 9);
    return mc(`Find the centre of the circle ${circleEq(h, k, r)}`, pt(h, k),
      [pt(-h, -k), pt(2 * h, 2 * k), pt(-2 * h, -2 * k), pt(k, h), pt(h, -k)],
      `Complete the square: (x${st(-h)})² + (y${st(-k)})² = ${r * r}, so the centre is ${pt(h, k)}.`);
  },
  () => {
    const h = ri(-5, 5), k = ri(-5, 5), dx = nz(-6, 6), dy = ri(-6, 6);
    return typed(`A circle has centre ${pt(h, k)} and passes through ${pt(h + dx, k + dy)}. Its equation is (x${st(-h) || ''})² + (y${st(-k) || ''})² = c. Find c.`, dx * dx + dy * dy, 1,
      `c = r² = ${par(dx)}² + ${par(dy)}² = ${dx * dx + dy * dy}.`);
  },
];

const MAGS = [[0, '0'], [0.5, '1/2'], [Math.SQRT1_2, '√2/2'], [Math.sqrt(3) / 2, '√3/2'], [1, '1'], [Math.sqrt(3) / 3, '√3/3'], [Math.sqrt(3), '√3']];
const exact = v => { const m = MAGS.find(([x]) => Math.abs(Math.abs(v) - x) < 1e-9); return (v < -1e-9 ? '−' : '') + m[1]; };
const rad = d => { const g = gcd(d, 180), n = d / g, den = 180 / g; return n === 0 ? '0' : `${n === 1 ? '' : n}π${den === 1 ? '' : '/' + den}`; };
export const trig = [
  () => {
    const fn = pick(['sin', 'cos', 'tan']), d = pick([0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]);
    const t = d * Math.PI / 180;
    if (fn === 'tan' && Math.abs(Math.cos(t)) < 1e-9) throw new Error('undefined');
    const ans = exact(Math[fn](t)), neg = ans === '0' ? [] : [ans[0] === '−' ? ans.slice(1) : '−' + ans];
    const mags = fn === 'tan' ? ['0', '√3/3', '1', '√3'] : ['0', '1/2', '√2/2', '√3/2', '1'];
    const cand = shuffle(mags.flatMap(m => (m === '0' ? ['0'] : [m, '−' + m])));
    const angle = ri(0, 1) ? `${d}°` : rad(d);
    return mc(`Find the exact value of ${fn} ${angle}`, ans, [...neg, ...cand],
      `${fn} ${d}° = ${ans}. Use the reference angle and the sign of ${fn} in that quadrant.`);
  },
  () => {
    let [a, b, h] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]]);
    if (ri(0, 1)) [a, b] = [b, a];
    const obtuse = ri(0, 1), cos = ri(0, 1), s = obtuse ? -1 : 1;
    const given = `sin θ = ${a}/${h} and θ is ${obtuse ? 'obtuse' : 'acute'}`;
    return cos
      ? typed(`Given ${given}, find cos θ`, s * b, h, `cos²θ = 1 − sin²θ = ${b * b}/${h * h}. Cosine is ${obtuse ? 'negative' : 'positive'} here, so cos θ = ${frac(s * b, h)}.`)
      : typed(`Given ${given}, find tan θ`, s * a, b, `cos θ = ${frac(s * b, h)}, so tan θ = sin θ / cos θ = ${frac(s * a, b)}.`);
  },
  () => {
    const [p, q] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [5, 4], [4, 3], [6, 5], [1, 5]]);
    return typed(`Given sin θ + cos θ = ${p}/${q}, find sin θ cos θ`, p * p - q * q, 2 * q * q,
      `Square both sides: 1 + 2 sin θ cos θ = ${frac(p * p, q * q)}, so sin θ cos θ = ${frac(p * p - q * q, 2 * q * q)}.`);
  },
];

export const triggraphs = [
  () => {
    const fn = pick(['sin', 'cos', 'tan']), k = pick(fn === 'tan' ? [2, 3, 4, 5, 6, 9, 10] : [2, 3, 4, 5, 6, 8, 9, 10]);
    const base = fn === 'tan' ? 180 : 360;
    return typed(`Find the period, in degrees, of y = ${fn} ${k}x`, base / k, 1, `${fn} x has period ${base}°, so ${fn} ${k}x has period ${base}° ÷ ${k} = ${base / k}°.`);
  },
  () => {
    const a = ri(-6, 6), b = nz(-5, 5), c = ri(1, 4), fn = pick(['sin', 'cos']), max = ri(0, 1);
    const v = max ? a + Math.abs(b) : a - Math.abs(b);
    const wave = `${Math.abs(b) === 1 ? '' : Math.abs(b) + ' '}${fn} ${c === 1 ? '' : c}x`;
    const expr = a === 0 ? (b < 0 ? '−' : '') + wave : `${num(a)} ${b < 0 ? '−' : '+'} ${wave}`;
    return typed(`Find the ${max ? 'maximum' : 'minimum'} value of ${expr}`, v, 1,
      `${fn} lies between −1 and 1, so the expression ranges from ${num(a - Math.abs(b))} to ${num(a + Math.abs(b))}.`);
  },
  () => {
    const fn = pick(['sin', 'cos']), k = ri(1, 4), c = pick(['1/2', '−1/2', '1/3', '0', '1', '−1']);
    let n;
    if (fn === 'sin') n = c === '0' ? 2 * k + 1 : c === '1' || c === '−1' ? k : 2 * k;
    else n = c === '0' ? 2 * k : c === '1' ? k + 1 : c === '−1' ? k : 2 * k;
    return typed(`How many solutions does ${fn} ${k === 1 ? '' : k}x = ${c} have for 0° ≤ x ≤ 360°?`, n, 1,
      `${k === 1 ? 'x' : k + 'x'} runs from 0° to ${360 * k}°, which is ${k} full cycle${k > 1 ? 's' : ''}. Count the solutions in each cycle and check both end points: ${n}.`);
  },
];

export const logs = [
  () => {
    const b = pick([2, 3, 5]), m = ri(1, b === 2 ? 6 : 3), n = ri(1, b === 2 ? 5 : 3), plus = ri(0, 1);
    const lg = e => `log<sub>${b}</sub> ${b ** e}`;
    return typed(`Evaluate ${lg(m)} ${plus ? '+' : '−'} ${lg(n)}`, plus ? m + n : m - n, 1,
      `${lg(m)} = ${m} and ${lg(n)} = ${n}, giving ${num(plus ? m + n : m - n)}.`);
  },
  () => {
    const b = pick([2, 3, 5]), m = ri(1, 3), c = nz(-3, 3), k = ri(2, b === 2 ? 6 : 4);
    return typed(`Solve ${sup(b, poly([[m, 1], [c, 0]]))} = ${b ** k}`, k - c, m,
      `${b ** k} = ${sup(b, k)}, so ${poly([[m, 1], [c, 0]])} = ${k} and x = ${frac(k - c, m)}.`);
  },
  () => {
    const r = pick([2, 3]), p = ri(2, 3); let q; do q = ri(1, 5); while (q === p);
    return typed(`Evaluate log<sub>${r ** p}</sub> ${r ** q}`, q, p,
      `${r ** p} = ${sup(r, p)} and ${r ** q} = ${sup(r, q)}, so the value is ${frac(q, p)}.`);
  },
  () => {
    const b = pick([2, 3, 4, 5, 10]), k = pick([-2, -1, 2, 3]);
    return typed(`Solve log<sub>${b}</sub> x = ${num(k)}`, k > 0 ? b ** k : 1, k > 0 ? 1 : b ** -k,
      `x = ${sup(b, num(k))} = ${frac(k > 0 ? b ** k : 1, k > 0 ? 1 : b ** -k)}.`);
  },
];

export const differentiation = [
  () => {
    const p = ri(2, 5), q = ri(1, p - 1), a = nz(-6, 6), b = nz(-9, 9), k = ri(0, 1) ? nz(-9, 9) : 0;
    const ans = poly([[a * p, p - 1], [b * q, q - 1]]);
    return mc(`Differentiate ${poly([[a, p], [b, q], [k, 0]])} with respect to x`, ans,
      [poly([[a * p, p], [b * q, q]]), poly([[a, p - 1], [b, q - 1]]), poly([[a * p, p - 1], [-b * q, q - 1]]),
      ...(k && q > 1 ? [ans + st(k)] : []), poly([[a * (p - 1), p - 1], [b * q, q - 1]]), poly([[a * p, p - 1], [b, q - 1]])],
      `Multiply by the power, then reduce the power by one: ${ans}.`);
  },
  () => {
    const a = nz(-3, 3), b = ri(-4, 4), c = ri(-6, 6), k = nz(-3, 3), v = 3 * a * k * k + 2 * b * k + c;
    return typed(`Find the gradient of y = ${poly([[a, 3], [b, 2], [c, 1]])} at x = ${num(k)}`, v, 1,
      `dy/dx = ${poly([[3 * a, 2], [2 * b, 1], [c, 0]])}. At x = ${num(k)} this is ${num(v)}.`);
  },
  () => {
    const a = nz(-4, 4), b = nz(-9, 9), c = ri(-6, 6);
    return typed(`Find the x-coordinate of the stationary point of y = ${poly([[a, 2], [b, 1], [c, 0]])}`, -b, 2 * a,
      `dy/dx = ${poly([[2 * a, 1], [b, 0]])} = 0 gives x = ${frac(-b, 2 * a)}.`);
  },
  () => {
    const a = nz(-9, 9), k = nz(-4, 4);
    return typed(`Find the gradient of y = ${num(a)}/x at x = ${num(k)}`, -a, k * k,
      `dy/dx = ${num(-a)}/x². At x = ${num(k)} this is ${frac(-a, k * k)}.`);
  },
];

export const integration = [
  () => {
    const a = ri(1, 3), b = ri(-3, 3), c = ri(-4, 4), p = ri(0, 2), q = p + ri(1, 2);
    const F = x => a * x ** 3 + b * x * x + c * x;
    return typed(`Evaluate ${int(p, q, `(${poly([[3 * a, 2], [2 * b, 1], [c, 0]])})`)}`, F(q) - F(p), 1,
      `The integral is ${poly([[a, 3], [b, 2], [c, 1]])}. Substituting gives ${num(F(q))} − ${num(F(p))} = ${num(F(q) - F(p))}.`);
  },
  () => {
    const p = ri(1, 4), q = ri(0, p - 1), a = nz(-4, 4), b = nz(-6, 6), C = ' + c';
    const ans = poly([[a, p + 1], [b, q + 1]]) + C;
    return mc(`Find ∫ (${poly([[a * (p + 1), p], [b * (q + 1), q]])}) dx`, ans,
      [poly([[a * (p + 1), p + 1], [b * (q + 1), q + 1]]) + C, poly([[a * (p + 1) * p, p - 1], [b * (q + 1) * q, q - 1]]) + C,
      poly([[a, p], [b, q]]) + C, poly([[a, p + 1], [-b, q + 1]]) + C],
      `Raise each power by one and divide by the new power: ${ans}.`);
  },
  () => {
    const n = ri(3, 4), [hn, hd] = pick([[1, 1], [2, 1], [1, 2]]), ys = Array.from({ length: n + 1 }, () => ri(1, 9));
    const S = ys[0] + ys[n] + 2 * ys.slice(1, n).reduce((s, y) => s + y, 0), v = S * hn / (2 * hd);
    return typed(`A curve has y-values ${ys.join(', ')} at equally spaced x-values with spacing ${hn / hd}. Use the trapezium rule with ${n} strips to estimate the area under the curve.`, S * hn, 2 * hd,
      `h/2 × (first + last + 2 × the rest) = ${hn / hd}/2 × ${S} = ${v}.`, '' + v);
  },
];

export const graphs = [
  () => {
    const kind = ri(0, 4), k = ri(2, 4), p = nz(-4, 4) * (kind === 1 ? k : 1); let q; do q = nz(-6, 6); while (Math.abs(q) === Math.abs(p));
    const a = nz(-4, 4), b = nz(-5, 5), base = `The graph of y = f(x) has a turning point at ${pt(p, q)}. Where is the corresponding turning point of `;
    if (kind === 0) return mc(`${base}y = f(x${st(a)})${st(b)}?`, pt(p - a, q + b),
      [pt(p + a, q + b), pt(p - a, q - b), pt(p + a, q - b), pt(p + b, q + a)],
      `f(x${st(a)}) moves the graph ${Math.abs(a)} ${a > 0 ? 'left' : 'right'}; ${st(b).trim()} moves it ${Math.abs(b)} ${b > 0 ? 'up' : 'down'}.`);
    if (kind === 1) return mc(`${base}y = f(${k}x)?`, pt(p / k, q), [pt(p * k, q), pt(p, q * k), pt(p * k, q * k), pt(p / k, q * k)],
      `f(${k}x) is a stretch in the x-direction with scale factor 1/${k}.`);
    if (kind === 2) return mc(`${base}y = ${k}f(x)?`, pt(p, q * k), [pt(p * k, q), pt(p * k, q * k), pt(p, q + k), pt(p + k, q)],
      `${k}f(x) is a stretch in the y-direction with scale factor ${k}.`);
    if (kind === 3) return mc(`${base}y = f(−x)?`, pt(-p, q), [pt(p, -q), pt(-p, -q), pt(p, q), pt(q, p)], `f(−x) reflects the graph in the y-axis.`);
    return mc(`${base}y = −f(x)?`, pt(p, -q), [pt(-p, q), pt(-p, -q), pt(p, q), pt(q, p)], `−f(x) reflects the graph in the x-axis.`);
  },
  () => {
    const a = nz(-4, 4), b = nz(-4, 4), c = nz(-4, 4);
    return typed(`Where does y = ${lin(a)}${lin(b)}${lin(c)} cross the y-axis? Give the y-value.`, -a * b * c, 1,
      `Set x = 0: (${num(-a)})(${num(-b)})(${num(-c)}) = ${num(-a * b * c)}.`);
  },
  () => {
    const a = nz(-6, 6), b = nz(-6, 6), c = nz(-6, 6), vert = ri(0, 1);
    const eq = `y = ${num(a)}/${lin(b)}${st(c)}`;
    return vert
      ? typed(`The curve ${eq} has a vertical asymptote x = k. Find k.`, b, 1, `The denominator is zero when x = ${num(b)}.`)
      : typed(`The curve ${eq} has a horizontal asymptote y = k. Find k.`, c, 1, `As x becomes large, ${num(a)}/${lin(b)} tends to 0, so y tends to ${num(c)}.`);
  },
];
