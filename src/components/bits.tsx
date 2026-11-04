"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { RATING } from "@/lib/model";
import { resolveFrames, sceneSvg, fitBox, type Demo } from "@/lib/stick";
import { DEMOS } from "@/data/demos";
import type { Exercise, Gender } from "@/lib/types";
import { useActions } from "./context";

export const demoOf = (e: Exercise): Demo | null => (e.demo ? DEMOS[e.demo] ?? null : null);

export function Meter({ n, cls }: { n: number; cls: string }) {
  return (
    <span className={"mtr " + cls} title={n + "/5 · " + RATING[n]} aria-label={n + " of 5"}>
      {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "f" : undefined} />)}
    </span>
  );
}

export function AddButton({ id, size, picks }: { id: string; size: "sm" | "lg"; picks: string[] }) {
  const act = useActions();
  const i = picks.indexOf(id), on = i >= 0, label = on ? "Remove from compare" : "Add to compare";
  return (
    <button className={"addcmp " + size} type="button" aria-pressed={on} aria-label={label} title={label} onClick={() => act.togglePick(id)}>
      {on ? (<><b className="badge a">{i === 0 ? "A" : "B"}</b><span className="al">Added</span></>)
        : (<><span className="plus" aria-hidden="true">+</span><span className="al">Compare</span></>)}
    </button>
  );
}

export function PlayIcon({ playing }: { playing: boolean }) {
  return playing ? (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="2" width="3" height="10" rx="1" fill="currentColor" /><rect x="8.5" y="2" width="3" height="10" rx="1" fill="currentColor" /></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.2v9.6a.6.6 0 0 0 .9.5l7.6-4.8a.6.6 0 0 0 0-1L4.9 1.7a.6.6 0 0 0-.9.5z" fill="currentColor" /></svg>
  );
}

const thumbs = new Map<string, string>();
/** Static list thumbnail of an exercise's demo. */
export function Thumb({ e, gender }: { e: Exercise; gender: Gender }) {
  const demo = demoOf(e);
  if (!demo) return <span className="thumb"><span className="nodemo">No demo</span></span>;
  const key = e.demo + "|" + gender;
  let html = thumbs.get(key);
  if (html == null) {
    const R = resolveFrames(demo);
    html = sceneSvg(demo, R[Math.min(demo.thumb == null ? 1 : demo.thumb, R.length - 1)], gender);
    thumbs.set(key, html);
  }
  return <span className="thumb"><svg viewBox={fitBox(demo)} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} /></span>;
}

export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

/**
 * requestAnimationFrame loop for the form demos. Draws by calling onFrame(elapsedMs);
 * with reduced motion it calls onStill() once instead. Restarts whenever `key` changes,
 * and pauses while the tab is hidden.
 */
export function useLoop(onFrame: (ms: number) => void, onStill: () => void, key: string, reduce: boolean) {
  const s = useRef({ raf: 0, playing: false, start: 0, elapsed: 0, resume: false });
  const frame = useRef(onFrame), still = useRef(onStill);
  frame.current = onFrame;
  still.current = onStill;
  const [playing, setPlaying] = useState(false);

  const tick = useCallback(function loop() {
    const c = s.current;
    frame.current(c.elapsed + performance.now() - c.start);
    c.raf = requestAnimationFrame(loop);
  }, []);
  const play = useCallback(() => {
    const c = s.current;
    c.playing = true; c.start = performance.now();
    cancelAnimationFrame(c.raf); tick(); setPlaying(true);
  }, [tick]);
  const pause = useCallback(() => {
    const c = s.current;
    if (c.playing) c.elapsed += performance.now() - c.start;
    c.playing = false; cancelAnimationFrame(c.raf); setPlaying(false);
  }, []);
  const seek = useCallback((ms: number) => { pause(); s.current.elapsed = ms; }, [pause]);

  useEffect(() => {
    const c = s.current;
    c.elapsed = 0;
    if (reduce) { c.playing = false; setPlaying(false); still.current(); } else play();
    return () => { cancelAnimationFrame(c.raf); c.playing = false; };
  }, [key, reduce, play]);

  useEffect(() => {
    const onVis = () => {
      const c = s.current;
      if (document.hidden) { if (c.playing) { pause(); c.resume = true; } }
      else if (c.resume) { c.resume = false; play(); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [play, pause]);

  return { playing, play, pause, seek };
}
