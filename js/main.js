// Two stick figures walking one line through the days we spent together.
// Every memory is a small scene along the line, and the whole page is drawn
// from one scroll progress value p (0 → 1). At the end, a letter.

gsap.registerPlugin(ScrollTrigger);

/* ================================================================== */
/* helpers                                                             */
/* ================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const group = (parent, html = '', attrs = {}) => {
  const g = el('g', attrs, parent);
  if (html) g.innerHTML = html;
  return g;
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const pulse = (a, b, v) => Math.sin(Math.PI * clamp((v - a) / (b - a)));
const window01 = (a, b, v, f = 0.03) => smooth(a, a + f, v) * (1 - smooth(b - f, b, v));
const rad = (d) => (d * Math.PI) / 180;
const f1 = (n) => (+n).toFixed(1);
const o3 = (n) => clamp(+n).toFixed(3);
const put = (n, x, y, r = 0, s = 1) =>
  n.setAttribute('transform', `translate(${f1(x)} ${f1(y)})${r ? ` rotate(${f1(r)})` : ''}${s !== 1 ? ` scale(${(+s).toFixed(3)})` : ''}`);
const op = (n, v) => n.setAttribute('opacity', o3(v));
const seeded = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

/* ================================================================== */
/* poses                                                               */
/* ================================================================== */

const LEN = { thigh: 12, shin: 12, upper: 10, fore: 10, torso: 20, head: 5.6, seat: 13 };

// angles in degrees from straight down; positive = towards the way they face
const pose = (lean, l1t, l1k, l2t, l2k, a1u, a1f, a2u, a2f, sit = 0) => ({
  lean,
  sit,
  legs: [{ t: l1t, k: l1k }, { t: l2t, k: l2k }],
  arms: [{ u: a1u, f: a1f }, { u: a2u, f: a2f }],
});
const mix = (a, b, t) => ({
  lean: lerp(a.lean, b.lean, t),
  sit: lerp(a.sit, b.sit, t),
  legs: a.legs.map((l, i) => ({ t: lerp(l.t, b.legs[i].t, t), k: lerp(l.k, b.legs[i].k, t) })),
  arms: a.arms.map((m, i) => ({ u: lerp(m.u, b.arms[i].u, t), f: lerp(m.f, b.arms[i].f, t) })),
});
const withArm = (p, i, u, f) => {
  const q = mix(p, p, 0);
  q.arms[i] = { u, f };
  return q;
};
const withLean = (p, lean) => ({ ...mix(p, p, 0), lean });

const STAND = pose(0, 4, 3, -4, 3, -6, 10, 8, 10);
const SIT = pose(2, 90, 90, 82, 84, 45, 40, 55, 40, 1);
const CHEER = pose(-4, 6, 4, -6, 4, 160, 15, 170, 10);
const POINT = withArm(STAND, 1, 112, 4);
const GIVE = withArm(STAND, 1, 78, 0);
const SAD = pose(12, 3, 2, -3, 2, -2, 4, 2, 4);
const PHONE_ARM = [118, 112];
const PHONE = withArm(STAND, 1, ...PHONE_ARM);
const SIT_PHONE = withArm(SIT, 1, ...PHONE_ARM);
const LIE = pose(0, 2, 0, -2, 0, 10, 10, 20, 10);
const LIE_PHONE = withArm(LIE, 1, ...PHONE_ARM);
const LIE_LAPTOP = withArm(withArm(LIE, 1, 50, 50), 0, 40, 60);
const STEER = pose(4, 90, 90, 82, 84, 68, -20, 72, -24, 1);
const HUG = pose(0, 4, 3, -4, 3, 55, 70, 62, 64);
const SLIP = pose(-26, 42, 0, 24, 12, -60, 0, 70, 30);

const walk = (ph) => {
  const s = Math.sin(ph);
  const c = Math.cos(ph);
  return pose(3, 24 * s, 8 + 24 * Math.max(0, c), -24 * s, 8 + 24 * Math.max(0, -c), -24 * s, 16, 24 * s, 16);
};
const eat = (k, base = SIT) => withArm(base, 1, lerp(55, 22, k), lerp(40, 150, k));
const type = (k) => withArm(withArm(SIT, 1, lerp(52, 60, k), 48), 0, lerp(60, 52, k), 44);
const paint = (k, base = SIT) => withArm(base, 1, lerp(68, 98, k), lerp(20, -4, k));
const wave = (k, base = STAND) => withArm(base, 1, 150, lerp(-25, 35, k));
const argue = (k) => pose(10, 8, 6, -8, 4, lerp(30, 95, k), 40, lerp(115, 55, k), 30);
const clap = (k) => pose(2, 90, 90, 82, 84, 62, lerp(55, 85, k), 62, lerp(85, 55, k), 1);
const bowlPose = (k) => {
  const HOLD = pose(14, 12, 20, -10, 18, -6, 12, 25, 60);
  const BACK = pose(26, 30, 34, -28, 10, -6, 12, -75, 0);
  const THROW = pose(32, 46, 58, -52, 6, -30, 10, 85, 0);
  return k < 0.55 ? mix(HOLD, BACK, ease(k / 0.55)) : mix(BACK, THROW, ease((k - 0.55) / 0.45));
};
const cyc = (t, n, off = 0) => (1 - Math.cos(t * Math.PI * 2 * n + off)) / 2;

const STR = 1 / 13;

/* ================================================================== */
/* the line                                                            */
/* ================================================================== */

const bump = (x, a, b, h) =>
  x <= a || x >= b ? 0 : (-h * (1 - Math.cos((2 * Math.PI * (x - a)) / (b - a)))) / 2;

const LAND = { hike: -1e6, drive: -1e6, driveLen: 0 };
const ground = (x) => {
  let y = bump(x, LAND.hike - 640, LAND.hike + 640, 340);
  const d0 = LAND.drive - LAND.driveLen / 2;
  if (LAND.driveLen && x > d0 && x < d0 + LAND.driveLen) {
    y += (-24 * (1 - Math.cos((2 * Math.PI * (x - d0)) / 350))) / 2;
  }
  return y;
};

/* ================================================================== */
/* stage + figures                                                     */
/* ================================================================== */

const svg = document.querySelector('.stage');
const world = el('g', {}, svg);
const L = { sky: el('g', {}, world) };
L.ground = el('path', { class: 'ground' }, world);
L.ghost = el('path', { class: 'thread-ghost' }, world);
L.thread = el('path', { class: 'thread' }, world);
L.back = el('g', {}, world);
L.figs = el('g', {}, world);
L.front = el('g', {}, world);

const makeFigure = (who) => {
  const g = el('g', { class: `fig fig--${who}` }, L.figs);
  const armFar = el('polyline', { class: 'far' }, g);
  const legFar = el('polyline', { class: 'far' }, g);
  const torso = el('line', {}, g);
  const legNear = el('polyline', {}, g);
  const armNear = el('polyline', {}, g);
  const head = el('circle', { r: LEN.head }, g);
  const hair = el('polyline', { class: 'hair' }, g);
  return { g, legs: [legFar, legNear], arms: [armFar, armNear], torso, head, hair, who };
};

const drawFigure = (fig, st) => {
  if (!st || (st.show ?? 1) <= 0.001) {
    fig.g.style.opacity = 0;
    return null;
  }
  const dir = st.dir || 1;
  const p = st.pose;
  const P = (o, a, len) => ({ x: o.x + Math.sin(rad(a)) * len * dir, y: o.y + Math.cos(rad(a)) * len });
  const hip = { x: 0, y: 0 };
  const neck = { x: Math.sin(rad(p.lean)) * LEN.torso * dir, y: -Math.cos(rad(p.lean)) * LEN.torso };
  const tilt = p.lean + (st.nod || 0);
  const headC = {
    x: neck.x + Math.sin(rad(tilt)) * (LEN.head + 2.6) * dir,
    y: neck.y - Math.cos(rad(tilt)) * (LEN.head + 2.6),
  };
  const shoulder = { x: neck.x * 0.86, y: neck.y * 0.86 };
  const legs = p.legs.map((l) => {
    const knee = P(hip, l.t, LEN.thigh);
    return [hip, knee, P(knee, l.t - l.k, LEN.shin)];
  });
  const arms = p.arms.map((a) => {
    const elbow = P(shoulder, a.u, LEN.upper);
    return [shoulder, elbow, P(elbow, a.u + a.f, LEN.fore)];
  });
  const b = -dir;
  const sway = st.sway || 0;
  const hair = [
    { x: headC.x + b * 4, y: headC.y - 3 },
    { x: headC.x + b * 9, y: headC.y + 1 },
    { x: headC.x + b * (10 + sway), y: headC.y + 8 },
  ];

  const lowest = Math.max(legs[0][2].y, legs[1][2].y);
  let ox;
  let oy;
  if (st.hip) {
    ox = st.hip.x;
    oy = st.hip.y;
  } else {
    const fl = st.floor ?? ground(st.x);
    ox = st.x;
    oy = fl + lerp(-lowest, -LEN.seat, p.sit) - (st.lift || 0);
  }
  const r = rad(st.rot || 0);
  const cr = Math.cos(r);
  const sr = Math.sin(r);
  const A = (q) => ({ x: q.x * cr - q.y * sr + ox, y: q.x * sr + q.y * cr + oy });
  const pts = (arr) => arr.map((q) => { const a = A(q); return `${f1(a.x)},${f1(a.y)}`; }).join(' ');

  fig.legs.forEach((n, i) => n.setAttribute('points', pts(legs[i])));
  fig.arms.forEach((n, i) => n.setAttribute('points', pts(arms[i])));
  const h0 = A(hip);
  const n0 = A(neck);
  fig.torso.setAttribute('x1', f1(h0.x));
  fig.torso.setAttribute('y1', f1(h0.y));
  fig.torso.setAttribute('x2', f1(n0.x));
  fig.torso.setAttribute('y2', f1(n0.y));
  const hc = A(headC);
  fig.head.setAttribute('cx', f1(hc.x));
  fig.head.setAttribute('cy', f1(hc.y));
  const withHair = fig.who === 'her' || st.hair;
  fig.hair.setAttribute('points', withHair ? pts(hair) : '');
  // inline style, so it wins over the stylesheet; everyone else stays faint
  fig.g.style.opacity = o3((st.show ?? 1) * (fig.who === 'other' ? 0.28 : 1));
  return { hand: A(arms[1][2]), handFar: A(arms[0][2]), head: hc, neck: n0, hip: h0, dir, x: h0.x };
};

const tether = [el('path', { class: 'tether' }, L.figs), el('path', { class: 'tether' }, L.figs)];

const ME = makeFigure('me');
const HER = makeFigure('her');
const EXTRAS = Array.from({ length: 10 }, () => makeFigure('other'));
// others are drawn behind the two of us
EXTRAS.forEach((f) => L.figs.insertBefore(f.g, L.figs.firstChild));

/* ================================================================== */
/* little drawings                                                     */
/* ================================================================== */

const D = {
  table: (x, w = 44, h = 26) =>
    `<path class="prop" d="M${x - w / 2} ${-h} H${x + w / 2} M${x} ${-h} V0 M${x - 8} 0 H${x + 8}"/>`,
  longTable: (x0, x1, h = 26) =>
    `<path class="prop" d="M${x0} ${-h} H${x1} M${x0 + 10} ${-h} V0 M${x1 - 10} ${-h} V0"/>`,
  chair: (x, dir) =>
    `<path class="prop faint" d="M${x - 7} -13 H${x + 7} M${x - 7 * dir} -13 V-34 M${x - 5} -13 V0 M${x + 5} -13 V0"/>`,
  lamp: (x, top, y) =>
    `<path class="prop prop-soft" d="M${x} ${top} V${y - 10}"/>` +
    `<path class="prop" d="M${x - 11} ${y} Q${x} ${y - 16} ${x + 11} ${y} Z"/>` +
    `<path class="halo" d="M${x - 9} ${y + 2} L${x - 32} ${y + 58} M${x + 9} ${y + 2} L${x + 32} ${y + 58} M${x - 3} ${y + 4} L${x - 10} ${y + 56} M${x + 3} ${y + 4} L${x + 10} ${y + 56}"/>`,
  laptop: (x, y, dir) => `<path class="prop" d="M${x} ${y} h${16 * dir} l${4 * dir} -12"/>`,
  bed: (x, headDir) => {
    const h = x + 38 * headDir;
    return `<path class="prop" d="M${x - 38} -12 H${x + 38} V-18 H${x - 38} Z M${x - 36} -12 V0 M${x + 36} -12 V0 M${h} -12 V-36"/>` +
      `<ellipse class="prop" cx="${x + 27 * headDir}" cy="-21" rx="7" ry="3"/>`;
  },
  room: (x0, x1, h = 130) => `<path class="prop faint" d="M${x0} 0 V${-h} H${x1} V0"/>`,
  window: (x, y, w, h) =>
    `<path class="prop prop-soft" d="M${x - w / 2} ${y - h / 2} h${w} v${h} h${-w} Z M${x} ${y - h / 2} v${h} M${x - w / 2} ${y} h${w}"/>`,
  moon: (x, y, r) =>
    `<path class="prop paper" d="M${x} ${y - r} A${r} ${r} 0 1 0 ${x} ${y + r} A${r * 0.78} ${r * 0.78} 0 1 1 ${x} ${y - r} Z"/>`,
  sun: (r = 18) => {
    let s = `<circle class="prop paper" cx="0" cy="0" r="${r}"/>`;
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      s += `<line class="prop" x1="${f1(Math.cos(a) * (r + 6))}" y1="${f1(Math.sin(a) * (r + 6))}" x2="${f1(Math.cos(a) * (r + 12))}" y2="${f1(Math.sin(a) * (r + 12))}"/>`;
    }
    return s;
  },
  tree: (x, y, h) =>
    `<path class="prop prop-soft" d="M${f1(x)} ${f1(y)} V${f1(y - h * 0.28)}"/>` +
    `<path class="prop" d="M${f1(x - h * 0.28)} ${f1(y - h * 0.28)} L${f1(x)} ${f1(y - h)} L${f1(x + h * 0.28)} ${f1(y - h * 0.28)} Z"/>`,
  palm: (x, h = 90) =>
    `<path class="prop" d="M${x} 0 C${x + 4} ${-h * 0.4} ${x - 6} ${-h * 0.7} ${x + 2} ${-h}"/>` +
    `<path class="prop" d="M${x + 2} ${-h} q-20 -6 -34 10 M${x + 2} ${-h} q20 -8 34 8 M${x + 2} ${-h} q-8 -16 -26 -14 M${x + 2} ${-h} q10 -16 28 -12 M${x + 2} ${-h} q2 -12 -2 -22"/>`,
  building: (x0, x1, top, cols = 3, rows = 5, skip = []) => {
    let s = `<path class="prop" d="M${x0} 0 V${top} H${x1} V0"/>`;
    const w = (x1 - x0) / cols;
    const h = -top / (rows + 0.6);
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        if (skip.includes(`${c},${r}`)) continue;
        const wx = x0 + c * w + w * 0.28;
        const wy = top + h * 0.5 + r * h;
        s += `<rect class="prop prop-soft" x="${f1(wx)}" y="${f1(wy)}" width="${f1(w * 0.44)}" height="${f1(h * 0.5)}"/>`;
      }
    }
    return s;
  },
  gift: (w, h) =>
    `<rect class="prop paper" x="${-w / 2}" y="${-h}" width="${w}" height="${h}"/>` +
    `<path class="prop" d="M0 0 V${-h} M${-w / 2} ${-h * 0.55} H${w / 2} M0 ${-h} q-6 -7 -8 -1 q4 3 8 1 q6 -7 8 -1 q-4 3 -8 1"/>`,
  balloon: (r = 7, string = 34) =>
    `<ellipse class="prop paper" cx="0" cy="${-string - r}" rx="${r * 0.85}" ry="${r}"/>` +
    `<path class="prop prop-soft" d="M0 ${-string} q-4 ${string * 0.35} 2 ${string * 0.6} q4 ${string * 0.25} -2 ${string * 0.4}"/>`,
  bouquet: (s = 1) => {
    const flowers = [[-6, -22], [0, -27], [6, -22], [-3, -17], [4, -16], [-9, -15], [9, -14]];
    let out = `<path class="prop" d="M0 0 L${-7 * s} ${-12 * s} M0 0 L${7 * s} ${-12 * s} M0 0 V${-14 * s}"/>`;
    out += `<path class="prop paper" d="M${-3 * s} ${-2 * s} L${-10 * s} ${-14 * s} L${10 * s} ${-14 * s} L${3 * s} ${-2 * s} Z"/>`;
    flowers.forEach(([fx, fy]) => {
      out += `<circle class="prop paper" cx="${f1(fx * s)}" cy="${f1(fy * s)}" r="${f1(3.4 * s)}"/><circle class="fill" cx="${f1(fx * s)}" cy="${f1(fy * s)}" r="${f1(1 * s)}"/>`;
    });
    return out;
  },
  cloud: (x, y, w) =>
    `<path class="prop paper" d="M${x - w / 2} ${y} q${-w * 0.08} ${-w * 0.22} ${w * 0.16} ${-w * 0.2} q${w * 0.08} ${-w * 0.3} ${w * 0.34} ${-w * 0.16} q${w * 0.2} ${-w * 0.2} ${w * 0.36} ${w * 0.08} q${w * 0.18} ${w * 0.04} ${w * 0.12} ${w * 0.28} Z"/>`,
  sign: (x, y, text, w) =>
    `<rect class="prop paper" x="${x - w / 2}" y="${y - 10}" width="${w}" height="20" rx="2"/>` +
    `<text class="sign" x="${x}" y="${y + 3.6}" text-anchor="middle">${text}</text>`,
  note: () =>
    `<ellipse class="fill" cx="0" cy="0" rx="3" ry="2.2" transform="rotate(-20)"/><path class="prop" d="M2.6 -0.6 V-12 q4 2 5 6"/>`,
  phone: () => `<rect class="fill" x="-1.6" y="-4" width="3.2" height="8" rx="1"/>`,
  ring: () => `<path class="prop" d="M-6 -6 a8 8 0 0 0 0 12 M6 -6 a8 8 0 0 1 0 12 M-10 -9 a13 13 0 0 0 0 18 M10 -9 a13 13 0 0 1 0 18"/>`,
  bag: () => `<path class="prop paper" d="M-4 0 L-5 -10 L-3 -11 L-1 -10 L1 -11 L3 -10 L5 -11 L4 0 Z"/>`,
  glass: () => `<path class="prop paper" d="M-3 0 L-4 -10 L4 -10 L3 0 Z"/><path class="prop prop-soft" d="M-3.6 -6 H3.6 M1 -10 L4 -15"/>`,
  burst: (r1, r2, n = 8) => {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2;
      s += `<line class="prop" x1="${f1(Math.cos(a) * r1)}" y1="${f1(Math.sin(a) * r1)}" x2="${f1(Math.cos(a) * r2)}" y2="${f1(Math.sin(a) * r2)}"/>`;
    }
    return s;
  },
  rain: (x0, x1, y0, n, seed) => {
    const rnd = seeded(seed);
    let s = '';
    for (let i = 0; i < n; i += 1) {
      const x = lerp(x0, x1, rnd());
      const y = y0 + rnd() * 60;
      s += `<line class="rain" style="--delay:${f1(-rnd() * 0.7)}s" x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - 2)}" y2="${f1(y + 9)}"/>`;
    }
    return s;
  },
};

// a small speech bubble: a rounded box with a tail pointing down at whoever is speaking
const makeBubble = (parent) => {
  const g = el('g', { opacity: 0 }, parent);
  const box = el('path', { class: 'bubble' }, g);
  const text = el('text', { class: 'bubble-text', 'text-anchor': 'middle' }, g);
  return { g, box, text, last: '' };
};
const setBubble = (b, x, y, str, show) => {
  if (!show || show < 0.02 || !str) return op(b.g, 0);
  if (b.last !== str) {
    b.text.textContent = str;
    b.last = str;
  }
  const w = str.length * 4.6 + 14;
  const h = 15;
  const l = -w / 2;
  const top = -h - 5;
  b.box.setAttribute('d', `M${l + 4} ${top} H${-l - 4} Q${-l} ${top} ${-l} ${top + 4} V${top + h - 4} Q${-l} ${top + h} ${-l - 4} ${top + h} H4 L0 0 L-4 ${top + h} H${l + 4} Q${l} ${top + h} ${l} ${top + h - 4} V${top + 4} Q${l} ${top} ${l + 4} ${top} Z`);
  b.text.setAttribute('x', 0);
  b.text.setAttribute('y', f1(top + h / 2 + 3));
  put(b.g, x, y);
  op(b.g, show);
};
// who is talking, and what they say, as a call goes on: alternates between us
const callTalk = (t, a, b, lines) => {
  if (t < a || t > b) return null;
  const k = (t - a) / (b - a);
  const n = lines.length;
  const i = Math.min(n - 1, Math.floor(k * n));
  const local = k * n - i;
  return { line: lines[i], who: i % 2, show: smooth(0.05, 0.2, local) * (1 - smooth(0.8, 0.95, local)) };
};
const showCallBubble = (b, c, talk, lift = 26) => {
  if (!talk || !c.active || !c.me || !c.her) return op(b.g, 0);
  const f = talk.who === 0 ? c.me : c.her;
  setBubble(b, f.head.x, f.head.y - lift, talk.line, talk.show);
};

// a path that draws itself (it needs pathLength="1")
const draw = (n, k) => n.setAttribute('stroke-dashoffset', o3(1 - k));

// two phones and the line between them while we talk
function phoneLink(r, c, on, t) {
  if (!on || !c.me || !c.her) {
    op(r.link, 0);
    r.phones.forEach((p) => op(p, 0));
    return;
  }
  const a = c.me.hand;
  const b = c.her.hand;
  put(r.phones[0], a.x, a.y);
  put(r.phones[1], b.x, b.y);
  r.phones.forEach((p) => op(p, 1));
  const n = 40;
  let d = '';
  for (let i = 0; i <= n; i += 1) {
    const k = i / n;
    const x = lerp(a.x, b.x, k);
    const y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 40 + Math.sin(k * 30 - t * 260) * 3 * Math.sin(k * Math.PI);
    d += `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`;
  }
  r.link.setAttribute('d', d);
  op(r.link, 1);
}

const nightSky = (A, g, seed) => {
  const rnd = seeded(seed);
  let s = '';
  for (let i = 0; i < 16; i += 1) s += `<circle class="fill" cx="${f1(A - 260 + rnd() * 520)}" cy="${f1(-90 - rnd() * 200)}" r="${f1(0.8 + rnd())}"/>`;
  return group(g.sky, s);
};

/* ================================================================== */
/* a few more poses and little things for this story                   */
/* ================================================================== */

const CARRY = (p) => withArm(p, 1, 50, 40); // holding the painting in front of me
const HIPS = withArm(withArm(STAND, 0, -35, 95), 1, -35, 95);
const REACH_UP = withArm(withArm(STAND, 1, 150, 10), 0, 150, 10);
const CAMERA = withArm(withArm(STAND, 1, 98, -8), 0, 88, 12);
const KNEEL = pose(32, 80, 100, -10, 85, 12, 10, 40, 30);
const HOLD_LOW = withArm(STAND, 1, 40, 40);
const TO_FACE = withArm(STAND, 1, 110, 70);
const chat = (t, o, base = SIT) => withArm(base, 1, lerp(45, 90, cyc(t, 6, o)), 40);
const standClap = (k) => withArm(withArm(STAND, 0, 62, lerp(55, 85, k)), 1, 62, lerp(85, 55, k));
const LAUGH_ME = withArm(withLean(SIT, -8), 1, 35, 95);
const LAUGH_HER = withArm(eat(1), 0, 30, 70);
const CLINK = withArm(withLean(SIT, 12), 1, 88, -14);
const FULL = withArm(withLean(SIT, -10), 1, 15, 75);

// little laugh lines beside a head
const makeLaugh = (parent) => group(parent, '<path class="prop" d="M7 -5 l5 -3 M8 0 h6 M7 5 l5 3"/>', { opacity: 0 });
const showLaugh = (n, f, k) => {
  if (!f || k < 0.02) return op(n, 0);
  n.setAttribute('transform', `translate(${f1(f.head.x)} ${f1(f.head.y)}) scale(${-f.dir} 1)`);
  op(n, k);
};

// the paintings from Dot
const circ = (cx, cy, r) => `M${f1(cx - r)} ${f1(cy)} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
const petals = (cx, cy, d, r, n = 6) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return circ(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r);
  }).join(' ');
const ART = {
  // mine: a flower in a little vase, and a sun in the corner
  flower: [
    'M-6 15 L-4.5 6 H4.5 L6 15 Z',
    'M0 6 Q-1.5 0 0 -5',
    'M-0.5 1 q-6 -1 -8 -5 q6 -1 8 3',
    petals(0, -8.5, 3.6, 2.1),
    circ(0, -8.5, 1.4),
    circ(12.5, -10.5, 2.8),
  ],
  // hers: hills, the sun, two birds
  hills: [
    'M-20 9 Q-10 -1 -2 7 T20 2',
    'M-20 14 Q-4 8 20 12',
    circ(8, -7, 4),
    'M-14 -9 q2 -2 4 0 q2 -2 4 0 M-4 -12 q1.5 -1.5 3 0 q1.5 -1.5 3 0',
  ],
};
const artOn = (parent, kind, x, y, drawn) => {
  const g = group(parent, '<rect class="prop paper" x="-20" y="-17" width="40" height="34"/>');
  put(g, x, y);
  const parts = ART[kind].map((d) => el('path', drawn ? { class: 'draw', pathLength: 1, d } : { class: 'prop', d }, g));
  return { g, parts };
};

// one flower, for the very end
const oneFlower = () => {
  let s = '<path class="prop" d="M0 0 Q1.5 -7 0 -13 M0.5 -6 q5 -1 6 -5 q-4 0 -6 3"/>';
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    s += `<circle class="prop paper" cx="${f1(Math.cos(a) * 3.2)}" cy="${f1(-16.5 + Math.sin(a) * 3.2)}" r="2.6"/>`;
  }
  return s + '<circle class="fill" cx="0" cy="-16.5" r="1.4"/>';
};

/* ---------- tracking: each step shows up as a page in Vercel Analytics ---------- */
const sent = {};
const track = (path) => {
  if (sent[path]) return;
  sent[path] = true;
  if (typeof window.va === 'function') window.va('pageview', { path });
};

/* ================================================================== */
/* the scenes, in order                                                */
/* ================================================================== */

const SCENES = [];
const scene = (s) => SCENES.push(s) - 1; // returns its index
// sit down at the start of a scene, stand up again near its end
const seated = (t, P, a = 0.12, b = 0.88, d = 0.12) => mix(STAND, P, smooth(0, a, t) * (1 - smooth(b, b + d, t)));
const at = (x, dir, p, extra = {}) => ({ x, dir, pose: p, ...extra });
const lying = (t) => smooth(0.04, 0.12, t) * (1 - smooth(0.88, 0.96, t)) > 0.5;
const blink = (t) => 1 - pulse(0.03, 0.13, t) * 0.8 - pulse(0.87, 0.97, t) * 0.8;

// 0. before: two people on the same line, far apart
scene({
  len: 360,
  w: 0.8,
  view: { w: 560, h: 240 },
  act: (t, A) => ({ me: at(A - 130, 1, STAND), her: at(A + 130, 1, STAND) }),
});

// 1. Benediction: I got there first and waited, with flowers for her
scene({
  key: 'benediction',
  slow: [[0.3, 0.6, 2.4]],
  len: 640,
  w: 1.7,
  view: { w: 560, h: 280, dx: 50, dy: -70 },
  build(A, g) {
    let s = `<path class="prop" d="M${A - 100} -160 H${A + 100}"/>`;
    for (let i = 0; i < 10; i += 1) {
      const x = A - 100 + i * 20;
      s += `<path class="prop ${i % 2 ? 'prop-soft' : ''}" d="M${x} -160 V-140 q10 10 20 0 V-160"/>`;
    }
    s += `<path class="prop prop-soft" d="M${A - 100} -160 V0 M${A + 100} -160 V0"/>`;
    s += D.sign(A, -178, 'BENEDICTION', 110);
    s += D.window(A, -100, 90, 44);
    s += D.table(A, 40) + D.chair(A - 40, 1) + D.chair(A + 40, -1);
    group(g.back, s);
    [A - 15, A + 15].forEach((x) => put(group(g.back, D.glass()), x, -26));
    const flowers = group(g.front, D.bouquet(0.75));
    const laughs = [makeLaugh(g.front), makeLaugh(g.front)];
    return { flowers, laughs, A };
  },
  act(t, A) {
    // me: already sat at the table, waiting for her
    let mx = A - 40;
    let mdir = 1;
    let meP;
    const laugh = window01(0.76, 0.86, t, 0.02);
    if (t < 0.3) meP = withArm(SIT, 1, lerp(40, 55, cyc(t, 3)), 50);
    else if (t < 0.34) meP = mix(SIT, withArm(STAND, 1, 50, 60), smooth(0.3, 0.34, t));
    else if (t < 0.42) {
      mx = lerp(A - 40, A + 18, smooth(0.34, 0.42, t));
      meP = withArm(walk(mx * STR), 1, 50, 60);
    } else if (t < 0.56) {
      mx = A + 18;
      meP = t < 0.48 ? mix(withArm(STAND, 1, 50, 60), GIVE, smooth(0.42, 0.46, t)) : mix(GIVE, STAND, smooth(0.5, 0.55, t));
    } else if (t < 0.64) {
      const k = smooth(0.56, 0.64, t);
      mx = lerp(A + 18, A - 40, k);
      mdir = k < 0.97 ? -1 : 1;
      meP = walk(mx * STR);
    } else {
      const sit = smooth(0.64, 0.68, t) * (1 - smooth(0.9, 0.96, t));
      meP = mix(STAND, mix(chat(t, 0), LAUGH_ME, laugh), sit);
    }

    // her: walks in, takes the flowers, holds them up to her face, and sits with me
    let hx = A + 70;
    let herP = STAND;
    let hnod = 0;
    if (t < 0.3) {
      const k = smooth(0.04, 0.28, t);
      hx = lerp(A + 250, A + 70, k);
      herP = k > 0 && k < 1 ? walk(hx * STR + 1.4) : STAND;
    } else if (t < 0.48) herP = mix(STAND, GIVE, smooth(0.43, 0.47, t));
    else if (t < 0.6) {
      herP = mix(mix(GIVE, TO_FACE, smooth(0.48, 0.52, t)), HOLD_LOW, smooth(0.56, 0.6, t));
      hnod = 12 * window01(0.5, 0.58, t);
    } else {
      const k = smooth(0.6, 0.66, t);
      hx = lerp(A + 70, A + 40, k);
      const sit = smooth(0.64, 0.68, t) * (1 - smooth(0.9, 0.96, t));
      let base = k > 0 && k < 1 ? walk(hx * STR + 1.4) : STAND;
      if (t < 0.64) base = withArm(base, 1, 40, 40);
      herP = mix(base, mix(chat(t, 2), LAUGH_HER, laugh), sit);
    }
    const bob = (o) => laugh * Math.abs(Math.sin(t * 90 + o)) * 1.5;
    return {
      me: at(mx, mdir, meP, { lift: bob(0) }),
      her: at(hx, -1, herP, { nod: hnod, lift: bob(1.3) }),
      laugh,
    };
  },
  update(t, r, c) {
    const A = r.A;
    const start = { x: A - 4, y: -26 };
    const end = { x: A + 6, y: -26 };
    showLaugh(r.laughs[0], c.active && c.me, c.state.laugh || 0);
    showLaugh(r.laughs[1], c.active && c.her, c.state.laugh || 0);
    if (!c.active || !c.me || !c.her) {
      const p = t < 0.5 ? start : end;
      return put(r.flowers, p.x, p.y);
    }
    let x;
    let y;
    let rot = 0;
    if (t < 0.33) ({ x, y } = start);
    else if (t < 0.45) {
      const k = smooth(0.33, 0.36, t);
      x = lerp(start.x, c.me.hand.x, k);
      y = lerp(start.y, c.me.hand.y + 4, k);
      rot = 10 * k;
    } else if (t < 0.6) {
      const k = smooth(0.45, 0.48, t);
      x = lerp(c.me.hand.x, c.her.hand.x, k);
      y = lerp(c.me.hand.y, c.her.hand.y, k) + 4;
      rot = lerp(10, -10, k);
    } else {
      const k = smooth(0.62, 0.66, t);
      x = lerp(c.her.hand.x, end.x, k);
      y = lerp(c.her.hand.y + 4, end.y, k);
      rot = lerp(-10, 0, k);
    }
    put(r.flowers, x, y, rot);
  },
});

// 2. the art gallery: I took her pictures in front of the paintings
const GAL_STOPS = [[0.06, 0.28], [0.38, 0.6], [0.7, 0.92]];
const GAL_POSES = [
  withArm(withArm(STAND, 1, 165, 0), 0, -10, 20), // pointing up at it
  withArm(withArm(STAND, 0, -35, 95), 1, 130, -70), // hand on her hip
  pose(-4, 8, 4, -8, 4, -80, 10, 95, 10), // ta-da
];
const GAL_SNAPS = GAL_STOPS.flatMap(([a, b]) => [a + (b - a) * 0.45, a + (b - a) * 0.72]);
const galStop = (t) => smooth(GAL_STOPS[0][1], GAL_STOPS[1][0], t) + smooth(GAL_STOPS[1][1], GAL_STOPS[2][0], t);
scene({
  key: 'gallery',
  slow: [[0.04, 0.94, 1.4]],
  len: 860,
  w: 2.2,
  build(A, g) {
    let s = `<path class="prop prop-soft" d="M${A - 440} -205 H${A + 440}"/>`;
    const frame = (x, y, w, h) =>
      `<rect class="prop paper" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}"/>` +
      `<rect class="prop prop-soft" x="${x - w / 2 + 4}" y="${y - h / 2 + 4}" width="${w - 8}" height="${h - 8}"/>`;
    const spot = (x, yTop) =>
      `<path class="prop" d="M${x} -205 v6 M${x - 5} -199 h10 l-2 5 h-6 Z"/>` +
      `<path class="halo" d="M${x - 3} -192 L${x - 26} ${yTop - 4} M${x + 3} -192 L${x + 26} ${yTop - 4}"/>`;
    // circles
    s += spot(A - 250, -144) + frame(A - 250, -118, 70, 52);
    s += `<circle class="prop" cx="${A - 262}" cy="-122" r="11"/><circle class="fill faint" cx="${A - 236}" cy="-110" r="6"/><path class="prop prop-soft" d="M${A - 278} -100 L${A - 222} -134"/>`;
    // a face
    s += spot(A, -155) + frame(A, -122, 50, 66);
    s += `<ellipse class="prop" cx="${A}" cy="-124" rx="11" ry="15"/><circle class="fill" cx="${A - 4}" cy="-128" r="1.3"/><circle class="fill" cx="${A + 5}" cy="-126" r="1.3"/><path class="prop" d="M${A + 1} -126 l-3 8 h4 M${A - 4} -113 q4 3 8 0"/>`;
    // the sea
    s += spot(A + 250, -141) + frame(A + 250, -116, 80, 50);
    s += `<path class="prop" d="M${A + 216} -108 q8.5 -7 17 0 t17 0 t17 0 t17 0 M${A + 216} -100 q8.5 -7 17 0 t17 0 t17 0 t17 0"/><circle class="prop" cx="${A + 272}" cy="-125" r="6"/>`;
    // little plaques beside each, and benches
    s += [[-250, 70], [0, 50], [250, 80]].map(([dx, w]) => `<rect class="prop prop-soft" x="${A + dx + w / 2 + 8}" y="-112" width="10" height="7"/>`).join('');
    s += `<path class="prop prop-soft" d="M${A + 100} -12 H${A + 150} M${A + 104} -12 V0 M${A + 146} -12 V0 M${A - 150} -12 H${A - 100} M${A - 146} -12 V0 M${A - 104} -12 V0"/>`;
    group(g.back, s);
    const phone = group(g.front, D.phone());
    const flash = group(g.front, D.burst(5, 11, 8));
    return { phone, flash };
  },
  act(t, A) {
    const k = galStop(t);
    const moving = (t > GAL_STOPS[0][1] && t < GAL_STOPS[1][0]) || (t > GAL_STOPS[1][1] && t < GAL_STOPS[2][0]);
    const hx = A - 250 + 250 * k + 6;
    const mx = hx - 96;
    const i = clamp(Math.round(k), 0, 2);
    const [a, b] = GAL_STOPS[i];
    const posing = window01(a + 0.02, b - 0.02, t, 0.04);
    const shoot = window01(a + 0.04, b - 0.04, t, 0.03);
    return {
      me: at(mx, 1, moving ? walk(mx * STR) : mix(STAND, CAMERA, shoot)),
      her: at(hx, moving || posing < 0.05 ? 1 : -1, moving ? walk(hx * STR + 1.4) : mix(STAND, GAL_POSES[i], posing), { nod: i === 1 ? -8 * posing : 0 }),
      extras: [
        at(A - 400, 1, withArm(STAND, 0, 30, 60), { nod: -12 }),
        at(A + 395, -1, withArm(STAND, 1, 20, 30), { nod: -12, hair: true }),
      ],
      shoot,
    };
  },
  cam(t, A, s) {
    return { x: (s.me.x + s.her.x) / 2 + 8, y: -100, w: 500, h: 300 };
  },
  update(t, r, c) {
    if (!c.active || !c.me) {
      op(r.phone, 0);
      op(r.flash, 0);
      return;
    }
    put(r.phone, c.me.hand.x, c.me.hand.y, 90);
    op(r.phone, smooth(0.3, 0.7, c.state.shoot || 0));
    put(r.flash, c.me.hand.x, c.me.hand.y);
    op(r.flash, Math.max(...GAL_SNAPS.map((m) => pulse(m - 0.012, m + 0.012, t))));
  },
});

// 3. Dot: we painted, side by side, and I took mine with me
const T_LIFT = 0.9;
const DOT_I = scene({
  key: 'dot',
  slow: [[0.78, 1, 1.6]],
  len: 520,
  w: 1.6,
  view: { w: 480, h: 280, dx: 10, dy: -70 },
  build(A, g) {
    const easel = (x) => `<path class="prop" d="M${x - 13} 0 L${x - 5} -29 M${x + 13} 0 L${x + 5} -29 M${x} -63 V-70 M${x - 23} -29 H${x + 23}"/>`;
    let s = D.lamp(A + 35, -240, -150);
    s += D.sign(A - 130, -150, 'DOT', 56);
    s += `<path class="prop prop-soft" d="M${A - 190} 0 l-6 -18 h20 l-6 18 Z M${A - 186} -18 q-10 -16 -2 -30 M${A - 186} -18 q10 -14 6 -26"/>`;
    s += `<path class="prop prop-soft" d="M${A + 150} -26 H${A + 200} M${A + 155} -26 V0 M${A + 195} -26 V0 M${A + 160} -26 v-6 h8 v6 M${A + 174} -26 v-8 h8 v8 M${A + 188} -26 v-5 h6 v5"/>`;
    s += easel(A - 18) + easel(A + 92);
    group(g.back, s);
    const mine = artOn(g.back, 'flower', A - 18, -46, true);
    const hers = artOn(g.back, 'hills', A + 92, -46, true);
    const PAL = '<path class="prop paper" d="M-7 0 q0 -6 7 -6 q8 0 8 5 q0 4 -5 3 q-3 0 -3 3 q-2 2 -7 -5 Z"/><circle class="fill" cx="-2" cy="-3" r="1"/><circle class="fill" cx="2" cy="-4" r="1"/>';
    const palettes = [group(g.front, PAL), group(g.front, PAL)];
    return { mine, hers, palettes };
  },
  act(t, A) {
    const on = window01(0.06, 0.8, t);
    const look = window01(0.8, 0.9, t, 0.03);
    let meP = mix(STAND, withArm(paint(cyc(t, 5), STAND), 0, 50, 40), on);
    let herP = mix(STAND, withArm(paint(cyc(t, 7, 1), STAND), 0, 50, 40), on);
    // she turns round to see mine, and claps
    herP = mix(herP, standClap(cyc(t, 10)), look);
    if (t > T_LIFT - 0.02) meP = mix(meP, CARRY(STAND), smooth(T_LIFT - 0.02, T_LIFT, t));
    return {
      me: at(A - 50, 1, meP, { nod: -6 * look }),
      her: at(A + 60, look > 0.1 ? -1 : 1, herP),
    };
  },
  update(t, r, c) {
    const nM = r.mine.parts.length;
    r.mine.parts.forEach((p, i) => draw(p, smooth(0.1 + (i * 0.62) / nM, 0.1 + ((i + 1) * 0.62) / nM, t)));
    const nH = r.hers.parts.length;
    r.hers.parts.forEach((p, i) => draw(p, smooth(0.12 + (i * 0.6) / nH, 0.12 + ((i + 1) * 0.6) / nH, t)));
    op(r.mine.g, t < T_LIFT ? 1 : 0);
    [c.me, c.her].forEach((f, i) => {
      if (!c.active || !f) return op(r.palettes[i], 0);
      put(r.palettes[i], f.handFar.x, f.handFar.y);
      op(r.palettes[i], window01(0.04, 0.82, t, 0.03));
    });
  },
});

// 4. my office: I put it up on my wall, took a picture, and sent it to her
const T_HANG = [0.2, 0.28];
const OFFICE_I = scene({
  key: 'office',
  slow: [[0.14, 0.34, 1.8], [0.52, 0.9, 1.5]],
  len: 720,
  w: 1.9,
  view: { w: 780, h: 320, dy: -100 },
  build(A, g) {
    let s = D.room(A - 340, A + 10, 170);
    s += D.window(A - 285, -112, 48, 40);
    s += `<path class="prop prop-soft" d="M${A - 305} -94 v-10 h6 v-6 h6 v16 M${A - 290} -94 v-14 h8 v14 M${A - 276} -94 v-8 h6 v8"/>`;
    s += D.table(A - 60, 48) + D.chair(A - 98, 1) + D.laptop(A - 78, -26, 1);
    s += `<path class="prop prop-soft" d="M${A - 20} 0 l-5 -16 h18 l-5 16 Z M${A - 16} -16 q-8 -14 -2 -26 M${A - 16} -16 q8 -12 5 -22"/>`;
    // her place, across the way
    s += D.room(A + 160, A + 350, 140);
    s += `<path class="prop" d="M${A + 215} 0 V-28 Q${A + 215} -34 ${A + 221} -34 H${A + 289} Q${A + 295} -34 ${A + 295} -28 V0 M${A + 215} -14 H${A + 295}"/>`;
    s += `<path class="prop prop-soft" d="M${A + 325} 0 V-80 M${A + 315} -80 h20 l-4 -12 h-12 Z"/>`;
    group(g.back, s);
    const wall = artOn(g.back, 'flower', A - 170, -100, false);
    el('path', { class: 'prop prop-soft', d: 'M-14 -17 L0 -26 L14 -17' }, wall.g);
    el('circle', { class: 'fill', cx: 0, cy: -26, r: 1.3 }, wall.g);
    const phone = group(g.front, D.phone());
    const herPhone = group(g.front, D.phone());
    const flash = group(g.front, D.burst(5, 11, 8));
    const ring = group(g.front, D.ring());
    const dots = Array.from({ length: 12 }, () => el('circle', { class: 'fill', r: 1.6 }, g.back));
    return { wall, phone, herPhone, flash, ring, dots };
  },
  act(t, A) {
    let mx = A - 250;
    let mdir = 1;
    let meP = STAND;
    let nod = 0;
    let shoot = 0;
    let send = 0;
    if (t < 0.16) {
      const k = smooth(0.02, 0.15, t);
      mx = lerp(A - 320, A - 196, k);
      meP = CARRY(k > 0 && k < 1 ? walk(mx * STR) : STAND);
    } else if (t < 0.32) {
      mx = A - 196;
      const up = window01(0.16, 0.32, t, 0.04);
      meP = mix(t < 0.24 ? CARRY(STAND) : STAND, REACH_UP, up);
      nod = -14 * up;
    } else if (t < 0.4) {
      const k = smooth(0.32, 0.4, t);
      mx = lerp(A - 196, A - 250, k);
      mdir = k > 0.02 && k < 0.98 ? -1 : 1;
      meP = k > 0 && k < 1 ? walk(mx * STR) : STAND;
    } else if (t < 0.52) {
      // stand back and look at it, hands on my hips
      meP = mix(STAND, HIPS, window01(0.4, 0.52, t, 0.03));
      nod = -10;
    } else if (t < 0.72) {
      shoot = window01(0.52, 0.62, t, 0.02);
      send = window01(0.62, 0.72, t, 0.02);
      meP = mix(mix(STAND, CAMERA, shoot), withArm(STAND, 1, 60, 90), send);
      nod = 6 * send;
    } else {
      // and back to work
      const k = smooth(0.72, 0.8, t);
      mx = lerp(A - 250, A - 98, k);
      const sit = smooth(0.8, 0.84, t) * (1 - smooth(0.93, 0.98, t));
      meP = k > 0 && k < 1 ? walk(mx * STR) : mix(STAND, type(cyc(t, 10)), sit);
    }
    const buzz = window01(0.66, 0.74, t, 0.01);
    const look = smooth(0.7, 0.74, t) * (1 - smooth(0.9, 0.94, t));
    const happy = window01(0.78, 0.86, t, 0.02);
    const herP = seated(t, mix(withArm(SIT, 1, 30, 60), SIT_PHONE, look), 0.06, 0.92, 0.05);
    return {
      me: at(mx, mdir, meP, { nod }),
      her: at(A + 250, -1, herP, { nod: 8 * look, lift: happy * Math.abs(Math.sin(t * 120)) * 3 }),
      shoot,
      send,
      buzz,
    };
  },
  update(t, r, c) {
    op(r.wall.g, t >= T_HANG[1] ? 1 : 0);
    if (!c.active || !c.me || !c.her) {
      [r.phone, r.herPhone, r.flash, r.ring, ...r.dots].forEach((n) => op(n, 0));
      return;
    }
    const s = c.state;
    put(r.phone, c.me.hand.x, c.me.hand.y, s.shoot > s.send ? 90 : 0);
    op(r.phone, smooth(0.3, 0.7, Math.max(s.shoot, s.send)));
    put(r.flash, c.me.hand.x, c.me.hand.y);
    op(r.flash, pulse(0.565, 0.585, t));
    put(r.herPhone, c.her.hand.x, c.her.hand.y);
    op(r.herPhone, smooth(0.66, 0.7, t) * (1 - smooth(0.9, 0.94, t)));
    put(r.ring, c.her.hand.x, c.her.hand.y, 0, 0.7 + 0.15 * Math.sin(t * 300));
    op(r.ring, s.buzz * (0.5 + 0.5 * Math.sin(t * 300)));
    // the picture on its way to her
    const k = window01(0.63, 0.71, t, 0.015);
    r.dots.forEach((d, i) => {
      const u = (t * 30 + i / r.dots.length) % 1;
      d.setAttribute('cx', f1(lerp(c.me.hand.x, c.her.hand.x, u)));
      d.setAttribute('cy', f1(lerp(c.me.hand.y, c.her.hand.y, u) - Math.sin(u * Math.PI) * 60));
      op(d, k * Math.sin(u * Math.PI) * 0.8);
    });
  },
});

// 5. a car ride through the city at night, music on
const carX = (t, A) => lerp(A - 700, A + 700, ease(smooth(0.06, 0.94, t)));
scene({
  key: 'drive',
  slow: [[0.1, 0.9, 1.2]],
  len: 1500,
  w: 2.3,
  build(A, g) {
    const rnd = seeded(97);
    let s = '';
    let x = A - 880;
    while (x < A + 880) {
      const w = 50 + rnd() * 50;
      const h = 70 + rnd() * 130;
      s += `<path class="prop faint" d="M${f1(x)} 0 V${f1(-h)} H${f1(x + w)} V0"/>`;
      for (let wy = -h + 12; wy < -18; wy += 16) {
        for (let wx = x + 8; wx < x + w - 12; wx += 14) {
          if (rnd() < 0.24) s += `<rect class="fill faint" x="${f1(wx)}" y="${f1(wy)}" width="6" height="8"/>`;
        }
      }
      x += w + 6 + rnd() * 24;
    }
    for (let lx = A - 820; lx < A + 860; lx += 260) {
      s += `<path class="prop prop-soft" d="M${lx} 0 V-96 q0 -6 8 -6 h6"/><path class="prop" d="M${lx + 12} -102 h10 l-2 4 h-6 Z"/>`;
      s += `<path class="halo" d="M${lx + 14} -97 L${lx - 4} -2 M${lx + 20} -97 L${lx + 38} -2"/>`;
    }
    group(g.back, s);
    let stars = '';
    for (let i = 0; i < 46; i += 1) stars += `<circle class="fill" cx="${f1(A - 900 + rnd() * 1800)}" cy="${f1(-220 - rnd() * 120)}" r="${f1(0.7 + rnd())}"/>`;
    group(g.sky, stars);
    const moon = group(g.sky, D.moon(0, 0, 14));
    const car = group(g.front, `
      <path class="prop paper" d="M-50 -8 V-26 Q-48 -32 -38 -33 L48 -31 Q54 -29 54 -18 V-8 Z"/>
      <path class="prop" d="M-34 -33 L-24 -62 H16 L32 -32 M-4 -62 V-33"/>`);
    const wheels = [-30, 34].map((wx) => ({ w: group(car, '<circle class="prop paper" cx="0" cy="0" r="8"/><path class="prop" d="M-8 0 H8 M0 -8 V8"/>'), x: wx }));
    const notes = [0, 1, 2, 3].map(() => group(g.front, D.note()));
    return { moon, car, wheels, notes, A };
  },
  act(t, A) {
    const cx = carX(t, A);
    if (t <= 0.05 || t >= 0.95) {
      const edge = t <= 0.05 ? A - 700 : A + 700;
      const f = t <= 0.05 ? 1 - smooth(0.02, 0.05, t) : smooth(0.95, 0.98, t);
      return { me: at(edge + 14, 1, STAND, { show: f }), her: at(edge - 20, 1, STAND, { show: f }), cx };
    }
    const f = smooth(0.05, 0.08, t) * (1 - smooth(0.92, 0.95, t));
    // her arm out of the window to the music; both of us bopping along
    const herP = withArm(SIT, 1, lerp(70, 160, cyc(t, 10)), lerp(10, -20, cyc(t, 10)));
    return {
      me: at(cx, 1, STEER, { hip: { x: cx + 10, y: -24 }, show: f, nod: 6 * Math.sin(t * 160) }),
      her: at(cx - 26, 1, herP, { hip: { x: cx - 16, y: -24 }, show: f, sway: Math.sin(t * 80) * 2, nod: 8 * Math.sin(t * 160 + 1) }),
      cx,
    };
  },
  cam(t, A, s) {
    return { x: s.cx + 40, y: -80, w: 640, h: 320 };
  },
  update(t, r, c) {
    const cx = carX(t, r.A);
    put(r.car, cx, -Math.abs(Math.sin(t * 120)) * 0.8);
    r.wheels.forEach(({ w, x }) => put(w, x, -8, cx * 3));
    const camX = c.active && c.cam ? c.cam.x : cx + 40;
    put(r.moon, camX + 200, -230);
    r.notes.forEach((n, i) => {
      const k = (t * 16 + i / 4) % 1;
      put(n, cx - 14 + k * 30, -64 - k * 38, 0, 0.9);
      op(n, c.active && t > 0.1 && t < 0.9 ? Math.sin(k * Math.PI) : 0);
    });
  },
});

// 6. steak
scene({
  key: 'steak',
  slow: [[0.02, 0.26, 1.6]],
  len: 560,
  w: 1.6,
  view: { w: 480, h: 280, dy: -70 },
  build(A, g) {
    let s = D.lamp(A, -240, -140);
    s += D.table(A, 56) + D.chair(A - 44, 1) + D.chair(A + 44, -1);
    s += `<path class="prop prop-soft" d="M${A - 28} -26 V-15 M${A + 28} -26 V-15"/>`;
    // a shelf of bottles on the wall
    s += `<path class="prop prop-soft" d="M${A - 200} -120 H${A - 130} M${A - 200} -88 H${A - 130}"/>`;
    [-194, -184, -174, -160, -150, -140].forEach((dx, i) => {
      const y = i < 3 ? -120 : -88;
      s += `<path class="prop prop-soft" d="M${A + dx} ${y} v-12 q0 -3 2 -4 v-5 h2 v5 q2 1 2 4 v12"/>`;
    });
    s += `<rect class="prop paper" x="${A - 2}" y="-34" width="4" height="8"/>`;
    group(g.back, s);
    group(g.back, `<ellipse class="flame" cx="${A}" cy="-37.5" rx="1.4" ry="2.6"/>`);
    const STEAK = '<path class="prop paper" d="M-6 0 C-8 -3 -4 -5 0 -4.5 C4 -5 7 -3 6 0 Z"/><path class="prop prop-soft" d="M-3 -0.8 l2 -3 M0 -0.8 l2 -3 M3 -0.8 l1.5 -2.5"/>';
    const served = group(g.back, `<ellipse class="prop paper" cx="${A - 16}" cy="-27" rx="9" ry="1.8"/><ellipse class="prop paper" cx="${A + 16}" cy="-27" rx="9" ry="1.8"/>`);
    const steaks = [A - 16, A + 16].map((x) => ({ n: group(served, STEAK), x }));
    const tray = group(g.front, '<path class="prop" d="M-13 0 H13"/><path class="prop paper" d="M-10 -1 C-11 -3.5 -8.5 -5 -6 -4.5 C-3.5 -5 -1.5 -3.5 -2.5 -1 Z M2.5 -1 C1.5 -3.5 4 -5 6.5 -4.5 C9 -5 11 -3.5 10 -1 Z"/>');
    return { served, steaks, tray };
  },
  act(t, A) {
    const cut = (o) => withArm(withArm(SIT, 0, 62, 40), 1, lerp(48, 62, cyc(t, 14, o)), lerp(48, 30, cyc(t, 14, o)));
    const p = (o) => {
      let q = chat(t, o);
      q = mix(q, cut(o), smooth(0.22, 0.26, t));
      q = mix(q, eat(cyc(t, 4, o)), smooth(0.48, 0.52, t));
      return mix(q, FULL, smooth(0.8, 0.84, t));
    };
    // the waiter brings it over
    const wk = t < 0.2 ? smooth(0.02, 0.17, t) : 1 - smooth(0.22, 0.36, t);
    const wx = lerp(A + 260, A + 68, wk);
    const wWalk = (t > 0.02 && t < 0.17) || (t > 0.22 && t < 0.36);
    let wP = wWalk ? walk(wx * STR + 0.7) : STAND;
    if (t < 0.2) wP = withArm(wP, 1, 80, -10);
    return {
      me: at(A - 44, 1, seated(t, p(0))),
      her: at(A + 44, -1, seated(t, p(2))),
      extras: [at(wx, t < 0.2 ? -1 : 1, wP, { show: 1 - smooth(0.32, 0.36, t) })],
    };
  },
  update(t, r, c) {
    op(r.served, t >= 0.19 ? 1 : 0);
    r.steaks.forEach(({ n, x }) => put(n, x, -27.6, 0, lerp(1, 0.3, smooth(0.52, 0.8, t))));
    const w = c.extras && c.extras[0];
    if (c.active && w && t < 0.19) {
      put(r.tray, w.hand.x + 4 * w.dir, w.hand.y - 1);
      op(r.tray, 1);
    } else op(r.tray, 0);
  },
});

// 7. calls at night, until the morning
scene({
  key: 'calls',
  slow: [[0.08, 0.92, 2.6]], // slow enough to read what we're saying
  len: 680,
  w: 1.4,
  view: { w: 700, h: 330, dy: -100 },
  build(A, g) {
    group(g.back, D.bed(A - 180, 1) + D.bed(A + 180, -1));
    const stars = nightSky(A, g, 7);
    const moon = group(g.sky, D.moon(0, 0, 16));
    const sun = group(g.sky, D.sun(18));
    const link = el('path', { class: 'wave' }, g.back);
    const phones = [group(g.front, D.phone()), group(g.front, D.phone())];
    const bubble = makeBubble(g.front);
    return { stars, moon, sun, link, phones, A, bubble };
  },
  act(t, A) {
    const f = blink(t);
    return lying(t)
      ? {
        me: at(A - 178, -1, LIE_PHONE, { hip: { x: A - 178, y: -23 }, rot: 90, show: f }),
        her: at(A + 178, 1, LIE_PHONE, { hip: { x: A + 178, y: -23 }, rot: -90, show: f }),
      }
      : { me: at(A - 178, 1, STAND, { show: f }), her: at(A + 178, 1, STAND, { show: f }) };
  },
  update(t, r, c) {
    const A = r.A;
    put(r.moon, A, lerp(-240, -40, smooth(0.1, 0.62, t)));
    op(r.moon, 1 - smooth(0.5, 0.62, t));
    op(r.stars, 1 - smooth(0.3, 0.6, t));
    put(r.sun, A, lerp(-20, -220, smooth(0.6, 0.95, t)));
    op(r.sun, smooth(0.58, 0.66, t));
    phoneLink(r, c, c.active && t > 0.12 && t < 0.88, t);
    showCallBubble(r.bubble, c, callTalk(t, 0.14, 0.86, [
      'did you get home okay?', 'yes, just now',
      'what are you doing?', 'nothing much, you?',
      "it's 3am already", 'five more minutes',
      'the sun is coming up', 'okay, goodnight. or morning',
    ]), 22);
  },
});

// 8. coffee, and a lot of laughing
scene({
  key: 'coffee',
  slow: [[0.36, 0.76, 1.8]],
  len: 580,
  w: 1.6,
  view: { w: 520, h: 290, dx: -30, dy: -75 },
  build(A, g) {
    let s = `<rect class="prop" x="${A - 200}" y="-58" width="30" height="28"/><path class="prop" d="M${A - 190} -40 v5 M${A - 180} -40 v5"/>`;
    s += `<path class="prop prop-soft" d="M${A - 216} -30 h8 l-1 -7 h-6 Z M${A - 216} -37 h8 l-1 -7 h-6 Z"/>`;
    s += `<rect class="prop" x="${A - 210}" y="-150" width="90" height="56"/><path class="prop prop-soft" d="M${A - 200} -136 H${A - 160} M${A - 200} -124 H${A - 150} M${A - 200} -112 H${A - 170} M${A - 140} -136 h10 M${A - 140} -124 h10 M${A - 140} -112 h10"/>`;
    s += D.lamp(A + 20, -240, -140);
    s += D.table(A + 20, 44) + D.chair(A - 20, 1) + D.chair(A + 60, -1);
    s += `<path class="prop prop-soft" d="M${A + 170} 0 l-6 -18 h20 l-6 18 Z M${A + 174} -18 q-10 -16 -2 -30 M${A + 174} -18 q10 -14 6 -26"/>`;
    group(g.back, s);
    // the counter, in front of whoever is making the coffee
    group(g.front, `<rect class="prop paper" x="${A - 222}" y="-30" width="112" height="30"/>`);
    const steam = '<path class="steam" d="M-1 -9 q-2 -3 0 -6 q2 -3 0 -6"/><path class="steam" d="M2 -9 q-2 -3 0 -6 q2 -3 0 -6"/>';
    const cups = [
      group(g.front, `<path class="prop paper" d="M-3.5 0 L-4 -7 H4 L3.5 0 Z"/><path class="prop" d="M4 -5.5 q3 0 3 2 q0 2 -3 2"/>${steam}`),
      group(g.front, `<path class="prop paper" d="M-3.5 0 L-4 -7 H4 L3.5 0 Z"/><path class="prop" d="M-4 -5.5 q-3 0 -3 2 q0 2 3 2"/>${steam}`),
    ];
    const clink = group(g.front, D.burst(4, 9, 8));
    const laughs = [makeLaugh(g.front), makeLaugh(g.front)];
    return { cups, clink, laughs, A };
  },
  act(t, A) {
    const sip = (a) => window01(a, a + 0.08, t, 0.025);
    const meSip = Math.max(sip(0.1), sip(0.28));
    const herSip = Math.max(sip(0.18), sip(0.82));
    const laugh = window01(0.4, 0.58, t, 0.03);
    const clink = window01(0.62, 0.74, t, 0.03);
    let meP = mix(mix(mix(chat(t, 0), eat(1), meSip), LAUGH_ME, laugh), CLINK, clink);
    let herP = mix(mix(mix(chat(t, 2), eat(1), herSip), LAUGH_HER, laugh), CLINK, clink);
    const bob = (o) => Math.abs(Math.sin(t * 110 + o)) * 2 * laugh;
    return {
      me: at(A - 20, 1, seated(t, meP), { lift: bob(0) }),
      her: at(A + 60, -1, seated(t, herP), { lift: bob(1.3) }),
      extras: [at(A - 140, -1, withArm(STAND, 1, lerp(60, 85, cyc(t, 6)), 40))],
      meCup: Math.max(meSip, clink),
      herCup: Math.max(herSip, clink),
      laugh,
    };
  },
  update(t, r, c) {
    const s = c.state;
    const homes = [{ x: r.A + 7, y: -26 }, { x: r.A + 33, y: -26 }];
    [[c.me, s.meCup], [c.her, s.herCup]].forEach(([f, k], i) => {
      const home = homes[i];
      if (!c.active || !f) return put(r.cups[i], home.x, home.y);
      const h = { x: f.hand.x + (i ? -2 : 2), y: f.hand.y + 4 };
      put(r.cups[i], lerp(home.x, h.x, k || 0), lerp(home.y, h.y, k || 0));
    });
    if (c.active && c.me && c.her) {
      put(r.clink, (c.me.hand.x + c.her.hand.x) / 2, (c.me.hand.y + c.her.hand.y) / 2 - 4);
      op(r.clink, pulse(0.665, 0.695, t));
    } else op(r.clink, 0);
    showLaugh(r.laughs[0], c.active && c.me, s.laugh || 0);
    showLaugh(r.laughs[1], c.active && c.her, s.laugh || 0);
  },
});

// 9. the end: she goes her way; I leave one flower on the line, and go mine
scene({
  key: 'end',
  slow: [[0.58, 0.86, 1.6]],
  len: 760,
  w: 3,
  view: { w: 600, h: 300, dy: -70 },
  build(A, g) {
    const sun = group(g.sky, D.sun(20));
    const flower = group(g.front, oneFlower(), { opacity: 0 });
    return { sun, flower, A };
  },
  act(t, A) {
    // her: a last moment, then she turns and walks on
    const hk = smooth(0.24, 0.58, t);
    const hx = lerp(A + 90, A + 470, hk);
    const herP = hk > 0 && hk < 1 ? withLean(walk(hx * STR * 0.8 + 1.4), 5) : withLean(STAND, 4);
    const her = at(hx, t > 0.2 ? 1 : -1, herP, { nod: lerp(6, 16, smooth(0.08, 0.2, t)), show: 1 - smooth(0.48, 0.58, t) });

    // me: still, watching her go; then I lay the flower down, and go too
    let mx = A - 90;
    let mdir = 1;
    let meP = withLean(HOLD_LOW, 4);
    let nod = lerp(6, 18, smooth(0.1, 0.3, t));
    if (t >= 0.58 && t < 0.66) {
      const k = smooth(0.6, 0.66, t);
      mx = lerp(A - 90, A - 22, k);
      meP = k > 0 && k < 1 ? withArm(walk(mx * STR * 0.8), 1, 40, 40) : HOLD_LOW;
      nod = 10;
    } else if (t >= 0.66 && t < 0.82) {
      mx = A - 22;
      meP = mix(HOLD_LOW, KNEEL, smooth(0.66, 0.7, t) * (1 - smooth(0.77, 0.81, t)));
      nod = 10;
    } else if (t >= 0.82) {
      const k = smooth(0.84, 0.98, t);
      mx = lerp(A - 22, A - 420, k);
      mdir = t > 0.83 ? -1 : 1;
      meP = k > 0 && k < 1 ? withLean(walk(mx * STR * 0.8), 5) : STAND;
      nod = 14;
    }
    return {
      me: at(mx, mdir, meP, { nod, show: 1 - smooth(0.9, 0.98, t) }),
      her,
      bond: lerp(0.5, 0.3, smooth(0, 0.3, t)),
      snap: smooth(0.34, 0.5, t),
    };
  },
  cam(t, A) {
    const k = ease(smooth(0.8, 1, t));
    return { x: A - 4 * k, y: lerp(-70, -40, k), w: lerp(600, 380, k), h: lerp(300, 200, k) };
  },
  update(t, r, c) {
    put(r.sun, r.A + 170, lerp(-190, 30, smooth(0.05, 0.95, t)));
    const rest = { x: r.A - 2, y: -3 };
    if (!c.active || !c.me) {
      put(r.flower, rest.x, rest.y, 80);
      return op(r.flower, t >= 1 ? 1 : 0);
    }
    const k = smooth(0.7, 0.75, t);
    put(r.flower, lerp(c.me.hand.x, rest.x, k), lerp(c.me.hand.y + 2, rest.y, k), lerp(20, 80, k));
    op(r.flower, smooth(0, 0.05, t));
  },
});

/* ================================================================== */
/* lay the scenes out along the line                                   */
/* ================================================================== */

const GAP = 300;
{
  let cursor = 0;
  SCENES.forEach((s) => {
    s.A = cursor + s.len / 2;
    cursor += s.len + GAP;
  });
}
const LAST = SCENES[SCENES.length - 1];
const X0 = SCENES[0].A - 900;
const X1 = LAST.A + LAST.len / 2 + 900;

const STEP = 6;
const cum = [];
let lineD = '';
{
  let len = 0;
  let px = null;
  let py = null;
  for (let x = X0; x <= X1; x += STEP) {
    const y = ground(x);
    if (px !== null) len += Math.hypot(x - px, y - py);
    lineD += `${px === null ? 'M' : 'L'}${x} ${f1(y)}`;
    cum.push(len);
    px = x;
    py = y;
  }
}
const TOTAL = cum[cum.length - 1];
const lengthAt = (x) => cum[clamp(Math.round((x - X0) / STEP), 0, cum.length - 1)];
L.ground.setAttribute('d', `${lineD} L${X1} 6000 L${X0} 6000 Z`);
L.ghost.setAttribute('d', lineD);
L.thread.setAttribute('d', lineD);
L.thread.setAttribute('stroke-dasharray', `${TOTAL} ${TOTAL}`);

SCENES.forEach((s) => {
  s.g = { sky: el('g', {}, L.sky), back: el('g', {}, L.back), front: el('g', {}, L.front) };
  s.refs = s.build ? s.build(s.A, s.g) || {} : {};
});

/* ================================================================== */
/* the timeline: scene, walk, scene, walk, …                           */
/* ================================================================== */

// slow motion: parts of a scene listed in `slow` take more scrolling
const makeWarp = (slow = []) => {
  const N = 400;
  const acc = [0];
  for (let i = 1; i <= N; i += 1) {
    const tt = (i - 0.5) / N;
    const d = slow.reduce((m, [a, b, f]) => (tt >= a && tt <= b ? m * f : m), 1);
    acc.push(acc[i - 1] + d / N);
  }
  const total = acc[N];
  const map = (u) => {
    const target = clamp(u) * total;
    let lo = 0;
    let hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (acc[mid] < target) lo = mid;
      else hi = mid;
    }
    const k = (target - acc[lo]) / Math.max(1e-9, acc[hi] - acc[lo]);
    return (lo + k) / N;
  };
  return { map, total };
};
SCENES.forEach((s) => { s.warp = makeWarp(s.slow); });

const SEG = [];
SCENES.forEach((s, i) => {
  SEG.push({ type: 'scene', i, w: s.w * s.warp.total });
  if (i < SCENES.length - 1) {
    const d = Math.abs(SCENES[i + 1].A - s.A);
    SEG.push({ type: 'walk', i, w: clamp(d / 1600, 0.45, 0.9) });
  }
});
{
  const total = SEG.reduce((n, s) => n + s.w, 0);
  let acc = 0;
  SEG.forEach((s) => {
    s.a = acc / total;
    acc += s.w;
    s.b = acc / total;
  });
  document.querySelector('.scroll-space').style.height = `${Math.round(total * 70)}vh`;
}

const defaultCam = (s) => {
  const v = s.view || { w: 560, h: 280 };
  return { x: s.A + (v.dx || 0), y: ground(s.A) + (v.dy ?? -60), w: v.w, h: v.h };
};
const camOf = (s, t, st) => (s.cam ? s.cam(t, s.A, st) : defaultCam(s));
const camMix = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), w: lerp(a.w, b.w, k), h: lerp(a.h, b.h, k) });

// how close we are, scene by scene: far apart at first, slowly closer, then apart at the end
const GAPS = [260, 190, 150, 120, 200, 100, 90, 85, 75, 180];
// how strong the thread between us is (0 = gone)
const BOND = [0.1, 0.3, 0.45, 0.58, 0.62, 0.72, 0.8, 0.86, 0.9, 0.5];
const curve = (arr, x) => {
  const i = clamp(Math.floor(x), 0, arr.length - 1);
  const j = Math.min(i + 1, arr.length - 1);
  return lerp(arr[i], arr[j], clamp(x - i));
};

const walkFig = (fa, fb, t, off) => {
  const x = lerp(fa.x, fb.x, ease(t));
  const dx = fb.x - fa.x;
  let p;
  let dir;
  if (Math.abs(dx) > 6) {
    p = mix(fa.pose, walk(x * STR + off), smooth(0, 0.1, t));
    p = mix(p, fb.pose, smooth(0.9, 1, t));
    dir = t < 0.03 ? fa.dir : t > 0.97 ? fb.dir : Math.sign(dx);
  } else {
    p = mix(fa.pose, fb.pose, t);
    dir = t < 0.5 ? fa.dir : fb.dir;
  }
  return { x, dir, pose: p, show: lerp(fa.show ?? 1, fb.show ?? 1, t) };
};

const stateAt = (p) => {
  const seg = SEG.find((s) => p <= s.b) || SEG[SEG.length - 1];
  let t = clamp((p - seg.a) / (seg.b - seg.a));
  if (seg.type === 'scene') {
    const s = SCENES[seg.i];
    t = s.warp.map(t);
    const st = s.act(t, s.A);
    if (st.bond === undefined) st.bond = BOND[seg.i];
    return { seg, t, sceneIndex: seg.i, st, cam: camOf(s, t, st) };
  }
  const a = SCENES[seg.i];
  const b = SCENES[seg.i + 1];
  const sa = a.act(1, a.A);
  const sb = b.act(0, b.A);
  const me = walkFig(sa.me, sb.me, t, 0);
  const her = walkFig(sa.her, sb.her, t, 1.4);
  // carrying the painting from Dot to my office
  if (seg.i === DOT_I) me.pose = CARRY(me.pose);
  // while walking, settle into the distance for this point in the story
  const hold = smooth(0, 0.3, t) * (1 - smooth(0.7, 1, t));
  const gap = curve(GAPS, seg.i + 0.5 + (t - 0.5) * 0.9);
  const mid = (me.x + her.x) / 2;
  const herAhead = her.x >= me.x ? 1 : -1;
  me.x = lerp(me.x, mid - (gap / 2) * herAhead, hold);
  her.x = lerp(her.x, mid + (gap / 2) * herAhead, hold);
  const st = {
    me,
    her,
    bond: lerp(sa.bond ?? BOND[seg.i], sb.bond ?? BOND[seg.i + 1], t),
    extras: [
      ...(sa.extras || []).map((e) => ({ ...e, show: (e.show ?? 1) * (1 - smooth(0, 0.35, t)) })),
      ...(sb.extras || []).map((e) => ({ ...e, show: (e.show ?? 1) * smooth(0.65, 1, t) })),
    ],
  };
  return { seg, t, sceneIndex: seg.i + 0.5, st, cam: camMix(camOf(a, 1, sa), camOf(b, 0, sb), ease(t)) };
};

/* ================================================================== */
/* render                                                              */
/* ================================================================== */

let W = window.innerWidth;
let H = window.innerHeight;
const resize = () => {
  W = window.innerWidth;
  H = window.innerHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
};
resize();
const startHint = document.querySelector('.start-hint');

// the thread between us: faint and dotted at first, solid when we're close,
// and at the end it gently comes apart
const drawTether = (me, her, st) => {
  if (!me || !her) return tether.forEach((n) => op(n, 0));
  const bond = clamp(st.bond ?? 0);
  const snap = st.snap || 0;
  const mid = (f) => ({ x: lerp(f.hip.x, f.neck.x, 0.55), y: lerp(f.hip.y, f.neck.y, 0.55) });
  const a = mid(me);
  const b = mid(her);
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const sag = 8 + dist * 0.12;
  const c = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + sag };
  const q = (u) => ({
    x: (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * b.x,
    y: (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * b.y,
  });
  const piece = (u0, u1) => {
    let d = '';
    for (let i = 0; i <= 24; i += 1) {
      const p = q(lerp(u0, u1, i / 24));
      d += `${i ? 'L' : 'M'}${f1(p.x)} ${f1(p.y)}`;
    }
    return d;
  };
  const width = 0.7 + 1.1 * bond;
  const dash = bond > 0.96 ? 'none' : `${f1(1 + bond * 14)} ${f1((1 - bond) * 7 + 1.5)}`;
  tether.forEach((n) => {
    n.style.strokeWidth = width.toFixed(2);
    n.style.strokeDasharray = dash;
  });
  if (snap <= 0) {
    tether[0].setAttribute('d', piece(0, 1));
    op(tether[0], 0.12 + 0.5 * bond);
    op(tether[1], 0);
    return;
  }
  // come apart: each loose end shrinks back towards its person and fades
  const reach = 0.5 * (1 - snap * 0.8);
  tether[0].setAttribute('d', piece(0, reach));
  tether[1].setAttribute('d', piece(1 - reach, 1));
  const o = (0.12 + 0.5 * bond) * (1 - smooth(0.6, 1, snap) * 0.7);
  op(tether[0], o);
  op(tether[1], o);
};

// the painting from Dot, while it's in my hands
const carried = group(L.front, `<rect class="prop paper" x="-20" y="-17" width="40" height="34"/>${ART.flower.map((d) => `<path class="prop" d="${d}"/>`).join('')}`, { opacity: 0 });
const lerpPt = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) });
const carryUpdate = (S, me) => {
  if (!me) return op(carried, 0);
  const { seg, t } = S;
  const hand = { x: me.hand.x + 4 * me.dir, y: me.hand.y - 4, s: 0.85 };
  const easel = { x: SCENES[DOT_I].A - 18, y: -46, s: 1 };
  const wall = { x: SCENES[OFFICE_I].A - 170, y: -100, s: 1 };
  let p = null;
  if (seg.type === 'scene' && seg.i === DOT_I && t >= T_LIFT) p = lerpPt(easel, hand, smooth(T_LIFT, T_LIFT + 0.05, t));
  else if (seg.type === 'walk' && seg.i === DOT_I) p = hand;
  else if (seg.type === 'scene' && seg.i === OFFICE_I && t < T_HANG[1]) p = lerpPt(hand, wall, smooth(T_HANG[0], T_HANG[1], t));
  if (!p) return op(carried, 0);
  put(carried, p.x, p.y, 0, p.s);
  op(carried, 1);
};

const drawScene = (S, p) => {
  const { st, cam } = S;

  const me = drawFigure(ME, st.me);
  const her = drawFigure(HER, st.her);
  const extras = EXTRAS.map((f, i) => drawFigure(f, (st.extras || [])[i]));
  drawTether(me, her, st);

  // on tall phone screens, crop the scene's spare margins so we're not tiny
  const crop = W < H ? 0.78 : 1;
  const sc = clamp(Math.min((W * 0.94) / (cam.w * crop), (H * 0.78) / cam.h), 0.02, 1.9);
  world.setAttribute('transform', `translate(${f1(W / 2)} ${f1(H * 0.6)}) scale(${sc.toFixed(4)}) translate(${f1(-cam.x)} ${f1(-cam.y)})`);
  L.thread.style.strokeWidth = (1.8 / sc).toFixed(2);
  L.ghost.style.strokeWidth = (1 / sc).toFixed(2);
  L.ghost.style.strokeDasharray = `${(2 / sc).toFixed(1)} ${(6 / sc).toFixed(1)}`;

  // the line is drawn just ahead of whoever is in front
  const lead = Math.max(st.me.x ?? -1e9, st.her.x ?? -1e9, me ? me.x : -1e9, her ? her.x : -1e9) + 80;
  L.thread.setAttribute('stroke-dashoffset', f1(TOTAL - lengthAt(lead)));

  // scenes fade in as the camera reaches them, and update their moving parts
  SCENES.forEach((s, i) => {
    const r = s.len / 2 + 420;
    const vis = Math.max(1 - smooth(r * 0.6, r, Math.abs(cam.x - s.A)), i < S.sceneIndex - 0.6 ? 0.14 : 0);
    const o = o3(vis);
    s.g.sky.setAttribute('opacity', o);
    s.g.back.setAttribute('opacity', o);
    s.g.front.setAttribute('opacity', o);
    if (!s.update) return;
    const active = S.seg.type === 'scene' && S.seg.i === i;
    if (vis <= 0 && !active) return;
    const t = active ? S.t : i < S.sceneIndex ? 1 : 0;
    s.update(t, s.refs, { active, me, her, extras, state: st, cam });
  });
  carryUpdate(S, me);

  startHint.style.opacity = o3(0.62 * (1 - smooth(0.001, 0.008, p)));
};

/* ================================================================== */
/* the letter                                                          */
/* ================================================================== */

const overlay = document.querySelector('.letter-overlay');
const letter = overlay.querySelector('.letter');
const showLetter = () => {
  overlay.classList.add('on');
  letter.classList.add('on');
  overlay.scrollTop = 0;
  const lines = [...letter.children];
  lines.forEach((n, i) => { n.style.transitionDelay = `${1.2 + i * 0.9}s`; });
  requestAnimationFrame(() => requestAnimationFrame(() => letter.classList.add('reveal')));
  // counted as read once she reaches the bottom of it
  const check = () => {
    if (overlay.scrollTop + overlay.clientHeight >= overlay.scrollHeight - 60) track('/letter-read');
  };
  overlay.addEventListener('scroll', check, { passive: true });
  // (if it all fits on her screen: once every line has appeared and had time to be read)
  setTimeout(check, (1.2 + lines.length * 0.9 + 20) * 1000);
};

let ENDED = false;
const finish = () => {
  if (ENDED) return;
  ENDED = true;
  track('/letter');
  lenis.stop();
  document.documentElement.classList.add('locked');
  gsap.to('.fade-white', { opacity: 1, duration: 2.6, ease: 'sine.inOut', onComplete: showLetter });
};

const render = (p) => {
  if (ENDED) return;
  const S = stateAt(p);
  drawScene(S, p);
  if (S.seg.type === 'scene') {
    const s = SCENES[S.seg.i];
    if (s.key) track(`/${s.key}`);
    if (S.seg.i === SCENES.length - 1 && S.t >= 0.985) finish();
  }
};

/* ================================================================== */
/* scroll                                                              */
/* ================================================================== */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

const lenis = new Lenis({ lerp: 0.12 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const progress = { p: 0 };
gsap.to(progress, {
  p: 1,
  ease: 'none',
  scrollTrigger: {
    trigger: '.scroll-space',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
  },
  onUpdate: () => render(progress.p),
});

window.addEventListener('resize', () => {
  resize();
  ScrollTrigger.refresh();
  if (!ENDED) render(progress.p);
});

render(0);
