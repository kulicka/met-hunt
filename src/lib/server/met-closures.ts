import "server-only";
import type { ClosureList, ClosureOverride } from "@/data/closures";

// Reads The Met's gallery closures page, the source of truth for closures, so the
// map greys out closed rooms without anyone editing data/closures.json. There is
// no closures API, so this parses the page text: "Gallery 451", "Galleries 813–814",
// "Galleries 708, 721, 773–774, and 774A". Runs when a server starts (see
// src/instrumentation.ts) and again when the result is older than MAX_AGE_MS. If the
// page can't be read or no gallery numbers are found, the last good result (or
// data/closures.json) is used instead. Set CLOSURES_SYNC=off to turn it off.

export const CLOSURES_PAGE = process.env.MET_CLOSURES_URL || "https://www.metmuseum.org/plan-your-visit/gallery-closures";
const MAX_AGE_MS = 3 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;
/** A range wider than this is a misread, not a closure. */
const MAX_RANGE = 40;

const ENTITIES: Record<string, string> = { amp: "&", nbsp: " ", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", quot: '"', apos: "'" };

/** Visible text of an HTML page, with scripts, styles and tags removed. */
export function pageText(html: string): string {
  return html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e.toLowerCase()] ?? m),
    )
    .replace(/\s+/g, " ")
    .trim();
}

const NUMBER = String.raw`\d{3}[A-Z]?`;
const LIST = new RegExp(String.raw`\bGaller(?:y|ies)\s+(${NUMBER}(?:\s*(?:,?\s*and\b|,|[–—-])\s*${NUMBER})*)`, "g");

/** "773–774, and 774A" → 773, 774, 774A. */
export function expandGalleries(list: string): string[] {
  const out: string[] = [];
  for (const part of list.split(/\s*(?:,?\s*\band\b|,)\s*/)) {
    const [a, b] = part.split(/\s*[–—-]\s*/);
    if (!a) continue;
    if (b && /^\d+$/.test(a) && /^\d+$/.test(b) && Number(b) > Number(a) && Number(b) - Number(a) <= MAX_RANGE) {
      for (let n = Number(a); n <= Number(b); n++) out.push(String(n));
    } else {
      out.push(a, ...(b ? [b] : []));
    }
  }
  return out;
}

/** Closures listed on the page, or null when it doesn't look like the closures page. */
export function parseClosuresPage(html: string, checkedAt: string): ClosureList | null {
  const text = pageText(html);
  const start = text.search(/Gallery Closures/i);
  if (start < 0) return null;
  const body = text.slice(start);
  const updated = body.match(/Last updated ([A-Z][a-z]+ \d{1,2}(?: at [\d:]+ ?[AP]M)?)/)?.[1];
  const galleries = new Set<string>();
  for (const m of body.matchAll(LIST)) for (const g of expandGalleries(m[1])) galleries.add(g);
  if (galleries.size === 0) return null;
  const note = `Listed on The Met’s gallery closures page${updated ? ` (last updated ${updated})` : ""}.`;
  const closures: ClosureOverride[] = [...galleries]
    .sort()
    .map((galleryId) => ({ galleryId, status: "closed", note, sourceUrl: CLOSURES_PAGE }));
  return { checkedAt, sourceUrl: CLOSURES_PAGE, closures };
}

let live: ClosureList | null = null;
let fetchedAt = 0;
let lastTry = 0;
let running: Promise<void> | null = null;

/** The latest closures read from the page, or null if none has been read yet. */
export const liveClosures = () => live;

export const isStale = () => Date.now() - fetchedAt > MAX_AGE_MS && Date.now() - lastTry > RETRY_MS;

export function refreshClosures(f: typeof fetch = fetch): Promise<void> {
  if (process.env.CLOSURES_SYNC === "off") return Promise.resolve();
  return (running ??= (async () => {
    lastTry = Date.now();
    try {
      const res = await f(CLOSURES_PAGE, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
        headers: { "User-Agent": "met-hunt (kids' scavenger hunt; reads gallery closures)", Accept: "text/html" },
      });
      if (!res.ok) throw new Error(`closures page ${res.status}`);
      const list = parseClosuresPage(await res.text(), new Date().toISOString());
      if (!list) throw new Error("no gallery numbers found on the closures page");
      live = list;
      fetchedAt = Date.now();
      console.log(`[closures] ${list.closures.length} closed galleries read from The Met's page`);
    } catch (error) {
      console.warn(`[closures] keeping the previous list: ${(error as Error).message}`);
    } finally {
      running = null;
    }
  })());
}

/** For tests. */
export function resetClosuresSync() {
  live = null;
  fetchedAt = lastTry = 0;
  running = null;
}
