"use client";
import { CAT, RATING, cat } from "@/lib/model";
import { JOINTS } from "@/lib/anatomy";
import { Meter } from "./bits";
import { useActions, useEnv, type Mode } from "./context";

interface Props {
  mode: Mode; hover: string | null; hoverJ: string | null; tap: string | null; tapJ: string | null;
  sel: string | null; muscle: string | null; joint: string | null; ca: string; cb: string;
}

const plural = (n: number, w: string) => n + " " + w + (n === 1 ? "" : "s");

/** The box under the muscle map that explains what is highlighted or hovered. */
export function Readout(p: Props) {
  const { model, v } = useEnv();
  const act = useActions();
  const EX = model.exercises;
  const jName = (j: string) => JOINTS[j]?.name ?? j;
  const cmp = p.mode === "compare";
  const mh = p.hover || (cmp ? p.tap : null), jh = p.hoverJ || (cmp ? p.tapJ : null);
  let body: React.ReactNode;

  if (jh) {
    const n = EX.filter((e) => e.joints.indexOf(jh) >= 0), d = n.filter((e) => e.kind).length;
    body = (<>
      <div className="ro-name">{jName(jh)}</div>
      <div className="ro-sub">{plural(d, "joint drill")}{n.length > d ? " and " + plural(n.length - d, "related exercise") : ""}{cmp ? "" : " · click to list them"}</div>
    </>);
  } else if (cmp) {
    const ea = model.byId[p.ca], eb = model.byId[p.cb];
    if (mh) {
      const a = v.X(ea)[mh] || 0, b = v.X(eb)[mh] || 0, c = cat(a, b);
      body = (<>
        <div className="ro-name">{v.uName(mh)}</div>
        {a || b ? (<>
          <div className="ro-cmp">
            <span><b className="badge a">A</b>{a ? <><Meter n={a} cls="a" /> {a}/5 {RATING[a]}</> : "Not worked"}</span>
            <span><b className="badge b">B</b>{b ? <><Meter n={b} cls="b" /> {b}/5 {RATING[b]}</> : "Not worked"}</span>
          </div>
          <div className="ro-sub"><i className={"sw c" + c} /> {CAT[c]}</div>
        </>) : <div className="ro-sub">Neither exercise works this much.</div>}
      </>);
    } else {
      body = (<>
        <div className="ro-name">Comparing</div>
        <div className="ro-cmp"><span><b className="badge a">A</b>{ea.name}</span><span><b className="badge b">B</b>{eb.name}</span></div>
        <div className="ro-sub">Red means A works the muscle harder, blue means B does, grey means even. Faded muscles are untouched by both. Hover or tap a muscle for its ratings.</div>
      </>);
    }
  } else if (p.hover) {
    const n = EX.filter((e) => v.trains(e, p.hover!)), np = n.filter((e) => (v.X(e)[p.hover!] || 0) >= 4).length;
    body = (<>
      <div className="ro-name">{v.uName(p.hover)}</div>
      <div className="ro-sub">{n.length ? plural(n.length, "exercise") + " · " + np + " as a primary mover" : "Not a main target of any exercise here"} · click to list them</div>
    </>);
  } else if (p.sel && model.byId[p.sel]) {
    const e = model.byId[p.sel], st = e.kind === "Stretch";
    const short = (ids: string[]) => ids.map(v.uShort).filter((x, i, a) => a.indexOf(x) === i).join(", ");
    body = (<>
      <div className="ro-name">{e.name}</div>
      {v.P(e).length > 0 && <div className="ro-sub"><span className="k pri">{st ? "Stretches" : "Primary"}</span>{short(v.P(e))}</div>}
      {v.S(e).length > 0 && <div className="ro-sub"><span className="k sec">{st ? "Also" : "Secondary"}</span>{short(v.S(e))}</div>}
      {v.adv && e.joints.length > 0 && <div className="ro-sub"><span className="k jk">Joints</span>{e.joints.map(jName).join(", ")}</div>}
    </>);
  } else if (p.muscle || p.joint) {
    if (p.muscle) {
      const n = EX.filter((e) => v.trains(e, p.muscle!)), np = n.filter((e) => (v.X(e)[p.muscle!] || 0) >= 4).length;
      body = (<>
        <div className="ro-name">{v.uName(p.muscle)}</div>
        <div className="ro-sub">{n.length ? "Trained by " + plural(n.length, "exercise") + ", " + np + " as a primary mover." : "No exercise here targets this directly."}</div>
      </>);
    } else {
      const n = EX.filter((e) => e.joints.indexOf(p.joint!) >= 0);
      body = (<>
        <div className="ro-name">{jName(p.joint!)}</div>
        <div className="ro-sub">{plural(n.length, "drill")} and exercises for this joint.</div>
      </>);
    }
    body = (<>{body}<button className="ro-jump" type="button" onClick={act.scrollToPanel}>Show the list ↓</button></>);
  } else {
    body = (<>
      <div className="ro-name muted">Tap or hover a {v.adv ? "muscle or joint" : "muscle"}</div>
      <div className="ro-sub">Click any muscle{v.adv ? " or joint" : ""} to list the exercises for it, or pick an exercise to light up what it works.</div>
    </>);
  }
  return <div className="readout" aria-live="polite">{body}</div>;
}
