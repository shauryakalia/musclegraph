"use client";
/* Browser-side loading of the split data files (see scripts/build-public-data.ts):
 *   /data/index.json     every exercise's slim record, fetched once
 *   /data/ex/<id>.json   one exercise's text and provenance, fetched when it is opened */
import { useEffect, useState } from "react";
import { unpackExercise, type PackedIndex } from "./pack";
import type { ExerciseCore, ExerciseDetail } from "./types";

export type Loaded<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; value: T };

let indexPromise: Promise<ExerciseCore[]> | null = null;
export function loadIndex(): Promise<ExerciseCore[]> {
  if (!indexPromise) {
    indexPromise = fetch("/data/index.json")
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<PackedIndex>; })
      .then((j) => j.exercises.map(unpackExercise))
      .catch((err) => { indexPromise = null; throw err; });
  }
  return indexPromise;
}

export function useIndex(): Loaded<ExerciseCore[]> {
  const [state, setState] = useState<Loaded<ExerciseCore[]>>({ status: "loading" });
  useEffect(() => {
    let live = true;
    loadIndex().then(
      (value) => live && setState({ status: "ok", value }),
      (err) => live && setState({ status: "error", message: String(err?.message || err) }),
    );
    return () => { live = false; };
  }, []);
  return state;
}

const details = new Map<string, ExerciseDetail>();
/** the text and provenance of one exercise; `null` id = nothing to load */
export function useDetail(id: string | null): Loaded<ExerciseDetail> | null {
  const [state, setState] = useState<{ id: string; r: Loaded<ExerciseDetail> } | null>(null);
  useEffect(() => {
    if (!id) return;
    const hit = details.get(id);
    if (hit) { setState({ id, r: { status: "ok", value: hit } }); return; }
    let live = true;
    setState({ id, r: { status: "loading" } });
    fetch(`/data/ex/${encodeURIComponent(id)}.json`)
      .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json() as Promise<ExerciseDetail>; })
      .then((d) => { details.set(id, d); if (live) setState({ id, r: { status: "ok", value: d } }); })
      .catch((err) => { if (live) setState({ id, r: { status: "error", message: String(err?.message || err) } }); });
    return () => { live = false; };
  }, [id]);
  if (!id) return null;
  const hit = details.get(id);
  if (hit) return { status: "ok", value: hit };
  return state && state.id === id ? state.r : { status: "loading" };
}
