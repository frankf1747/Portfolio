/* Link previews for /progress?p=<slug>.

   The site is a static export, and ?p= is read in the browser, so every
   project shares /progress.html. Its tags describe the list page. Crawlers
   (LinkedIn, Slack, iMessage) never run scripts, so this Worker rewrites
   those tags on the way out. Name and description are read live, and the
   image is the card built for that slug (app/og/progress). Everything else
   is served straight from the static assets. */

interface Env {
  ASSETS: { fetch(req: Request | string): Promise<Response> };
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

type Project = { slug: string; name: string; description: string };

declare const HTMLRewriter: any;

async function project(env: Env, slug: string): Promise<Project | null> {
  const url = `${env.SUPABASE_URL}/rest/v1/projects?select=slug,name,description&slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Project[];
  return rows[0] ?? null;
}

const setContent = (value: string) => ({
  element(el: any) {
    el.setAttribute("content", value);
  }
});

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const page = await env.ASSETS.fetch(req);
    const url = new URL(req.url);
    const slug = url.searchParams.get("p");
    if (url.pathname.replace(/\/$/, "") !== "/progress" || !slug || !page.ok) return page;

    const p = await project(env, slug).catch(() => null);
    if (!p) return page;

    const card = await env.ASSETS.fetch(new URL(`/og/progress/${p.slug}.png`, url).toString());
    const image = card.ok ? `${url.origin}/og/progress/${p.slug}.png` : null;
    const title = `${p.name} · Frank Fu`;
    const link = `${url.origin}/progress?p=${encodeURIComponent(p.slug)}`;

    let rw = new HTMLRewriter()
      .on("title", { element: (el: any) => el.setInnerContent(title) })
      .on('meta[name="description"]', setContent(p.description))
      .on('meta[property="og:title"]', setContent(title))
      .on('meta[name="twitter:title"]', setContent(title))
      .on('meta[property="og:description"]', setContent(p.description))
      .on('meta[name="twitter:description"]', setContent(p.description))
      .on('meta[property="og:url"]', setContent(link))
      .on('meta[property="og:image:alt"]', setContent(title))
      .on('meta[name="twitter:image:alt"]', setContent(title));
    if (image) {
      rw = rw
        .on('meta[property="og:image"]', setContent(image))
        .on('meta[name="twitter:image"]', setContent(image));
    }

    /* The rewritten page differs per ?p=, so it must not be cached as the
       one /progress response. */
    const out = rw.transform(page);
    const headers = new Headers(out.headers);
    headers.set("cache-control", "public, max-age=300");
    headers.append("vary", "accept-encoding");
    return new Response(out.body, { status: out.status, headers });
  }
};
