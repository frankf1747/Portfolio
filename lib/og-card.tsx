import { ImageResponse } from "next/og";

/* Link-preview cards: paper ground, accent headline, ink byline — the site's
   palette at LinkedIn's 1.91:1. Generated at build time and written out as
   real .png files (see app/og), since Cloudflare types assets by extension. */
export const ogSize = { width: 1200, height: 630 };

/* Cut on a word boundary so the ellipsis never splits a word. */
function clip(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "")}…`;
}

export function ogCard({ kicker, headline, body }: { kicker: string; headline: string; body?: string }) {
  /* Step the headline down so long names stay inside the card: two lines
     at the large size, three at the smallest. */
  const size = headline.length > 40 ? 64 : headline.length > 22 ? 84 : 112;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#f5f3ec",
          color: "#262048",
          fontFamily: "monospace"
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4 }}>{kicker}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: size, lineHeight: 1.02, color: "#f2247a", fontWeight: 700 }}>
            {headline}
          </div>
          {body && (
            <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.35, maxWidth: 1000 }}>
              {clip(body, 125)}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <span>FRANK FU</span>
          <span>frankfu.me/progress</span>
        </div>
      </div>
    ),
    ogSize
  );
}
