import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Archivo } from "next/font/google";
import "./styles/globals.scss";

/* §3 substitutes: display/UI → IBM Plex Mono (for GT Pressura),
   body/h2 → Archivo (for Monument Grotesk).

   Note on metrics: GT Pressura Mono is unusually narrow (~0.5em
   advance), which is what lets §3's literal 245rem carry a 13-character
   line inside the 110% overture frame. Plex is 0.6em and Martian Mono —
   the other named free substitute — is 0.70em, so both overflow at the
   literal size. --mono-fit in _tokens.scss corrects for that; see there. */
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-mono"
});

const body = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Frank Fu - A Data/Product Guy",
  description:
    "Frank Fu works at both ends of the same job: scoping a fuzzy problem, finding what is causing it, then building the thing that fixes it — and measuring whether people keep using it."
};

export const viewport: Viewport = {
  themeColor: "#F5F3EC"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${body.variable}`} data-touch="false">
      <body>{children}</body>
    </html>
  );
}
