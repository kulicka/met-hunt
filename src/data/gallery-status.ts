// Temporary gallery closures. Update this file when The Met's closure page
// changes (https://www.metmuseum.org/visit/gallery-closures). Quests in closed
// galleries can be skipped, and map routes never walk through closed rooms.

export interface GalleryClosure {
  /** When the closure was last confirmed against The Met's closure page. */
  checked: string;
  note?: string;
}

export const closedGalleries: Record<string, GalleryClosure> = {
  "816": { checked: "2026-10-19", note: "Listed as temporarily closed on The Met’s gallery closures page." },
  "817": { checked: "2026-10-19", note: "Listed as temporarily closed on The Met’s gallery closures page." },
};

export const isGalleryClosed = (gallery: string) => gallery in closedGalleries;
