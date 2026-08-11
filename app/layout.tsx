import type { Metadata, Viewport } from "next";
import {
  Sedgwick_Ave_Display,
  Permanent_Marker,
  Allerta_Stencil,
  IBM_Plex_Mono
} from "next/font/google";
import "./styles/globals.scss";

/* Four voices, one wall:
   Sedgwick Ave Display — the throw-up lettering (drawn after NYC handstyles);
   Permanent Marker — tags and signatures;
   Allerta Stencil — sprayed municipal stencils (nav, controls);
   IBM Plex Mono — the pasted-paper small print. */
const piece = Sedgwick_Ave_Display({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-piece"
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marker"
});

const stencil = Allerta_Stencil({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-stencil"
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
  themeColor: "#120d2e"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${piece.variable} ${marker.variable} ${stencil.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
