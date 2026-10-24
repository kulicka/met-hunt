import { describe, expect, it } from "vitest";
import { europeanPaintings } from "@/adventures/european-paintings";
import { reveals } from "@/adventures/european-paintings/reveals";
import { checkArtwork, isMatch, isStale, normalize } from "@/lib/server/met-collection";

const monet = reveals.find((r) => r.id === 5)!; // View of Vétheuil, quest gallery 818

type Obj = { objectID: number; title: string; artistDisplayName: string; GalleryNumber?: string; isPublicDomain?: boolean; primaryImageSmall?: string; objectURL?: string };

/** A tiny fake of the Collection API: `search` for q=, `onView` for isOnView=true. */
function fakeApi(objects: Obj[], onView: number[], opts: { fail?: boolean } = {}) {
  const calls: string[] = [];
  const f = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    calls.push(url.pathname + url.search);
    if (opts.fail) return new Response("nope", { status: 503 });
    const obj = url.pathname.match(/\/v1\/objects\/(\d+)$/);
    if (obj) {
      const o = objects.find((x) => x.objectID === Number(obj[1]));
      return o ? Response.json(o) : new Response("", { status: 404 });
    }
    if (url.pathname.endsWith("/v1.1/search")) {
      const ids = url.searchParams.get("isOnView") === "true" ? onView : objects.map((o) => o.objectID);
      return Response.json({ total: ids.length, objectIDs: ids });
    }
    return new Response("", { status: 404 });
  }) as typeof fetch;
  return { f, calls };
}

const vetheuil: Obj = {
  objectID: 437123,
  title: "View of Vétheuil",
  artistDisplayName: "Claude Monet",
  GalleryNumber: "818",
  isPublicDomain: true,
  primaryImageSmall: "https://images.metmuseum.org/x.jpg",
  objectURL: "https://www.metmuseum.org/art/collection/search/437123",
};
const decoy: Obj = { objectID: 1, title: "View of Vétheuil", artistDisplayName: "Someone Else" };

describe("artwork check", () => {
  it("matches titles regardless of accents and case", () => {
    expect(normalize("The Manneporte (Étretat)")).toBe("the manneporte etretat");
    expect(isMatch(monet, vetheuil)).toBe(true);
    expect(isMatch(monet, decoy)).toBe(false);
    expect(isMatch(monet, { ...vetheuil, title: "Vétheuil in Summer" })).toBe(false);
  });

  it("is ok when on view in the expected gallery, and passes on the public domain image", async () => {
    const { f } = fakeApi([decoy, vetheuil], [437123]);
    const s = await checkArtwork(f, europeanPaintings, monet);
    expect(s).toMatchObject({ check: "ok", objectId: 437123, expectedGallery: "818", imageUrl: vetheuil.primaryImageSmall });
  });

  it("flags an artwork in another gallery", async () => {
    const { f } = fakeApi([{ ...vetheuil, GalleryNumber: "800" }], [437123]);
    expect(await checkArtwork(f, europeanPaintings, monet)).toMatchObject({ check: "moved", galleryNumber: "800" });
  });

  it("flags an artwork that is not on view", async () => {
    const { f } = fakeApi([vetheuil], []);
    expect((await checkArtwork(f, europeanPaintings, monet)).check).toBe("off_view");
  });

  it("never passes on an image that isn't public domain", async () => {
    const { f } = fakeApi([{ ...vetheuil, isPublicDomain: false }], [437123]);
    expect((await checkArtwork(f, europeanPaintings, monet)).imageUrl).toBeUndefined();
  });

  it("reports not_found and error without throwing", async () => {
    expect((await checkArtwork(fakeApi([decoy], []).f, europeanPaintings, monet)).check).toBe("not_found");
    expect((await checkArtwork(fakeApi([], [], { fail: true }).f, europeanPaintings, monet)).check).toBe("error");
  });

  it("uses a pinned object id without searching for it", async () => {
    const { f, calls } = fakeApi([vetheuil], [437123]);
    await checkArtwork(f, europeanPaintings, { ...monet, metObjectId: 437123 });
    expect(calls[0]).toBe("/public/collection/v1/objects/437123");
  });

  it("re-checks after 6 hours, or 10 minutes after an API error", () => {
    const at = "2026-10-22T00:00:00Z";
    const t = Date.parse(at);
    const ok = { checkedAt: at, artworks: [{ questId: 5, check: "ok" as const, expectedGallery: "818" }] };
    const err = { checkedAt: at, artworks: [{ questId: 5, check: "error" as const, expectedGallery: "818" }] };
    expect(isStale({ checkedAt: null, artworks: [] })).toBe(true);
    expect(isStale(ok, t + 60 * 60 * 1000)).toBe(false);
    expect(isStale(ok, t + 7 * 60 * 60 * 1000)).toBe(true);
    expect(isStale(err, t + 11 * 60 * 1000)).toBe(true);
  });
});
