// Section 1, Part 2 (GCSE) generators.
import { ri, nz, pick, shuffle, gcd, num, frac, st, poly, mc, typed } from '../util.js';

const ratio = (a, b) => { const g = gcd(a, b); return `${a / g} : ${b / g}`; };

export const number = [
  () => {
    const X = ri(21, 98), Y = ri(11, X - 5), add = ri(0, 1), upper = ri(0, 1);
    const n = (add ? X + Y : X - Y) + (upper ? 1 : -1);
    return typed(`x = ${X / 10} and y = ${Y / 10}, each correct to 1 decimal place. Find the ${upper ? 'upper' : 'lower'} bound of x ${add ? '+' : '−'} y.`, n, 10,
      `Each value can be out by 0.05. ${add ? 'Add' : 'Subtract'} using the bounds that make the result as ${upper ? 'large' : 'small'} as possible: ${n / 10}.`, '' + n / 10);
  },
  () => {
    const l = ri(4, 30), upper = ri(0, 1), v = 4 * l + (upper ? 2 : -2);
    return typed(`The side of a square is ${l} cm to the nearest cm. Find the ${upper ? 'upper' : 'lower'} bound of its perimeter in cm.`, v, 1,
      `The side is ${upper ? 'below' : 'at least'} ${l + (upper ? 0.5 : -0.5)} cm, so the bound is 4 × ${l + (upper ? 0.5 : -0.5)} = ${v}.`);
  },
  () => {
    const g = pick([2, 3, 4, 6, 8, 12]); let p, q; do { p = pick([2, 3, 4, 5, 7, 9]); q = pick([2, 3, 4, 5, 7, 9]); } while (p === q || gcd(p, q) !== 1);
    const hcf = ri(0, 1);
    return typed(`Find the ${hcf ? 'highest common factor' : 'lowest common multiple'} of ${g * p} and ${g * q}`, hcf ? g : g * p * q, 1,
      `${g * p} = ${g} × ${p} and ${g * q} = ${g} × ${q}, with ${p} and ${q} sharing no factor. HCF = ${g}, LCM = ${g * p * q}.`);
  },
  () => {
    const p = pick([10, 20, 30, 40, 50, 60]);
    return typed(`A price is increased by ${p}% and then decreased by ${p}%. Find the overall percentage decrease.`, p * p, 100,
      `Multipliers: ${1 + p / 100} × ${1 - p / 100} = ${(1 - p * p / 10000).toFixed(4).replace(/0+$/, '')}, a decrease of ${p * p / 100}%.`, '' + p * p / 100);
  },
  () => {
    const n = ri(1, 98), s = String(n).padStart(2, '0');
    return typed(`Write the recurring decimal 0.${s}${s}${s}... as a fraction`, n, 99, `Let x = 0.${s}${s}... Then 100x − x = ${n}, so x = ${n}/99${frac(n, 99) === n + '/99' ? '' : ' = ' + frac(n, 99)}.`);
  },
];

export const ratioprop = [
  () => {
    const [a, b, c] = shuffle([ri(1, 3), ri(4, 6), ri(7, 9)]), u = ri(2, 12), big = Math.max(a, b, c);
    return typed(`${u * (a + b + c)} is shared in the ratio ${a} : ${b} : ${c}. Find the largest share.`, big * u, 1,
      `There are ${a + b + c} parts, each worth ${u}. The largest share is ${big} × ${u} = ${big * u}.`);
  },
  () => {
    const k = ri(2, 5), p = ri(1, 3), X = ri(2, 4); let X2; do X2 = ri(2, 6); while (X2 === X);
    const rel = ['x', 'x²', 'x³'][p - 1];
    return typed(`y is directly proportional to ${rel}. When x = ${X}, y = ${k * X ** p}. Find y when x = ${X2}.`, k * X2 ** p, 1,
      `y = k${rel} with k = ${k * X ** p} ÷ ${X ** p} = ${k}. So y = ${k} × ${X2 ** p} = ${k * X2 ** p}.`);
  },
  () => {
    const X = ri(2, 8), Y = ri(2, 9); let X2; do X2 = ri(2, 12); while (X2 === X);
    return typed(`y is inversely proportional to x. When x = ${X}, y = ${Y}. Find y when x = ${X2}.`, X * Y, X2,
      `xy is constant: ${X} × ${Y} = ${X * Y}. So y = ${X * Y} ÷ ${X2} = ${frac(X * Y, X2)}.`);
  },
  () => {
    const a = ri(1, 5), b = ri(2, 7), c = ri(2, 7), d = ri(1, 9);
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a === b || c === d) throw new Error('retry');
    return mc(`a : b = ${a} : ${b} and b : c = ${c} : ${d}. Find a : c in its simplest form.`, ratio(a * c, b * d),
      [ratio(a, d), ratio(a * d, b * c), ratio(b * d, a * c), ratio(a + c, b + d), ratio(b * c, a * d)],
      `Make the b parts match: a : b = ${a * c} : ${b * c} and b : c = ${b * c} : ${b * d}. So a : c = ${ratio(a * c, b * d)}.`);
  },
];

const side = (a, b) => `${poly([[a, 1]])}${st(b, 'y')}`;
export const algebra = [
  () => {
    const x = ri(-5, 5), y = ri(-5, 5), a = nz(-4, 5), b = nz(-4, 5), c = nz(-4, 5), d = nz(-4, 5);
    if (a * d - b * c === 0) throw new Error('retry');
    const wantX = ri(0, 1);
    return typed(`Solve ${side(a, b)} = ${num(a * x + b * y)} and ${side(c, d)} = ${num(c * x + d * y)}. Find ${wantX ? 'x' : 'y'}.`, wantX ? x : y, 1,
      `Eliminating one variable gives x = ${num(x)}, y = ${num(y)}.`);
  },
  () => {
    const a = nz(-5, 6), b = nz(-9, 9), c = ri(2, 6), d = nz(-6, 6);
    return typed(`Solve (${poly([[a, 1], [b, 0]])})/${c} = ${num(d)}`, c * d - b, a,
      `${poly([[a, 1], [b, 0]])} = ${num(c * d)}, so ${poly([[a, 1]])} = ${num(c * d - b)} and x = ${frac(c * d - b, a)}.`);
  },
  () => {
    const a = nz(-5, 5), b = nz(-7, 7), c = nz(-5, 5), d = nz(-7, 7);
    return typed(`Find the coefficient of x in the expansion of (${poly([[a, 1], [b, 0]])})(${poly([[c, 1], [d, 0]])})`, a * d + b * c, 1,
      `The x terms are ${num(a * d)}x and ${num(b * c)}x, giving ${num(a * d + b * c)}.`);
  },
  () => {
    const m = ri(20, 90), k = ri(1, 4), a = m + k, b = m - k;
    return typed(`Evaluate ${a}² − ${b}²`, (a - b) * (a + b), 1, `(${a} − ${b})(${a} + ${b}) = ${a - b} × ${a + b} = ${(a - b) * (a + b)}.`);
  },
];

export const geometry = [
  () => {
    const a = ri(20, 85);
    return ri(0, 1)
      ? typed(`An arc of a circle subtends an angle of ${a}° at the circumference. Find the angle, in degrees, it subtends at the centre.`, 2 * a, 1, `The angle at the centre is twice the angle at the circumference: ${2 * a}°.`)
      : typed(`An arc of a circle subtends an angle of ${2 * a}° at the centre. Find the angle, in degrees, it subtends at the circumference.`, a, 1, `The angle at the circumference is half the angle at the centre: ${a}°.`);
  },
  () => {
    const a = ri(40, 140);
    return typed(`ABCD is a cyclic quadrilateral and angle A = ${a}°. Find angle C in degrees.`, 180 - a, 1, `Opposite angles of a cyclic quadrilateral add to 180°: ${180 - a}°.`);
  },
  () => {
    const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]);
    return ri(0, 1)
      ? typed(`Find the interior angle, in degrees, of a regular polygon with ${n} sides`, 180 - 360 / n, 1, `Exterior angle = 360° ÷ ${n} = ${360 / n}°, so interior = ${180 - 360 / n}°.`)
      : typed(`Each interior angle of a regular polygon is ${180 - 360 / n}°. How many sides does it have?`, n, 1, `Exterior angle = ${360 / n}°, and 360 ÷ ${360 / n} = ${n}.`);
  },
  () => {
    const r = ri(2, 9), t = pick([30, 45, 60, 90, 120, 135, 150, 240, 270]);
    return ri(0, 1)
      ? typed(`A sector has radius ${r} and angle ${t}°. Its area is kπ. Find k.`, t * r * r, 360, `${t}/360 × π × ${r}² = kπ with k = ${frac(t * r * r, 360)}.`)
      : typed(`A sector has radius ${r} and angle ${t}°. Its arc length is kπ. Find k.`, t * 2 * r, 360, `${t}/360 × 2π × ${r} = kπ with k = ${frac(t * 2 * r, 360)}.`);
  },
  () => {
    const a = ri(1, 4), b = ri(a + 1, 6), m = ri(1, 6), vol = ri(0, 1), e = vol ? 3 : 2;
    if (gcd(a, b) !== 1) throw new Error('retry');
    return typed(`Two similar solids have corresponding lengths in the ratio ${a} : ${b}. The smaller has ${vol ? 'volume' : 'surface area'} ${m * a ** e}. Find the ${vol ? 'volume' : 'surface area'} of the larger.`, m * b ** e, 1,
      `${vol ? 'Volumes' : 'Areas'} scale by the ${vol ? 'cube' : 'square'} of the length ratio: ${m * a ** e} × (${b}/${a})<sup>${e}</sup> = ${m * b ** e}.`);
  },
  () => {
    const a = ri(15, 75);
    return typed(`AB is a diameter of a circle and C is a point on the circle. Angle CAB = ${a}°. Find angle CBA in degrees.`, 90 - a, 1,
      `The angle in a semicircle is 90°, so angle CBA = 90° − ${a}° = ${90 - a}°.`);
  },
];

export const statistics = [
  () => {
    const n = ri(4, 9), m = ri(5, 20), m2 = m + nz(-2, 2);
    return typed(`The mean of ${n} numbers is ${m}. One more number is added and the mean becomes ${m2}. Find the number added.`, (n + 1) * m2 - n * m, 1,
      `New total ${n + 1} × ${m2} = ${(n + 1) * m2}, old total ${n} × ${m} = ${n * m}. Difference: ${num((n + 1) * m2 - n * m)}.`);
  },
  () => {
    const n = ri(5, 8), xs = Array.from({ length: n }, () => ri(1, 20)), s = xs.slice().sort((a, b) => a - b);
    const lo = s[Math.floor((n - 1) / 2)], hi = s[Math.ceil((n - 1) / 2)];
    return typed(`Find the median of ${xs.join(', ')}`, lo + hi, 2, `In order: ${s.join(', ')}. The median is ${(lo + hi) / 2}.`, '' + (lo + hi) / 2);
  },
  () => {
    const vals = [0, 1, 2, 3, 4], fs = vals.map(() => ri(1, 6)), N = fs.reduce((a, b) => a + b, 0), T = fs.reduce((s, f, i) => s + f * vals[i], 0);
    return typed(`The values ${vals.join(', ')} occur with frequencies ${fs.join(', ')} respectively. Find the mean.`, T, N,
      `Total = ${T}, number of values = ${N}, mean = ${frac(T, N)}.`);
  },
  () => {
    const n1 = ri(2, 6) * 5, n2 = ri(2, 6) * 5, m1 = ri(40, 70), m2 = ri(40, 70);
    return typed(`A class of ${n1} has mean mark ${m1}. Another class of ${n2} has mean mark ${m2}. Find the mean mark of all ${n1 + n2} students.`, n1 * m1 + n2 * m2, n1 + n2,
      `(${n1} × ${m1} + ${n2} × ${m2}) ÷ ${n1 + n2} = ${frac(n1 * m1 + n2 * m2, n1 + n2)}.`);
  },
];

export const probability = [
  () => {
    const r = ri(2, 6), b = ri(2, 6), n = r + b, same = ri(0, 1);
    return same
      ? typed(`A bag holds ${r} red and ${b} blue counters. Two are taken without replacement. Find the probability both are red.`, r * (r - 1), n * (n - 1), `${r}/${n} × ${r - 1}/${n - 1} = ${frac(r * (r - 1), n * (n - 1))}.`)
      : typed(`A bag holds ${r} red and ${b} blue counters. Two are taken without replacement. Find the probability they are different colours.`, 2 * r * b, n * (n - 1), `2 × ${r}/${n} × ${b}/${n - 1} = ${frac(2 * r * b, n * (n - 1))}.`);
  },
  () => {
    const s = ri(2, 12), c = 6 - Math.abs(7 - s);
    return typed(`Two fair dice are rolled. Find the probability that the total is ${s}.`, c, 36, `${c} of the 36 equally likely outcomes give a total of ${s}: ${frac(c, 36)}.`);
  },
  () => {
    const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5]]), [c, d] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]]);
    const n = b * d - (b - a) * (d - c);
    return typed(`A and B are independent events with P(A) = ${a}/${b} and P(B) = ${c}/${d}. Find the probability that at least one occurs.`, n, b * d,
      `1 − P(neither) = 1 − ${frac(b - a, b)} × ${frac(d - c, d)} = ${frac(n, b * d)}.`);
  },
  () => {
    const n = ri(3, 5), k = ri(1, n - 1); let c = 1; for (let i = 1; i <= k; i++) c = c * (n - k + i) / i;
    return typed(`A fair coin is tossed ${n} times. Find the probability of exactly ${k} head${k > 1 ? 's' : ''}.`, c, 2 ** n,
      `There are ${c} ways to place the heads among ${2 ** n} equally likely outcomes: ${frac(c, 2 ** n)}.`);
  },
];
