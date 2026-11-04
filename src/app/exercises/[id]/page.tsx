import type { Metadata } from "next";
import { loadAtlasData } from "@/lib/load-data";
import { buildModel, makeView } from "@/lib/model";

/* One prerendered page per exercise in data/exercises.csv. The atlas in the root layout reads the
 * URL and opens that exercise; this file only provides the page list and each page's metadata. */

export const dynamicParams = false;

export function generateStaticParams() {
  return loadAtlasData().data.exercises.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const model = buildModel(loadAtlasData().data);
  const e = model.byId[id];
  if (!e) return { title: "Exercise Atlas" };
  const v = makeView(model, "basic");
  const primary = v.P(e).map(v.uName);
  const description =
    `${e.name} (${e.variant.charAt(0).toLowerCase() + e.variant.slice(1)})` +
    (primary.length ? `. Works: ${primary.join(", ")}.` : ".") +
    (e.setup ? " " + e.setup : "");
  return { title: `${e.name} · Exercise Atlas`, description: description.slice(0, 300) };
}

export default function ExercisePage() {
  return null;
}
