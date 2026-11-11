import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import MuscleGraph from "@/components/MuscleGraph";
import { loadMuscleGraphData } from "@/lib/load-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muscle Graph",
  description:
    "Strength-training reference: see how each exercise is done and which muscles it trains, find exercises for any muscle, or compare two exercises muscle by muscle.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#111315" },
  ],
};

/* The muscle graph is rendered here, in the root layout, so it stays mounted while moving between
 * "/" and "/exercises/<id>/". Pages only add their own <title>/description. */
export default function RootLayout({ children }: { children: ReactNode }) {
  /* Only the small reference tables are embedded in the page. The exercise list (/data/index.json) and each
   * exercise's text (/data/ex/<id>.json) are fetched by the browser, so a 1,200-exercise database doesn't make
   * every page heavy. */
  const { data } = loadMuscleGraphData();
  const ref = { muscles: data.muscles, groups: data.groups, categories: data.categories, sources: data.sources };
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <MuscleGraph data={ref}>{children}</MuscleGraph>
      </body>
    </html>
  );
}
