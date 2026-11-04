"use client";
import { memo, useMemo, useRef, useState } from "react";
import { JOINTS } from "@/lib/anatomy";
import { videoUrl } from "@/lib/model";
import { STEP, orderFor, poseFrom, resolveFrames, sceneSvg, fitBox, type Demo } from "@/lib/stick";
import type { Exercise, Gender } from "@/lib/types";
import { AddButton, Meter, PlayIcon, demoOf, useLoop } from "./bits";
import { useActions, useEnv } from "./context";
import { Figs } from "./Figures";

interface Props { e: Exercise; prev: Exercise | null; next: Exercise | null; picks: string[] }

/** One exercise: demo, muscles, setup, steps, cues, mistakes and actions. */
export const Detail = memo(function Detail({ e, prev, next, picks }: Props) {
  const { model, v, gender, reduceMotion } = useEnv();
  const act = useActions();
  const st = e.kind === "Stretch";
  const demo = demoOf(e);
  const labels = demo?.labels || ["Start", "Finish"];
  const hid = v.hiddenInBasic(e);
  const muscleName = (m: string) => model.data.muscles.find((x) => x.id === m)?.name ?? m;

  return (
    <article id="detail">
      <button className="back" type="button" onClick={() => act.closeDetail(true)}>← All exercises</button>
      <div className="d-sess">
        <span>{model.categoryName[e.category]}</span>
        {e.kind && <span className="kind">{e.kind}</span>}
        {v.adv && e.joints.map((j) => <span key={j} className="jtag">{JOINTS[j].name}</span>)}
      </div>
      <h2>{e.name}</h2>
      <p className="d-var">{e.variant}</p>
      {demo ? (
        <DetailDemo key={e.id + "|" + gender} e={e} demo={demo} labels={labels} gender={gender} reduce={reduceMotion} />
      ) : (
        <div className="demo"><div className="nodemo">No animated demo for this exercise yet.</div></div>
      )}
      <Figs pfx="d" mini />
      <div className="d-mus">
        <div>
          <h3>{st ? "Main stretch" : "Primary"}</h3>
          <ul className="mlist">
            {v.P(e).length ? v.P(e).map((u) => <li key={u}>{v.uName(u)}<Meter n={v.X(e)[u]} cls="pri" /></li>) : <li className="none">None in this view</li>}
          </ul>
        </div>
        <div>
          <h3>{st ? "Also stretches" : "Secondary"}</h3>
          <ul className="mlist sec">
            {v.S(e).length ? v.S(e).map((u) => <li key={u}>{v.uName(u)}<Meter n={v.X(e)[u]} cls="sec" /></li>) : <li className="none">None worth noting</li>}
          </ul>
        </div>
      </div>
      {hid.length > 0 && <p className="hint">Also works <b>{hid.map(muscleName).join(", ")}</b>, shown in the Advanced view.</p>}
      {e.setup && <section className="d-sec"><h3>Setup</h3><p>{e.setup}</p></section>}
      {e.steps.length > 0 && (
        <section className="d-sec"><h3>How to do it</h3><ol className="steps">{e.steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol></section>
      )}
      <div className="two">
        <section className="d-sec"><h3>Cues</h3><ul className="bul">{e.cues.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
        <section className="d-sec"><h3>Common mistakes</h3><ul className="bul bad">{e.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
      </div>
      {e.note && <p className="note">{e.note}</p>}
      <div className="acts">
        <a className="video" href={videoUrl(e)} target="_blank" rel="noopener noreferrer">Watch a video demo <span aria-hidden="true">↗</span></a>
        <AddButton id={e.id} size="lg" picks={picks} />
        <button className="cmpbtn" type="button" onClick={() => act.compareClosest(e.id)}>Compare with closest match</button>
      </div>
      <nav className="pn">
        <button type="button" disabled={!prev} onClick={() => prev && act.openDetail(prev.id)}>‹ {prev ? prev.name : ""}</button>
        <button type="button" disabled={!next} onClick={() => next && act.openDetail(next.id)}>{next ? next.name : ""} ›</button>
      </nav>
    </article>
  );
});

function DetailDemo({ e, demo, labels, gender, reduce }: { e: Exercise; demo: Demo; labels: string[]; gender: Gender; reduce: boolean }) {
  const svg = useRef<SVGSVGElement>(null);
  const R = resolveFrames(demo), order = orderFor(R.length);
  const [phase, setPhase] = useState(0);
  const ph = useRef(0);
  // first pose is rendered on the server so the page has a figure before JavaScript runs
  const initial = useMemo(() => sceneSvg(demo, R[0], gender), [demo, R, gender]);
  const draw = (r: Parameters<typeof sceneSvg>[1], k: number, ghost?: Parameters<typeof sceneSvg>[3]) => {
    if (svg.current) svg.current.innerHTML = sceneSvg(demo, r, gender, ghost);
    if (k !== ph.current) { ph.current = k; setPhase(k); }
  };
  const loop = useLoop(
    (ms) => { const p = poseFrom(R, order, ms); draw(p.r, p.ph); },
    () => { const n = R.length; draw(R[n - 1], n - 1, R[0]); },
    e.id + gender,
    reduce,
  );
  const showPhase = (k: number) => { loop.seek(order.indexOf(k) * STEP); draw(R[k], k); };

  return (
    <div className="demo">
      <svg ref={svg} viewBox={fitBox(demo)} role="img" aria-label={"Animated demo for " + e.name} dangerouslySetInnerHTML={{ __html: initial }} />
      <div className="demo-bar">
        <button className="play" type="button" aria-label={loop.playing ? "Pause demo" : "Play demo"} onClick={() => (loop.playing ? loop.pause() : loop.play())}>
          <PlayIcon playing={loop.playing} />
        </button>
        <div className="phases">
          {labels.map((l, k) => <button key={k} className={"ph" + (phase === k ? " on" : "")} type="button" onClick={() => showPhase(k)}>{l}</button>)}
        </div>
        <span className="dv">{demo.demoView || "Side view"}</span>
      </div>
    </div>
  );
}
