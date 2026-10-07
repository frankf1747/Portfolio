import { PRODUCTS, type Constraints } from "@/data/starbucks";

/* The Starbucks pipeline's back half, small enough to run in the reader's
   browser: deterministic filtering on the extracted constraints, then
   TF-IDF over each product's text, scored by cosine against the query.
   The front half (Llama 3.1 extracting the constraints) is not re-run
   here; the demo hands in the constraints the extractor is trained to
   produce. */

export type Product = {
  id: string;
  name: string;
  category: string;
  sub: string;
  temp: string;
  caffeine: number;
  cal: number;
  sugar: number;
  dairy: boolean;
  vegan: boolean;
  price: number;
  desc: string;
};

export const products: Product[] = PRODUCTS.map(([id, name, category, sub, temp, caffeine, cal, sugar, dairy, vegan, price, desc]) => ({
  id, name, category, sub, temp, caffeine, cal, sugar, dairy, vegan, price, desc
}));

/* the challenge's caffeine bands, read off the labelled training set */
export const caffeineLevel = (mg: number) => (mg === 0 ? "none" : mg <= 45 ? "low" : mg <= 150 ? "medium" : "high");

export const passes = (p: Product, c: Constraints) =>
  (!c.category || p.category === c.category) &&
  (!c.temperature || p.temp === c.temperature) &&
  (c.maxCalories === undefined || p.cal <= c.maxCalories) &&
  (c.maxSugar === undefined || p.sugar <= c.maxSugar) &&
  (c.maxPrice === undefined || p.price <= c.maxPrice) &&
  (!c.dairyFree || !p.dairy) &&
  (!c.vegan || p.vegan) &&
  (!c.caffeine || caffeineLevel(p.caffeine) === c.caffeine);

/* ---------- TF-IDF ---------- */

const STOP = new Set("a an and or the of to for with that's that is it i me my some something get give need want like please under less than no more max any got do you have just one".split(" "));
const tokens = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1 && !STOP.has(w));

const docs = products.map((p) => tokens(`${p.name} ${p.desc} ${p.category} ${p.sub} ${p.temp}`.replace(/_/g, " ")));
const df = new Map<string, number>();
docs.forEach((d) => new Set(d).forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)));
const idf = (w: string) => Math.log((products.length + 1) / ((df.get(w) ?? 0) + 1)) + 1;

const vec = (ws: string[]) => {
  const v = new Map<string, number>();
  ws.forEach((w) => v.set(w, (v.get(w) ?? 0) + 1));
  let norm = 0;
  v.forEach((tf, w) => {
    const x = tf * idf(w);
    v.set(w, x);
    norm += x * x;
  });
  norm = Math.sqrt(norm) || 1;
  v.forEach((x, w) => v.set(w, x / norm));
  return v;
};
const vecs = new Map(products.map((p, i) => [p.id, vec(docs[i])]));

const cosine = (a: Map<string, number>, b: Map<string, number>) => {
  let s = 0;
  a.forEach((x, w) => (s += x * (b.get(w) ?? 0)));
  return s;
};

export type Ranked = { p: Product; score: number };

export function run(query: string, c: Constraints): { kept: Set<string>; ranked: Ranked[] } {
  const kept = new Set(products.filter((p) => passes(p, c)).map((p) => p.id));
  const q = vec(tokens(query).filter((w) => df.has(w)));
  const ranked = products
    .filter((p) => kept.has(p.id))
    .map((p) => ({ p, score: cosine(q, vecs.get(p.id)!) }))
    .sort((a, b) => b.score - a.score || a.p.price - b.p.price);
  return { kept, ranked };
}

/* what the reader sees the extractor "understood" */
export const constraintChips = (c: Constraints) => {
  const out: string[] = [];
  if (c.category) out.push(c.category.replace("_", " "));
  if (c.temperature) out.push(c.temperature);
  if (c.caffeine) out.push(`${c.caffeine} caffeine`);
  if (c.maxCalories !== undefined) out.push(`≤ ${c.maxCalories} cal`);
  if (c.maxSugar !== undefined) out.push(`≤ ${c.maxSugar} g sugar`);
  if (c.maxPrice !== undefined) out.push(`≤ $${c.maxPrice.toFixed(2)}`);
  if (c.dairyFree) out.push("dairy-free");
  if (c.vegan) out.push("vegan");
  return out;
};

/* the same constraints as the extractor's JSON */
export const constraintJson = (c: Constraints) => {
  const o: Record<string, string | number | boolean> = {};
  if (c.category) o.category = c.category;
  if (c.temperature) o.temperature = c.temperature;
  if (c.caffeine) o.caffeine_level = c.caffeine;
  if (c.maxCalories !== undefined) o.max_calories = c.maxCalories;
  if (c.maxSugar !== undefined) o.max_sugar = c.maxSugar;
  if (c.maxPrice !== undefined) o.max_price = c.maxPrice;
  if (c.dairyFree) o.dairy_free = true;
  if (c.vegan) o.vegan = true;
  return o;
};
