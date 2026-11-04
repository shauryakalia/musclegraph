import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Atlas from "@/components/Atlas";
import { loadAtlasData } from "@/lib/load-data";
import "./globals.css";

export const metadata: Metadata = {
  title: "Exercise Atlas",
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

/* The atlas is rendered here, in the root layout, so it stays mounted while moving between
 * "/" and "/exercises/<id>/". Pages only add their own <title>/description. */
export default function RootLayout({ children }: { children: ReactNode }) {
  const { data } = loadAtlasData();
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Atlas data={data}>{children}</Atlas>
      </body>
    </html>
  );
}
