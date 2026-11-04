/* Stick-figure form demos. Ported from the original page.
 *
 * A Demo is a short loop through 2–3 key poses (frames). Two kinds of view:
 *
 * Side view (view: "side") frames:
 *   h: [x, y] hip position · t: torso angle (0 = upright, clockwise positive) · hd: head angle (defaults to t)
 *   a1 / a2: near / far ankle position · w1 / w2: near / far wrist position
 *   e1 / e2: explicit elbow positions (otherwise solved with 2-link IK from the shoulder)
 *   ft1 / ft2: foot angles (default 95) · ha: hand angle · arch: spine curve
 * Front view (view: "front") frames:
 *   p: [x, y] pelvis centre · tilt: torso tilt · shrug · a / a2: ankles · w / w2: wrists · k: explicit knee
 *   e / e2: explicit elbows · rot: dumbbell rotation. Right-side values mirror to the left when omitted.
 * Positions can be absolute [x, y] or relative ["sh" | "hip" | "p", dx, dy].
 * Demo-level flags: kb1/kb2 knee bend direction, eb1/eb2 elbow bend direction, to (torso length, front),
 *   headUp, thumb (frame used for the list thumbnail, default 1), ground (false hides the floor),
 *   armsFront (false hides arms in front view).
 * Props (equipment), each { k: kind, ... }: plate, db, rod, dbh, dbrot, handle, pad, band, rect, seg, cable.
 *   Point references: absolute [x, y], a joint name ("wr1", "sh", "an1", ...), or "mid:a:b".
 */
import type { Gender } from "./types";

export type Pt = [number, number];
export type RelPt = Pt | [string, number, number];

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Frame = Record<string, any>;
export interface Prop { k: string; [key: string]: any }
export interface Demo {
  view: "side" | "front";
  demoView?: string;
  labels: string[];
  thumb?: number;
  ground?: boolean;
  armsFront?: boolean;
  to?: number;
  headUp?: number;
  kb1?: number; kb2?: number; eb1?: number; eb2?: number;
  frames: Frame[];
  props: Prop[];
}
type Pose = Record<string, any>;
type Joints = Record<string, any>;

const SL = { th: 34, sh: 32, to: 42, ua: 23, fa: 21, neck: 4, head: 6.5, foot: 10 };
const DEG = Math.PI / 180;
const vec = (a: number): Pt => [Math.sin(a * DEG), -Math.cos(a * DEG)]; // 0 = up, clockwise positive
const addp = (a: number[], b: number[], k?: number): Pt => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k)];
const f1 = (n: number) => Math.round(n * 10) / 10;

function ik(P: number[], T: number[], l1: number, l2: number, s: number): [Pt, Pt] {
  const dx = T[0] - P[0], dy = T[1] - P[1], d = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
  const dc = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, d));
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc))));
  const J: Pt = [P[0] + l1 * Math.cos(th + s * a), P[1] + l1 * Math.sin(th + s * a)];
  const ex = T[0] - J[0], ey = T[1] - J[1], de = Math.hypot(ex, ey) || 1;
  return [J, [J[0] + (ex / de) * l2, J[1] + (ey / de) * l2]];
}
function rel(v: any, ctx: Record<string, Pt>): Pt | null {
  if (v == null) return null;
  return typeof v[0] === "string" ? [ctx[v[0]][0] + v[1], ctx[v[0]][1] + v[2]] : v.slice();
}

function resolveSide(f: Frame): Pose {
  const hip = f.h.slice(), sh = addp(hip, vec(f.t), SL.to), ctx = { hip, sh };
  const ft1 = f.ft1 == null ? 95 : f.ft1;
  return {
    h: hip, t: f.t, hd: f.hd == null ? f.t : f.hd, a1: rel(f.a1, ctx), a2: rel(f.a2 || f.a1, ctx),
    w1: rel(f.w1, ctx), w2: rel(f.w2 || f.w1, ctx), e1: rel(f.e1, ctx), e2: rel(f.e2 || f.e1, ctx),
    ft1, ft2: f.ft2 == null ? ft1 : f.ft2, ha: f.ha == null ? null : f.ha, arch: f.arch || 0,
  };
}
function resolveFront(f: Frame): Pose {
  const p = f.p.slice(), ctx = { p }, mir = (q: Pt | null) => q && [2 * p[0] - q[0], q[1]];
  const a1 = rel(f.a, ctx), w1 = rel(f.w, ctx), k1 = rel(f.k, ctx), e1 = rel(f.e, ctx);
  return {
    p, tilt: f.tilt || 0, shrug: f.shrug || 0, a1, a2: f.a2 ? rel(f.a2, ctx) : mir(a1), w1, w2: f.w2 ? rel(f.w2, ctx) : mir(w1),
    k1, k2: k1 ? mir(k1) : null, e1, e2: f.e2 ? rel(f.e2, ctx) : e1 ? mir(e1) : null, rot: f.rot || 0,
  };
}
export function lerpPose(A: Pose, B: Pose, u: number): Pose {
  const o: Pose = {};
  for (const k in A) {
    const a = A[k], b = B[k];
    if (a == null || b == null) o[k] = a;
    else if (Array.isArray(a)) o[k] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    else o[k] = a + (b - a) * u;
  }
  return o;
}
function jointsSide(r: Pose, ex: Demo): Joints {
  const kb1 = ex.kb1 || -1, kb2 = ex.kb2 || kb1, eb1 = ex.eb1 || 1, eb2 = ex.eb2 || eb1;
  const hip = r.h, sh = addp(hip, vec(r.t), SL.to), head = addp(sh, vec(r.hd), SL.neck + SL.head);
  const [k1, an1] = ik(hip, r.a1, SL.th, SL.sh, kb1), [k2, an2] = ik(hip, r.a2, SL.th, SL.sh, kb2);
  let e1, wr1, e2, wr2;
  if (r.e1) { e1 = r.e1; wr1 = r.w1; e2 = r.e2; wr2 = r.w2; }
  else { [e1, wr1] = ik(sh, r.w1, SL.ua, SL.fa, eb1); [e2, wr2] = ik(sh, r.w2, SL.ua, SL.fa, eb2); }
  return {
    hip, sh, head, k1, an1, k2, an2, e1, wr1, e2, wr2, arch: r.arch || 0, hand1: r.ha == null ? null : addp(wr1, vec(r.ha), 6.5),
    toe1: addp(an1, vec(r.ft1), SL.foot), toe2: addp(an2, vec(r.ft2), SL.foot),
    heel1: addp(an1, vec(r.ft1), -2.5), heel2: addp(an2, vec(r.ft2), -2.5),
  };
}
function jointsFront(r: Pose, ex: Demo): Joints {
  const to = ex.to || SL.to, c = Math.cos(r.tilt * DEG), s = Math.sin(r.tilt * DEG), rot = (x: number, y: number): Pt => [x * c - y * s, x * s + y * c];
  const p = r.p, N = addp(p, rot(0, -to)), sh1 = addp(N, rot(14, 3 - (r.shrug || 0))), sh2 = addp(N, rot(-14, 3 - (r.shrug || 0)));
  const hip1 = addp(p, rot(8, 0)), hip2 = addp(p, rot(-8, 0)), head = addp(N, rot(0, -(ex.headUp == null ? SL.neck + SL.head : ex.headUp)));
  const kb = ex.kb1 || -1, eb = ex.eb1 || -1;
  let k1, an1, k2, an2, e1, wr1, e2, wr2;
  if (r.k1) { k1 = r.k1; an1 = r.a1; k2 = r.k2; an2 = r.a2; }
  else { [k1, an1] = ik(hip1, r.a1, SL.th, SL.sh, kb); [k2, an2] = ik(hip2, r.a2, SL.th, SL.sh, -kb); }
  if (r.e1) { e1 = r.e1; wr1 = r.w1; e2 = r.e2; wr2 = r.w2; }
  else { [e1, wr1] = ik(sh1, r.w1, SL.ua, SL.fa, eb); [e2, wr2] = ik(sh2, r.w2, SL.ua, SL.fa, -eb); }
  return {
    p, N, sh1, sh2, hip1, hip2, head, k1, an1, k2, an2, e1, wr1, e2, wr2,
    toe1: addp(an1, [5, 2.5]), toe2: addp(an2, [-5, 2.5]), sh: sh1, hip: p, rot: r.rot || 0,
  };
}
function ptRef(ref: any, J: Joints, store: Record<string, Pt>): Pt {
  if (Array.isArray(ref)) return ref as Pt;
  if (ref.indexOf("mid:") === 0) {
    const [a, b] = ref.slice(4).split(":");
    return [(J[a][0] + J[b][0]) / 2, (J[a][1] + J[b][1]) / 2];
  }
  return J[ref] || store[ref];
}
const L2 = (a: number[], b: number[], cls: string, w?: number) =>
  '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" class="' + cls + '"' + (w ? ' stroke-width="' + w + '"' : "") + "/>";
const PL = (pts: number[][], cls: string) => '<polyline points="' + pts.map((p) => f1(p[0]) + "," + f1(p[1])).join(" ") + '" class="' + cls + '"/>';
const CI = (c: number[], r: number, cls: string) => '<circle cx="' + f1(c[0]) + '" cy="' + f1(c[1]) + '" r="' + r + '" class="' + cls + '"/>';

function propsSvg(ex: Demo, J: Joints, layer: "front" | "back"): string {
  const store: Record<string, Pt> = {};
  let out = "";
  (ex.props || []).forEach((pr) => {
    if (pr.k === "pad" && pr.seg) {
      const A = ptRef(pr.seg[0], J, store), B = ptRef(pr.seg[1], J, store);
      const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
      store[pr.id || "pad"] = [A[0] + dx * pr.at + -uy * pr.perp, A[1] + dy * pr.at + ux * pr.perp];
    }
  });
  (ex.props || []).forEach((pr) => {
    const front = ["plate", "db", "rod", "dbh", "handle", "pad", "band", "dbrot"].indexOf(pr.k) >= 0;
    const L = pr.layer || (front ? "front" : "back");
    if (L !== layer) return;
    const g = (r: any) => ptRef(r, J, store), off = pr.off || [0, 0];
    if (pr.k === "rect") out += '<rect x="' + pr.x + '" y="' + pr.y + '" width="' + pr.w + '" height="' + pr.h + '" rx="' + (pr.rx == null ? 2 : pr.rx) + '" class="eq-soft"/>';
    else if (pr.k === "seg") {
      let a, b;
      if (pr.at) { const c = addp(g(pr.at), off), d = vec(pr.ang); a = addp(c, d, -pr.len / 2); b = addp(c, d, pr.len / 2); }
      else { a = g(pr.p1); b = g(pr.p2); }
      out += L2(a, b, "eq", pr.w || 4);
    } else if (pr.k === "cable") { const a = g(pr.p1), b = g(pr.p2); out += L2(a, b, "cable") + CI(a, 4.2, "eq-soft"); }
    else if (pr.k === "plate") {
      let c: Pt;
      if (pr.toward) { const w = g(pr.at), t = pr.toward, dx = t[0] - w[0], dy = t[1] - w[1], d = Math.hypot(dx, dy); c = [w[0] + (dx / d) * pr.dist, w[1] + (dy / d) * pr.dist]; }
      else c = addp(g(pr.at), off);
      out += CI(c, pr.r || 13, "plate") + CI(c, 2.4, "hub");
    } else if (pr.k === "db") { const c = addp(g(pr.at), off); out += CI(c, 4.8, "dbe") + CI(c, 1.6, "hub"); }
    else if (pr.k === "rod") {
      const w = g(pr.at), e = J[pr.from || "e1"], dx = w[0] - e[0], dy = w[1] - e[1], d = Math.hypot(dx, dy) || 1, px = -dy / d, py = dx / d;
      const a = [w[0] + px * 8, w[1] + py * 8], b = [w[0] - px * 8, w[1] - py * 8];
      out += L2(a, b, "dbr", 2.6) + L2(addp(a, [px, py], -1.5), addp(a, [px, py], 2.5), "dbr", 7) + L2(addp(b, [px, py], 1.5), addp(b, [px, py], -2.5), "dbr", 7);
    } else if (pr.k === "dbh") {
      const w = g(pr.at);
      out += L2([w[0] - 8, w[1]], [w[0] + 8, w[1]], "dbr", 2.6) + L2([w[0] - 8, w[1] - 4], [w[0] - 8, w[1] + 4], "dbr", 5) + L2([w[0] + 8, w[1] - 4], [w[0] + 8, w[1] + 4], "dbr", 5);
    } else if (pr.k === "handle") out += CI(addp(g(pr.at), off), pr.r || 2.8, "handle");
    else if (pr.k === "band") out += L2(g(pr.p1), g(pr.p2), "band");
    else if (pr.k === "dbrot") {
      const w = g(pr.at), d = vec(J.rot || 0), px = d[0], py = d[1], a = [w[0] + px * 8, w[1] + py * 8], b = [w[0] - px * 8, w[1] - py * 8];
      out += L2(a, b, "dbr", 2.6) + L2(addp(a, [px, py], -1.5), addp(a, [px, py], 2.5), "dbr", 7) + L2(addp(b, [px, py], 1.5), addp(b, [px, py], -2.5), "dbr", 7);
    } else if (pr.k === "pad") out += CI(pr.seg ? store[pr.id || "pad"] : addp(g(pr.at), off), pr.r || 5, "pad");
  });
  return out;
}

function figureSvg(J: Joints, ex: Demo, gender: Gender, cls = ""): string {
  let o = "";
  const fem = gender === "female";
  if (ex.view === "front") {
    const leg = (h: Pt, k: Pt, a: Pt, t: Pt) => PL([h, k, a], "stk limb " + cls) + L2(a, t, "stk foot " + cls);
    o += leg(J.hip2, J.k2, J.an2, J.toe2) + leg(J.hip1, J.k1, J.an1, J.toe1);
    o += '<path d="M' + [J.sh1, J.sh2, J.hip2, J.hip1].map((p: Pt) => f1(p[0]) + " " + f1(p[1])).join(" L") + 'Z" class="trunk ' + cls + '"/>';
    o += L2(J.N, J.head, "stk neck " + cls) + CI(J.head, SL.head, "headc " + cls);
    if (fem) o += CI([J.head[0], J.head[1] - 7], 3.6, "headc " + cls);
    if (ex.armsFront !== false) o += PL([J.sh2, J.e2, J.wr2], "stk limb " + cls) + PL([J.sh1, J.e1, J.wr1], "stk limb " + cls);
  } else {
    o += PL([J.hip, J.k2, J.an2], "stk limb far " + cls) + PL([J.heel2, J.toe2], "stk foot far " + cls);
    o += PL([J.sh, J.e2, J.wr2], "stk limb far " + cls);
    if (J.arch) {
      const dx = J.sh[0] - J.hip[0], dy = J.sh[1] - J.hip[1], L = Math.hypot(dx, dy) || 1, px = dy / L, py = -dx / L;
      const c = [(J.hip[0] + J.sh[0]) / 2 + px * J.arch * 2, (J.hip[1] + J.sh[1]) / 2 + py * J.arch * 2];
      o += '<path d="M' + f1(J.hip[0]) + " " + f1(J.hip[1]) + " Q" + f1(c[0]) + " " + f1(c[1]) + " " + f1(J.sh[0]) + " " + f1(J.sh[1]) + '" class="stk torso ' + cls + '"/>';
    } else o += L2(J.hip, J.sh, "stk torso " + cls);
    o += L2(J.sh, J.head, "stk neck " + cls) + CI(J.head, SL.head, "headc " + cls);
    if (fem) {
      const dx = J.head[0] - J.sh[0], dy = J.head[1] - J.sh[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      o += CI([J.head[0] + (0.5 * ux + 0.866 * uy) * 6.8, J.head[1] + (-0.866 * ux + 0.5 * uy) * 6.8], 3.6, "headc " + cls);
    }
    o += PL([J.hip, J.k1, J.an1], "stk limb " + cls) + PL([J.heel1, J.toe1], "stk foot " + cls);
    o += PL([J.sh, J.e1, J.wr1], "stk limb " + cls);
    if (J.hand1) o += L2(J.wr1, J.hand1, "stk hand " + cls);
  }
  return o;
}

const resolved = new WeakMap<Demo, Pose[]>();
export function resolveFrames(ex: Demo): Pose[] {
  let r = resolved.get(ex);
  if (!r) { r = ex.frames.map((f) => (ex.view === "front" ? resolveFront(f) : resolveSide(f))); resolved.set(ex, r); }
  return r;
}
const jointsFor = (ex: Demo, r: Pose) => (ex.view === "front" ? jointsFront(r, ex) : jointsSide(r, ex));

/** SVG markup (inner content) for one pose, with an optional faded "ghost" pose behind it */
export function sceneSvg(ex: Demo, r: Pose, gender: Gender, ghost?: Pose | null): string {
  const J = jointsFor(ex, r);
  let s = "";
  if (ex.ground !== false) s += '<line x1="-300" y1="160" x2="520" y2="160" class="floor"/>';
  s += propsSvg(ex, J, "back");
  if (ghost) { const G = jointsFor(ex, ghost); s += '<g class="ghost">' + figureSvg(G, ex, gender) + propsSvg(ex, G, "front") + "</g>"; }
  s += figureSvg(J, ex, gender) + propsSvg(ex, J, "front");
  return s;
}

/** viewBox fitted to everything an exercise draws, at a fixed 11:9 aspect */
const boxes = new WeakMap<Demo, string>();
export function fitBox(ex: Demo): string {
  const cached = boxes.get(ex);
  if (cached) return cached;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (p: number[], r = 0) => { x0 = Math.min(x0, p[0] - r); y0 = Math.min(y0, p[1] - r); x1 = Math.max(x1, p[0] + r); y1 = Math.max(y1, p[1] + r); };
  resolveFrames(ex).forEach((r) => {
    const J = jointsFor(ex, r);
    for (const k in J) if (Array.isArray(J[k])) add(J[k], k === "head" ? SL.head + 1 : 4);
    (ex.props || []).forEach((pr) => {
      if (pr.k === "rect") { add([pr.x, pr.y]); add([pr.x + pr.w, pr.y + pr.h]); }
      else if ((pr.k === "seg" || pr.k === "cable") && !pr.at) [pr.p1, pr.p2].forEach((q) => { if (Array.isArray(q)) add(q, 3); });
      else if (pr.k === "plate" && !pr.toward) { const c = ptRef(pr.at, J, {}); if (c) add(addp(c, pr.off || [0, 0]), (pr.r || 13) + 1.5); }
      else if (pr.k === "plate") add(J[pr.at], (pr.r || 13) + 14);
      else if (pr.at && typeof pr.at === "string" && J[pr.at]) add(J[pr.at], pr.len ? pr.len / 2 + 2 : 8);
    });
  });
  if (ex.ground !== false) y1 = Math.max(y1, 162);
  const pad = 9;
  x0 -= pad; x1 += pad; y0 -= pad; y1 += pad * 0.4;
  let w = x1 - x0, h = y1 - y0;
  const A = 220 / 180;
  if (h < 120) { y0 -= (120 - h) * 0.85; h = 120; }
  if (w / h < A) { const nw = h * A; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / A; y0 -= (nh - h) * 0.85; h = nh; }
  const vb = [x0, y0, w, h].map((n) => Math.round(n * 10) / 10).join(" ");
  boxes.set(ex, vb);
  return vb;
}

/* ----- animation timing ----- */
export const SEG = 1150, HOLD = 600, STEP = SEG + HOLD;
const ease = (u: number) => -(Math.cos(Math.PI * u) - 1) / 2;
/** play order: 2 frames ping-pong, 3+ frames go forward then back */
export const orderFor = (n: number) => (n <= 1 ? [0] : n === 2 ? [0, 1] :Array.from({ length: n }, (_, i) => i).concat(Array.from({ length: n - 2 }, (_, i) => n - 2 - i)));
export function poseFrom(R: Pose[], o: number[], ms: number): { r: Pose; ph: number } {
  const tot = o.length * STEP, t = ((ms % tot) + tot) % tot, i = Math.floor(t / STEP), loc = t - i * STEP, a = o[i], b = o[(i + 1) % o.length];
  if (loc < HOLD) return { r: R[a], ph: a };
  const u = ease((loc - HOLD) / SEG);
  return { r: lerpPose(R[a], R[b], u), ph: u < 0.5 ? a : b };
}
