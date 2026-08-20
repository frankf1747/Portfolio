import type { Metadata } from "next";

/* Shared <head> for the outreach paths under app/ — one directory per person
   or company I send the site to (app/biomarin, etc.), each rendering the
   identical Landing composition.

   Why a path and not ?utm_source=: Cloudflare Web Analytics records
   location.pathname and nothing else. Its beacon never reads location.href
   or location.search — grep beacon.min.js for either and you get zero hits —
   so a query-string tag is discarded in the visitor's browser before
   anything is sent, and every tagged visit lands in the dashboard as a plain
   "/" indistinguishable from the rest. A distinct path is the only signal
   that survives the trip, and it shows up as its own row under Paths.

   These must be real pages, not redirects. A redirect to "/" puts the
   visitor on "/", which is then what the beacon reports.

   Same page at a second URL is duplicate content, so keep it out of the
   index and point crawlers at the canonical one — these links are meant for
   one reader, not for search. */
export const inviteMetadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "https://frankfu.me/" }
};
