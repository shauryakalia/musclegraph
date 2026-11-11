"use client";
import { memo, useMemo, useRef, useState } from "react";
import { JOINTS } from "@/lib/anatomy";
import { videoUrl } from "@/lib/model";
import { useDetail } from "@/lib/use-data";
import { STEP, orderFor, poseFrom, resolveFrames, sceneSvg, fitBox, type Demo } from "@/lib/stick";
import type { ExerciseCore, ExerciseDetail, Gender } from "@/lib/types";
import { AddButton, Meter, PlayIcon, demoOf, useLoop } from "./bits";
import { useActions, useEnv } from "./context";
import { Figs } from "./Figures";

interface Props { e: ExerciseCore; prev: ExerciseCore | null; next: ExerciseCore | null; picks: string[] }

/** One exercise: demo, muscles, setup, steps, cues, mistakes and actions. */
export const Detail = memo(function Detail({ e, prev, next, picks }: Props) {
  const { model, v, gender, reduceMotion } = useEnv();
  const act = useActions();
  const st = e.kind === "Stretch";
  const demo = demoOf(e);
  const labels = demo?.labels || ["Start", "Finish"];
  const hid = v.hiddenInBasic(e);
  const muscleName = (m: string) => model.data.muscles.find((x) => x.id === m)?.name ?? m;
  const dl = useDetail(e.id);
  const d: ExerciseDetail | null = dl && dl.status === "ok" ? dl.value : null;
  /** a rating shown for a unit is measured when a measured muscle inside it sets that rating */
  const measured = (u: string) => (v.adv ? e.measured.includes(u) : e.measured.some((m) => model.groupOf[m] === u && e.scores[m] === v.X(e)[u]));
  const rate = (u: string, cls: string) => (
    <li key={u}>{v.uName(u)}{measured(u) && <abbr className="emg" title="Rating taken from a published EMG study">EMG</abbr>}<Meter n={v.X(e)[u]} cls={cls} /></li>
  );
  const facts = [e.equipment && ["Equipment", e.equipment], e.level && ["Level", e.level], e.mechanics && ["Type", e.mechanics], d?.force && ["Force", d.force]].filter(Boolean) as string[][];
  const sources = d ? [...new Set(Object.values(d.basis).flat())].map((id) => model.data.sources.find((x) => x.id === id)).filter((x) => !!x) : [];

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
      {demo && <DetailDemo key={e.id + "|" + gender} e={e} demo={demo} labels={labels} gender={gender} reduce={reduceMotion} />}
      <Figs pfx="d" mini />
      <div className="d-mus">
        <div>
          <h3>{st ? "Main stretch" : "Primary"}</h3>
          <ul className="mlist">
            {v.P(e).length ? v.P(e).map((u) => rate(u, "pri")) : <li className="none">None in this view</li>}
          </ul>
        </div>
        <div>
          <h3>{st ? "Also stretches" : "Secondary"}</h3>
          <ul className="mlist sec">
            {v.S(e).length ? v.S(e).map((u) => rate(u, "sec")) : <li className="none">None worth noting</li>}
          </ul>
        </div>
      </div>
      {hid.length > 0 && <p className="hint">Also works <b>{hid.map(muscleName).join(", ")}</b>, shown in the Advanced view.</p>}
      {facts.length > 0 && <dl className="facts">{facts.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>}
      {v.adv && Object.keys(e.jointScores).length > 0 && (
        <section className="d-sec">
          <h3>Joints</h3>
          <ul className="mlist jlist">
            {Object.keys(e.jointScores).sort((a, b) => e.jointScores[b] - e.jointScores[a]).map((j) => (
              <li key={j}>
                <span className="jn">{JOINTS[j]?.name ?? j}{d?.jointActions[j] && <em>{d.jointActions[j]}</em>}</span>
                <Meter n={e.jointScores[j]} cls="jt" />
              </li>
            ))}
          </ul>
          <p className="hint">Joint scores show how much each joint moves or is loaded, from 1 (stabilises) to 5 (the main moving joint). They are estimated from the movement&apos;s joint mechanics, not measured per exercise.</p>
        </section>
      )}
      {dl && dl.status === "loading" && <p className="loading small" role="status">Loading instructions…</p>}
      {dl && dl.status === "error" && <p className="loading small" role="alert">Couldn&apos;t load the instructions ({dl.message}).</p>}
      {d && (<>
        {d.setup && <section className="d-sec"><h3>Setup</h3><p>{d.setup}</p></section>}
        {d.steps.length > 0 && (
          <section className="d-sec"><h3>How to do it</h3><ol className="steps">{d.steps.map((s, i) => <li key={i}><span>{s}</span></li>)}</ol></section>
        )}
        <div className="two">
          <section className="d-sec"><h3>Cues</h3><ul className="bul">{d.cues.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
          <section className="d-sec"><h3>Common mistakes</h3><ul className="bul bad">{d.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></section>
        </div>
        {d.note && <p className="note">{d.note}</p>}
        <section className="d-sec evidence">
          <h3>Where the ratings come from</h3>
          {e.measured.length > 0 ? (<>
            <p><b>{e.measured.length}</b> of this exercise&apos;s {Object.keys(e.scores).length} muscle ratings are taken from published EMG research (marked <abbr className="emg">EMG</abbr>); the rest are estimated from the movement&apos;s anatomy.</p>
            <ul className="bul">{sources.map((x) => x && <li key={x.id}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.label}</a> <span>{x.citation}</span></li>)}</ul>
          </>) : (
            <p>No published EMG study measured this exact exercise, so every rating is estimated from the movement&apos;s anatomy (which muscles drive the joints it moves). Treat the numbers as a guide for comparing exercises.</p>
          )}
          {d.source && <p className="src">Exercise catalogued from <a href={d.source.url} target="_blank" rel="noopener noreferrer">{d.source.name}</a>. Instructions and ratings on this page are our own.</p>}
        </section>
      </>)}
      <div className="acts">
        <a className="video" href={videoUrl(e, d?.videoSearch)} target="_blank" rel="noopener noreferrer">Watch a video demo <span aria-hidden="true">↗</span></a>
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

function DetailDemo({ e, demo, labels, gender, reduce }: { e: ExerciseCore; demo: Demo; labels: string[]; gender: Gender; reduce: boolean }) {
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
