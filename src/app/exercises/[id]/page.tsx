import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadMuscleGraphData } from "@/lib/load-data";

/* One prerendered page per exercise. The muscle graph in the root layout reads the URL and opens that
 * exercise in the browser; this file lists the pages, sets each page's metadata, and adds a plain-HTML copy
 * of the exercise for visitors and crawlers without JavaScript. */

export const dynamicParams = false;

export function generateStaticParams() {
  return loadMuscleGraphData().data.exercises.map((e) => ({ id: e.id }));
}

const find = (id: string) => loadMuscleGraphData().data.exercises.find((e) => e.id === id);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = find(id);
  if (!e) return { title: "Muscle Graph" };
  const { muscles } = loadMuscleGraphData().data;
  const name = (m: string) => muscles.find((x) => x.id === m)?.name ?? m;
  const primary = Object.keys(e.scores).filter((m) => e.scores[m] >= 4).map(name);
  const description =
    `${e.name}${e.variant ? ` (${e.variant.charAt(0).toLowerCase() + e.variant.slice(1)})` : ""}` +
    (primary.length ? `. Works: ${primary.join(", ")}.` : ".") +
    (e.setup ? " " + e.setup : "");
  return { title: `${e.name} · Muscle Graph`, description: description.slice(0, 300) };
}

export default async function ExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = find(id);
  if (!e) notFound();
  const { muscles } = loadMuscleGraphData().data;
  const name = (m: string) => muscles.find((x) => x.id === m)?.name ?? m;
  const ranked = Object.keys(e.scores).sort((a, b) => e.scores[b] - e.scores[a]);
  return (
    <noscript>
      <article className="nojs">
        <h2>{e.name}</h2>
        <p>{[e.variant, e.level].filter(Boolean).join(" · ")}</p>
        <h3>Muscles worked</h3>
        <ul>{ranked.map((m) => <li key={m}>{name(m)}: {e.scores[m]}/5</li>)}</ul>
        {e.setup && (<><h3>Setup</h3><p>{e.setup}</p></>)}
        {e.steps.length > 0 && (<><h3>How to do it</h3><ol>{e.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></>)}
        {e.cues.length > 0 && (<><h3>Cues</h3><ul>{e.cues.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
        {e.mistakes.length > 0 && (<><h3>Common mistakes</h3><ul>{e.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></>)}
        <p><a href="/">All exercises</a></p>
      </article>
    </noscript>
  );
}
