import { describe, expect, it } from "vitest";
import { isJpeg, stripJpegMetadata } from "@/lib/server/image";
import { normalize } from "@/lib/server/verify-photo";
import { parseRoute, routeHash } from "@/components/game/router";

const verdict = (v: Partial<Parameters<typeof normalize>[0]>) =>
  normalize({ image_usable: true, artwork_visible: "yes", detail_visible: "yes", confidence: 0.9, ...v });

describe("normalize", () => {
  it("accepts a clear find", () => expect(verdict({}).status).toBe("verified"));
  it("says so close when only the painting is visible", () =>
    expect(verdict({ detail_visible: "no" }).status).toBe("likely"));
  it("says keep hunting only when confidently the wrong painting", () => {
    expect(verdict({ artwork_visible: "no", detail_visible: "no", confidence: 0.9 }).status).toBe("not_found");
    expect(verdict({ artwork_visible: "no", detail_visible: "no", confidence: 0.4 }).status).toBe("uncertain");
  });
  it("is unsure rather than rejecting on low confidence", () =>
    expect(verdict({ confidence: 0.3 }).status).toBe("uncertain"));
  it("flags unusable photos", () => expect(verdict({ image_usable: false }).status).toBe("invalid_image"));
  it("never passes model text through to the child", () => {
    expect(verdict({}).feedback).toBe("That’s the one!");
  });
});

describe("stripJpegMetadata", () => {
  // SOI, APP0 (JFIF), APP1 (EXIF with fake GPS), SOS + data + EOI
  const app0 = [0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46];
  const app1 = [0xff, 0xe1, 0x00, 0x08, ...Array.from(new TextEncoder().encode("GPS!!!"))];
  const sos = [0xff, 0xda, 0x00, 0x02, 0x11, 0x22, 0xff, 0xd9];
  const jpeg = new Uint8Array([0xff, 0xd8, ...app0, ...app1, ...sos]);

  it("drops EXIF but keeps the image data", () => {
    const out = stripJpegMetadata(jpeg)!;
    expect(isJpeg(out)).toBe(true);
    expect(new TextDecoder().decode(out)).not.toContain("GPS");
    expect(Array.from(out)).toEqual([0xff, 0xd8, ...app0, ...sos]);
  });

  it("rejects non-JPEG and malformed input", () => {
    expect(stripJpegMetadata(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0]))).toBeNull();
    expect(stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0x40, 0x00]))).toBeNull();
  });
});

describe("hash routes", () => {
  it("round-trip", () => {
    for (const r of [
      { name: "start" },
      { name: "quest", id: 4 },
      { name: "found", id: 2 },
      { name: "next", from: 3 },
      { name: "map", focus: 5, from: 4 },
      { name: "parents" },
    ] as const) {
      expect(parseRoute(routeHash(r))).toMatchObject(r);
    }
  });
  it("falls back to start on junk", () => expect(parseRoute("#/quest/abc")).toEqual({ name: "start" }));
});
