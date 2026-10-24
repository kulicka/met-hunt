import { afterEach, describe, expect, it } from "vitest";
import { expandGalleries, liveClosures, parseClosuresPage, refreshClosures, resetClosuresSync, wantsRecheck } from "@/lib/server/met-closures";

// Shaped like The Met's page as read on 2026-10-24 (headings, "View on map" links, entities).
const PAGE = `<html><head><script>var x = "Gallery 101";</script><style>.a{}</style></head><body>
<nav>Visit · Gallery 100 is the Great Hall</nav>
<h1>Gallery Closures</h1><p>Last updated October 22 at 10:55 AM</p>
<ul>
<li><h3>19th and Early 20th Century European Paintings and Sculpture (Partial Closure)</h3><p>Galleries 813&ndash;814</p><a>View on map</a></li>
<li><h3>The American Wing (Partial Closure)</h3><p>Galleries 708, 721, 736, 738, 773–774, and 774A</p></li>
<li><h3>Egyptian Art (Partial Closure)</h3><p>Galleries 118–120</p></li>
<li><h3>Art of the Arab Lands</h3><p>Gallery 451</p></li>
<li><h3>The Robert Lehman Collection (Partial Closure)</h3><p>Ramadan Prayer Space, Galleries 951, and 957–959</p></li>
</ul>
<h2>Other Closures</h2><ul><li>The Eatery</li><li>Gallery 513</li></ul>
</body></html>`;

describe("closures page", () => {
  afterEach(() => resetClosuresSync());

  it("expands ranges, lists and letter suffixes", () => {
    expect(expandGalleries("118–120")).toEqual(["118", "119", "120"]);
    expect(expandGalleries("708, 721, 773–774, and 774A")).toEqual(["708", "721", "773", "774", "774A"]);
    expect(expandGalleries("951, and 957–959")).toEqual(["951", "957", "958", "959"]);
    expect(expandGalleries("100–900")).toEqual(["100", "900"]); // a misread, not 800 rooms
  });

  it("reads every closed gallery below the heading, and nothing above it", () => {
    const list = parseClosuresPage(PAGE, "2026-10-24T00:00:00Z")!;
    const ids = list.closures.map((c) => c.galleryId);
    expect(ids).toEqual(expect.arrayContaining(["813", "814", "118", "119", "120", "451", "774A", "951", "957", "959", "513"]));
    expect(ids).not.toContain("100");
    expect(ids).not.toContain("101");
    expect(list.closures.every((c) => c.status === "closed")).toBe(true);
    expect(list.closures[0].note).toContain("last updated October 22 at 10:55 AM");
  });

  it("refuses a page that doesn't look like the closures page", () => {
    expect(parseClosuresPage("<p>Access denied</p>", "x")).toBeNull();
    expect(parseClosuresPage("<h1>Gallery Closures</h1><p>No closures today</p>", "x")).toBeNull();
  });

  it("keeps the previous list when the page can't be read", async () => {
    const ok = (async () => new Response(PAGE)) as unknown as typeof fetch;
    await refreshClosures(ok);
    expect(liveClosures()?.closures.length).toBeGreaterThan(10);
    const down = (async () => new Response("", { status: 503 })) as unknown as typeof fetch;
    await refreshClosures(down);
    expect(liveClosures()?.closures.some((c) => c.galleryId === "118")).toBe(true);
  });

  it("marks a list read from the page as checked automatically", () => {
    expect(parseClosuresPage(PAGE, "2026-10-24T00:00:00Z")!.source).toBe("met-page");
  });

  it("rechecks for a starting hunt only when the last read is old and not just tried", async () => {
    expect(wantsRecheck()).toBe(true); // never read yet
    await refreshClosures((async () => new Response(PAGE)) as unknown as typeof fetch);
    expect(wantsRecheck()).toBe(false); // just read
    resetClosuresSync();
    await refreshClosures((async () => new Response("", { status: 503 })) as unknown as typeof fetch);
    expect(wantsRecheck()).toBe(false); // just tried and failed: don't hammer the page
  });
});
