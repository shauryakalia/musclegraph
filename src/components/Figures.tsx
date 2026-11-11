"use client";
import { Fragment, memo, useEffect, useMemo, useState, type MouseEvent } from "react";
import { buildFigure, type View } from "@/lib/anatomy";
import { useActions, useEnv, usePaint } from "./context";

const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

/** Front + back figures with hover/click handling. `pfx` keeps pattern ids unique per copy. */
export const Figs = memo(function Figs({ pfx, mini }: { pfx: string; mini?: boolean }) {
  const act = useActions();
  /* the figures are drawn in the browser only, which keeps every prerendered page small */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const target = (ev: MouseEvent) => {
    const el = ev.target as Element;
    const j = el.closest?.(".jt");
    if (j) return { kind: "joint" as const, id: j.getAttribute("data-j")! };
    const m = el.closest?.(".m");
    if (m) return { kind: "muscle" as const, id: m.getAttribute("data-m")! };
    return null;
  };
  return (
    <div
      className={"figs" + (mini ? " mini" : "")}
      data-pfx={mini ? pfx : undefined}
      onMouseOver={(ev) => { if (!canHover()) return; const t = target(ev); if (t) act.hover(t.kind, t.id); }}
      onMouseOut={(ev) => { const t = target(ev); if (t) act.hover(t.kind, null); }}
      onClick={(ev) => { const t = target(ev); if (t) act.pickOnMap(t.kind, t.id, !!mini); }}
    >
      <figure><div className="fig">{ready && <Figure view="front" pfx={pfx} />}</div><figcaption>Front</figcaption></figure>
      <figure><div className="fig">{ready && <Figure view="back" pfx={pfx} />}</div><figcaption>Back</figcaption></figure>
    </div>
  );
});

function Figure({ view, pfx }: { view: View; pfx: string }) {
  const { model, v, gender, level } = useEnv();
  const paint = usePaint();
  const groupOf = (m: string) => model.groupOf[m] ?? null;
  // geometry only depends on view, body type and level
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fig = useMemo(() => buildFigure(view, pfx, gender, level, groupOf), [view, pfx, gender, level, model]);
  const basic = level === "basic";

  const mCls = (id: string) => {
    const u = v.unitOf(id);
    if (!u) return "m" + (basic ? " bm" : "") + " off";
    return "m" + (basic ? " bm" : "") + (paint.cls[u] ? " " + paint.cls[u] : "") + (paint.hl === u ? " hl" : "");
  };
  const fCls = (id: string) => "fib" + (v.unitOf(id) ? "" : " off");
  const title = (id: string) => { const u = v.unitOf(id); return u ? v.uName(u) : ""; };

  return (
    <svg viewBox="0 0 200 420" role="img" aria-label={(view === "front" ? "Front" : "Back") + " view of the " + gender + " muscles"}>
      <defs>
        {fig.patterns.map((p) => (
          <pattern key={p.id} id={p.id} patternUnits="userSpaceOnUse" width="2.4" height="2.4" patternTransform={"rotate(" + p.angle + ")"}>
            <line x1="0.6" y1="0" x2="0.6" y2="2.4" className="fiber" />
          </pattern>
        ))}
      </defs>
      <path className="sil" d={fig.sil} />
      {fig.hairBehind && <path className="hair" d={fig.hairBehind} />}
      {fig.muscles.map((m, i) => (
        <Fragment key={i}>
          <path className={mCls(m.id)} data-m={m.id} d={m.d}><title>{title(m.id)}</title></path>
          <path className={fCls(m.id)} data-m={m.id} d={m.d} fill={"url(#" + m.pattern + ")"} />
        </Fragment>
      ))}
      {fig.groups.map((g, i) => (
        <g className="bg" key={i}>
          {g.shapes.map((s, k) => <path key={"o" + k} className="bo" d={s.d} />)}
          {g.shapes.map((s, k) => <path key={"f" + k} className={mCls(s.id)} data-m={s.id} d={s.d}><title>{title(s.id)}</title></path>)}
          {g.shapes.map((s, k) => <path key={"b" + k} className={fCls(s.id)} data-m={s.id} d={s.d} fill={"url(#" + s.pattern + ")"} />)}
        </g>
      ))}
      {fig.abslines.map((d, i) => <path key={"a" + i} className="absline" d={d} />)}
      {fig.contours.map((d, i) => <path key={"c" + i} className="contour" d={d} />)}
      {fig.ears.map((e, i) => <ellipse key={"e" + i} className="sil" cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} />)}
      <path className="sil head" d={fig.head} />
      {fig.hairFront.map((h, i) => (h.bun ? <ellipse key={"h" + i} className="hair" cx="100" cy="47" rx="8" ry="6.4" /> : <path key={"h" + i} className="hair" d={h.d} />))}
      <g className="joints">
        {fig.joints.map((j) => (
          <g key={j.id} className={"jt" + (paint.activeJoints.indexOf(j.id) >= 0 ? " on" : "")} data-j={j.id}>
            <title>{j.name}</title>
            {j.spine ? (
              <>
                <rect x="96.2" y={j.spine.y0} width="7.6" height={j.spine.y1 - j.spine.y0} rx="3.8" className="jt-shape" />
                {j.spine.ticks.map((y) => <line key={y} x1="97.6" x2="102.4" y1={y} y2={y} className="jt-tick" />)}
              </>
            ) : (
              j.circles!.map((c, k) => <circle key={k} cx={c.cx} cy={c.cy} r="4.6" className="jt-shape" />)
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
