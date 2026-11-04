/* Builds the front/back muscle figures as plain shape data that React renders.
 * Ported from the original page's buildFigure(); output is identical path for path. */
import { ARM_AXIS, BACK, FRONT, HEADS, JOINTS, PROFILES, SIL, SIL_ARM, type Shape } from "./anatomy-data";
import type { Pt } from "./stick";
import type { Gender, Level } from "./types";

export { JOINTS };
export type View = "front" | "back";

/** muscles drawn with the arm transform (they follow the arm axis instead of the torso width) */
const ARM_IDS = new Set(["biceps-long", "biceps-short", "brachialis", "triceps-long", "triceps-lat", "triceps-medial", "brachioradialis", "forearm-flex", "forearm-ext"]);

/** every muscle id that has a drawn shape (used to warn about CSV muscles with no shape) */
export const SHAPE_IDS = new Set([...FRONT, ...BACK].map((s) => s[0]));

const f = (v: number) => Math.round(v * 10) / 10;

/** closed Catmull-Rom spline through the points */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += " C" + f(c1[0]) + " " + f(c1[1]) + " " + f(c2[0]) + " " + f(c2[1]) + " " + f(p2[0]) + " " + f(p2[1]);
  }
  return d + "Z";
}

function openPath(pts: Pt[]): string {
  const n = pts.length;
  let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += " C" + f(c1[0]) + " " + f(c1[1]) + " " + f(c2[0]) + " " + f(c2[1]) + " " + f(p2[0]) + " " + f(p2[1]);
  }
  return d;
}

const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [200 - x, y]);

function interp(T: Pt[], y: number): number {
  if (y <= T[0][0]) return T[0][1];
  for (let i = 1; i < T.length; i++) {
    if (y <= T[i][0]) {
      const [y0, a] = T[i - 1], [y1, b] = T[i];
      return a + ((b - a) * (y - y0)) / (y1 - y0);
    }
  }
  return T[T.length - 1][1];
}

function tfPt(p: Pt, kind: "arm" | "torso", gender: Gender): Pt {
  const P = PROFILES[gender] || PROFILES.male, x = p[0], y = p[1], side = x >= 100 ? 1 : -1, ax = Math.abs(x - 100);
  if (kind === "arm") {
    const axis = interp(ARM_AXIS, y) - 100, shift = (interp(P.w, 90) - 1) * 48, nx = axis + (ax - axis) * P.arm + shift;
    return [100 + side * nx, y];
  }
  return [100 + side * ax * interp(P.w, y), y];
}
const tfPts = (pts: Pt[], kind: "arm" | "torso", g: Gender) => pts.map((p) => tfPt(p, kind, g));

/** small feminine shape tweaks before the width profile */
const FEM_TWEAK: Record<string, (p: Pt) => Pt> = {
  "pec-lower": (p) => (p[1] > 111 ? [p[0], p[1] + 3.5] : p),
  glutes: (p) => (p[1] > 228 ? [p[0], p[1] + 3] : p),
};

/** shrink each muscle a touch toward its centre so separations read as lean definition */
function shrink(pts: Pt[], k: number): Pt[] {
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  return pts.map((p) => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
}

const headPath = (half: Pt[]) => smoothPath(half.concat(mirror(half.slice(1, -1)).reverse()));

export interface MusclePath { id: string; d: string; pattern: string }
export interface JointMarker { id: string; name: string; spine?: { y0: number; y1: number; ticks: number[] }; circles?: { cx: string; cy: number }[] }
export interface FigureModel {
  view: View;
  patterns: { id: string; angle: number }[];
  sil: string;
  hairBehind: string | null;
  /** Advanced: one entry per muscle side; Basic: one entry per group side (shapes merged under one outline) */
  muscles: MusclePath[];
  groups: { gid: string; shapes: MusclePath[] }[];
  abslines: string[];
  contours: string[];
  ears: { cx: number; cy: number; rx: number; ry: number }[];
  head: string;
  hairFront: { d: string; bun?: boolean }[];
  joints: JointMarker[];
}

/**
 * @param groupOf maps an Advanced muscle id to its Basic group id (null = hidden in Basic)
 */
export function buildFigure(view: View, pfx: string, gender: Gender, level: Level, groupOf: (m: string) => string | null): FigureModel {
  const basic = level === "basic", fem = gender === "female", H = HEADS[fem ? "female" : "male"];
  const list: Shape[] = view === "front" ? FRONT : BACK;
  const pid = (a: number) => "fib-" + pfx + view + "-" + (a < 0 ? "m" + -a : a);

  const angles = new Set<number>();
  list.forEach((m) => { angles.add(m[2]); angles.add(-m[2]); });
  const patterns = [...angles].map((a) => ({ id: pid(a), angle: a }));

  const silR = SIL.map((p, i) => tfPt(p, i >= SIL_ARM[0] && i <= SIL_ARM[1] ? "arm" : "torso", gender));
  const sil = smoothPath(silR.concat(mirror(silR).reverse()));

  let hairBehind: string | null = null;
  if (fem) {
    hairBehind = view === "front"
      ? smoothPath([[100,3.5],[108.5,4.5],[115.5,8.5],[119.5,15],[121,24],[121.2,34],[121,44],[122.5,54],[124,61],[118.5,63.5],[114.5,57],[100,57],[85.5,57],[81.5,63.5],[76,61],[77.5,54],[79,44],[78.8,34],[79,24],[80.5,15],[84.5,8.5],[91.5,4.5]])
      : smoothPath([[100,4],[108.5,5],[115.5,9],[119.5,15.5],[121,24],[121.2,34],[120.6,44],[118,52],[112,56],[100,57.5],[88,56],[82,52],[79.4,44],[78.8,34],[79,24],[80.5,15.5],[84.5,9],[91.5,5]]);
  }

  const shapeOf = (id: string, pts: Pt[], k: number) => {
    const kind = ARM_IDS.has(id) ? "arm" : "torso";
    let base = pts;
    if (fem && FEM_TWEAK[id]) base = base.map(FEM_TWEAK[id]);
    return shrink(tfPts(base, kind, gender), k);
  };

  const muscles: MusclePath[] = [];
  const groups: { gid: string; shapes: MusclePath[] }[] = [];
  if (!basic) {
    list.forEach(([id, pts, ang]) => {
      const tp = shapeOf(id, pts, 0.965);
      ([[tp, ang], [mirror(tp), -ang]] as [Pt[], number][]).forEach(([p, a]) => muscles.push({ id, d: smoothPath(p), pattern: pid(a) }));
    });
  } else {
    const order: string[] = [], members: Record<string, Shape[]> = {};
    list.forEach((s) => {
      const gid = groupOf(s[0]);
      if (!gid) return;
      if (!members[gid]) { members[gid] = []; order.push(gid); }
      members[gid].push(s);
    });
    order.forEach((gid) => {
      const ang = members[gid][0][2];
      [1, -1].forEach((sd) => {
        groups.push({
          gid,
          shapes: members[gid].map(([id, pts]) => {
            const tp = shapeOf(id, pts, 1);
            return { id, d: smoothPath(sd > 0 ? tp : mirror(tp)), pattern: pid(sd * ang) };
          }),
        });
      });
    });
  }

  const abslines: string[] = [], contours: string[] = [];
  if (view === "front") {
    [142, 178].forEach((y) => {
      const a = tfPt([101.5, y], "torso", gender), b = tfPt([118.5, y - 1], "torso", gender), c = tfPt([110, y + 1.5], "torso", gender);
      abslines.push("M" + a[0] + " " + a[1] + " Q" + c[0] + " " + c[1] + " " + b[0] + " " + b[1]);
      abslines.push("M" + (200 - a[0]) + " " + a[1] + " Q" + (200 - c[0]) + " " + c[1] + " " + (200 - b[0]) + " " + b[1]);
    });
    if (fem) {
      const br = tfPts([[104,114],[109,125],[118,130],[128,128.5],[135.5,121],[139.5,111]], "torso", gender);
      contours.push(openPath(br), openPath(mirror(br)));
    }
  }

  const e = H.ear;
  const ears = fem && view === "back" ? [] : [{ cx: e[0], cy: e[1], rx: e[2], ry: e[3] }, { cx: 200 - e[0], cy: e[1], rx: e[2], ry: e[3] }];
  const head = headPath(view === "front" ? H.front : H.back);

  const hairFront: { d: string; bun?: boolean }[] = [];
  if (fem) {
    if (view === "front") hairFront.push({ d: smoothPath([[100,7],[107.5,7.6],[113,11],[116.2,17.5],[116.8,24],[114.2,19.5],[109.5,15.6],[104,14],[100,14.6],[94,13.4],[88,15.2],[84.6,19],[83.2,24],[83.8,17.5],[87,11],[92.5,7.6]]) });
    else hairFront.push({ d: headPath([[100,7],[107.5,7.6],[113,11],[116.6,17.5],[117.4,25],[117,33],[115.4,40],[112,46],[106.4,50.4],[100,51.6]]) }, { d: "", bun: true });
  }

  const joints: JointMarker[] = [];
  Object.entries(JOINTS).forEach(([id, J]) => {
    if (J.view !== view) return;
    if (J.spine) {
      const [y0, y1] = J.spine, ticks: number[] = [];
      for (let y = y0 + 6; y < y1 - 2; y += 7) ticks.push(y);
      joints.push({ id, name: J.name, spine: { y0, y1, ticks } });
    } else {
      const circles: { cx: string; cy: number }[] = [];
      (J.pts || []).forEach((p) => {
        const q = tfPt(p, J.kind || "torso", gender);
        circles.push({ cx: q[0].toFixed(1), cy: q[1] }, { cx: (200 - q[0]).toFixed(1), cy: q[1] });
      });
      joints.push({ id, name: J.name, circles });
    }
  });

  return { view, patterns, sil, hairBehind, muscles, groups, abslines, contours, ears, head, hairFront, joints };
}
