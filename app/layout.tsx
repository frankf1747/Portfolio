import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./styles/globals.scss";

/* Two voices, per the wireframe: Archivo (the "grot") for display
   headings, IBM Plex Mono for everything else — UI text and the giant
   uppercase statements alike. */
const grot = Archivo({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  variable: "--font-grot"
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "Frank Fu — Product designer & design engineer",
  description:
    "Frank Fu is a product designer and design engineer. Interfaces drawn first, built right."
};

export const viewport: Viewport = {
  themeColor: "#F7F4EC"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${grot.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
