import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./styles/globals.scss";

/* Archivo carries a width axis, so the display face can be pushed wide and
   heavy the way the reference lettering is. Plex Mono is the editorial
   counterweight — technical, small, tracked. Both self-host at build time. */
const display = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-display"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Frank Fu — Data · Product · Design",
  description:
    "Frank Fu is a hybrid data analyst, product manager, and UX designer in Los Angeles. I explore complex systems and turn them into clearer decisions, products, and experiences."
};

export const viewport: Viewport = {
  themeColor: "#0d0618"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
