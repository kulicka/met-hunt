import "server-only";
import { quests } from "@/data/hidden-treasures/quests";
import { reveals } from "@/data/hidden-treasures/reveals";
import type { QuestReveal } from "@/data/types";
import type { ArtworkCheck, ArtworkStatus, ArtworkStatusList } from "@/lib/artworks";

// Looks up each quest artwork in The Met's open Collection API
// (https://metmuseum.github.io/, no key, 80 req/s) to see whether it is on view
// and in the gallery the quest expects. Runs when a server starts (see
// src/instrumentation.ts) and again when the result is older than MAX_AGE_MS.
// Gallery closures are not in the API; those stay in data/closures.json.

const API = process.env.MET_API_BASE || "https://collectionapi.metmuseum.org/public/collection";
const MAX_AGE_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const TIMEOUT_MS = 8000;
const CANDIDATES = 15;

interface MetObject {
  objectID: number;
  title?: string;
  artistDisplayName?: string;
  GalleryNumber?: string;
  isPublicDomain?: boolean;
  primaryImageSmall?: string;
  objectURL?: string;
}

type Fetch = typeof fetch;

async function getJson<T>(f: Fetch, path: string): Promise<T> {
  const res = await f(`${API}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`Met API ${res.status} for ${path}`);
  return (await res.json()) as T;
}

async function search(f: Fetch, params: Record<string, string>, limit = CANDIDATES): Promise<number[]> {
  const qs = new URLSearchParams({ ...params, limit: String(limit) });
  const body = await getJson<{ objectIDs?: number[] | null }>(f, `/v1.1/search?${qs}`);
  return body.objectIDs ?? [];
}

/** Lowercase, no accents or punctuation, so "Vétheuil" matches "Vetheuil". */
export const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const surname = (artist: string) => normalize(artist).split(" ").pop() ?? "";

export function isMatch(reveal: QuestReveal, obj: MetObject) {
  const title = normalize(obj.title ?? "");
  const wanted = normalize(reveal.artwork);
  const titleOk = title === wanted || title.startsWith(`${wanted} `) || wanted.startsWith(`${title} `);
  return titleOk && normalize(obj.artistDisplayName ?? "").includes(surname(reveal.artist));
}

async function findObject(f: Fetch, reveal: QuestReveal): Promise<MetObject | null> {
  if (reveal.metObjectId) return getJson<MetObject>(f, `/v1/objects/${reveal.metObjectId}`);
  for (const id of await search(f, { q: reveal.artwork, hasImages: "true" })) {
    const obj = await getJson<MetObject>(f, `/v1/objects/${id}`);
    if (isMatch(reveal, obj)) return obj;
  }
  return null;
}

export async function checkArtwork(f: Fetch, reveal: QuestReveal): Promise<ArtworkStatus> {
  const expectedGallery = quests.find((q) => q.id === reveal.id)?.gallery ?? "";
  const base = { questId: reveal.id, expectedGallery };
  try {
    const obj = await findObject(f, reveal);
    if (!obj) return { ...base, check: "not_found" };
    const onView = (await search(f, { q: reveal.artwork, isOnView: "true" }, 100)).includes(obj.objectID);
    const galleryNumber = obj.GalleryNumber?.trim() || undefined;
    let check: ArtworkCheck = "ok";
    if (!onView) check = "off_view";
    else if (galleryNumber && galleryNumber !== expectedGallery) check = "moved";
    return {
      ...base,
      check,
      galleryNumber,
      objectId: obj.objectID,
      objectUrl: obj.objectURL || undefined,
      imageUrl: obj.isPublicDomain && obj.primaryImageSmall ? obj.primaryImageSmall : undefined,
    };
  } catch {
    return { ...base, check: "error" };
  }
}

export async function checkAllArtworks(f: Fetch = fetch): Promise<ArtworkStatusList> {
  const artworks: ArtworkStatus[] = [];
  // One artwork at a time keeps us far below the API's rate limit.
  for (const reveal of reveals) artworks.push(await checkArtwork(f, reveal));
  return { checkedAt: new Date().toISOString(), artworks };
}

// Kept in memory per server. Fly machines stop when idle, so each cold start
// checks again; nothing needs to be written to disk. Held on globalThis because
// Next bundles instrumentation and route handlers as separate module instances.
const store = ((globalThis as { __metArtworks?: { latest: ArtworkStatusList; running: Promise<ArtworkStatusList> | null } }).__metArtworks ??= {
  latest: { checkedAt: null, artworks: [] },
  running: null,
});

export const artworkStatus = () => store.latest;

export function refreshArtworkStatus(f: Fetch = fetch): Promise<ArtworkStatusList> {
  store.running ??= checkAllArtworks(f)
    .then((list) => {
      store.latest = list;
      for (const a of list.artworks) {
        if (a.check !== "ok") {
          console.warn(`[artworks] quest ${a.questId}: ${a.check}${a.galleryNumber ? ` (Met lists gallery ${a.galleryNumber}, quest expects ${a.expectedGallery})` : ""}`);
        }
      }
      console.log(`[artworks] checked ${list.artworks.length}: ${list.artworks.filter((a) => a.check === "ok").length} ok`);
      return list;
    })
    .finally(() => {
      store.running = null;
    });
  return store.running;
}

/** Old enough to check again: after 6 hours, or 10 minutes if the API couldn't be reached. */
export function isStale(list: ArtworkStatusList, now = Date.now()) {
  if (!list.checkedAt) return true;
  const age = now - Date.parse(list.checkedAt);
  return age > (list.artworks.some((a) => a.check === "error") ? RETRY_MS : MAX_AGE_MS);
}
