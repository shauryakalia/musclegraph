"use client";
import { memo, useEffect, useMemo, useRef } from "react";
import { CAT, SCALE_LAB, cat, uniq } from "@/lib/model";
import { orderFor, poseFrom, resolveFrames, sceneSvg, fitBox } from "@/lib/stick";
import type { Exercise } from "@/lib/types";
import { Meter, PlayIcon, demoOf, useLoop } from "./bits";
import { useActions, useEnv } from "./context";
import { Figs } from "./Figures";

interface Props { ca: string; cb: string; flash: { u: string; n: number; scroll: boolean } | null }

/** Side-by-side comparison of two exercises, muscle by muscle. */
export const Compare = memo(function Compare({ ca, cb, flash }: Props) {
  const { model, v, gender, reduceMotion } = useEnv();
  const act = useActions();
  const ea = model.byId[ca], eb = model.byId[cb], same = ca === cb, XA = v.X(ea), XB = v.X(eb);
  const ids = uniq(Object.keys(XA).concat(Object.keys(XB)));
  const shared = ids.filter((m) => XA[m] && XB[m]).sort((m, n) => Math.abs(XA[n] - XB[n]) - Math.abs(XA[m] - XB[m]) || Math.max(XA[n], XB[n]) - Math.max(XA[m], XB[m]));
  const onlyA = ids.filter((m) => XA[m] && !XB[m]).sort((m, n) => XA[n] - XA[m]);
  const onlyB = ids.filter((m) => XB[m] && !XA[m]).sort((m, n) => XB[n] - XB[m]);
  const winsA = shared.filter((m) => XA[m] > XB[m]).length, winsB = shared.filter((m) => XB[m] > XA[m]).length;

  // keep the flashed row visible when a muscle is tapped on the map
  useEffect(() => {
    if (!flash) return;
    const r = document.querySelector('.crow[data-u="' + flash.u + '"]');
    if (!r) return;
    if (flash.scroll) {
      const rect = r.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) r.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, [flash, reduceMotion]);

  const options = () =>
    model.data.categories.map((c) => (
      <optgroup key={c.id} label={c.name}>
        {model.exercises.filter((e) => e.category === c.id).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
      </optgroup>
    ));

  const rows = (list: string[]) =>
    list.map((u) => {
      const a = XA[u] || 0, b = XB[u] || 0, c = cat(a, b);
      return (
        <div key={u} className={"crow" + (flash && flash.u === u ? " flash" : "")} data-u={u} tabIndex={0}
          onClick={() => act.tapRow(u)} onMouseOver={() => act.highlight(u)}
          onMouseOut={(ev) => { if (!(ev.currentTarget as Element).contains(ev.relatedTarget as Node)) act.highlight(null); }}
          onFocus={() => act.highlight(u)}>
          <i className={"sw c" + c} />
          <span className="cn">{v.uName(u)}</span>
          <span className="cm">
            <span><b>A</b>{a ? <Meter n={a} cls="a" /> : <em>—</em>}</span>
            <span><b>B</b>{b ? <Meter n={b} cls="b" /> : <em>—</em>}</span>
          </span>
          <span className="cv">{CAT[c]}</span>
        </div>
      );
    });

  return (
    <section id="compare" aria-label="Compare two exercises">
      <h2 className="sec-title">Compare two exercises</h2>
      <p className="cmp-sub">{v.adv ? "Muscles" : "Muscle groups"} both exercises work are coloured by which one works them harder. Ratings run 1–5.</p>
      <div className="pick-row">
        <label className="pick"><span><b className="badge a">A</b>Exercise A</span>
          <select value={ca} onChange={(ev) => act.setCompare("a", ev.target.value)}>{options()}</select>
        </label>
        <button className="swap" type="button" aria-label="Swap A and B" title="Swap A and B" onClick={act.swapCompare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v14m0 0-3-3m3 3 3-3M17 20V6m0 0-3 3m3-3 3 3" /></svg>
        </button>
        <label className="pick"><span><b className="badge b">B</b>Exercise B</span>
          <select value={cb} onChange={(ev) => act.setCompare("b", ev.target.value)}>{options()}</select>
        </label>
      </div>
      {same && <p className="note">Both slots hold the same exercise. Pick a different one for A or B.</p>}
      <CompareDemos key={ca + "|" + cb + "|" + gender} ea={ea} eb={eb} gender={gender} reduce={reduceMotion} />
      <div className="cmp-stats">
        <div><b>{shared.length}</b>shared</div>
        <div><b>{winsA}</b>A works harder</div>
        <div><b>{winsB}</b>B works harder</div>
        <div><b>{onlyA.length} / {onlyB.length}</b>only A / only B</div>
      </div>
      <div className="scale" aria-label="Colour scale">
        <div className="scale-ends"><span>◀ A works it harder</span><span>B works it harder ▶</span></div>
        <div className="scale-bar">{[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} className={"c" + i} title={CAT[i]} />)}</div>
        <div className="scale-lab">{SCALE_LAB.map((l, i) => <span key={i}>{l}</span>)}</div>
      </div>
      <Figs pfx="c" mini />
      <div className="ctable">
        {shared.length ? (<><h3>Shared <span>{shared.length}</span></h3>{rows(shared)}</>)
          : (<><h3>Shared <span>0</span></h3><p className="empty-s">These two exercises have nothing in common in this view.</p></>)}
        {onlyA.length > 0 && (<><h3>Only in A · {ea.name} <span>{onlyA.length}</span></h3>{rows(onlyA)}</>)}
        {onlyB.length > 0 && (<><h3>Only in B · {eb.name} <span>{onlyB.length}</span></h3>{rows(onlyB)}</>)}
      </div>
      <p className="note">
        Ratings are estimates of how hard each exercise works (or, for stretches, stretches) a muscle in a hard set: 5 main target, 4 major, 3 moderate, 2 assists, 1 minor. They come from EMG and training studies and are for comparing, not exact values; range of motion, load, grip and stance all shift them.
        {v.adv ? "" : " In Basic view each group takes the highest rating of the muscles inside it."}
      </p>
    </section>
  );
});

function CompareDemos({ ea, eb, gender, reduce }: { ea: Exercise; eb: Exercise; gender: "male" | "female"; reduce: boolean }) {
  const refs = { a: useRef<SVGSVGElement>(null), b: useRef<SVGSVGElement>(null) };
  const slots = useMemo(() => ([["a", ea], ["b", eb]] as const).map(([k, e]) => {
    const demo = demoOf(e);
    const R = demo ? resolveFrames(demo) : null;
    return { k, e, demo, R, o: R ? orderFor(R.length) : [], initial: demo && R ? sceneSvg(demo, R[0], gender) : "" };
  }), [ea, eb, gender]);
  const loop = useLoop(
    (ms) => slots.forEach((s) => { const el = refs[s.k].current; if (el && s.demo && s.R) el.innerHTML = sceneSvg(s.demo, poseFrom(s.R, s.o, ms).r, gender); }),
    () => slots.forEach((s) => { const el = refs[s.k].current; if (el && s.demo && s.R) { const n = s.R.length; el.innerHTML = sceneSvg(s.demo, s.R[n - 1], gender, s.R[0]); } }),
    ea.id + eb.id + gender,
    reduce,
  );
  return (
    <>
      <div className="cmp-demos">
        {slots.map((s) => (
          <figure key={s.k} className="cdemo">
            {s.demo ? (
              <svg ref={refs[s.k]} viewBox={fitBox(s.demo)} role="img" aria-label={"Demo for " + s.e.name} dangerouslySetInnerHTML={{ __html: s.initial }} />
            ) : (
              <div className="nodemo">No demo yet</div>
            )}
            <figcaption><b className={"badge " + s.k}>{s.k.toUpperCase()}</b><span>{s.e.name}</span></figcaption>
          </figure>
        ))}
      </div>
      <div className="cmp-tools">
        <button className="play" type="button" aria-label={loop.playing ? "Pause demo" : "Play demo"} onClick={() => (loop.playing ? loop.pause() : loop.play())}>
          <PlayIcon playing={loop.playing} />
        </button>
        <span>Both demos loop side by side</span>
      </div>
    </>
  );
}
