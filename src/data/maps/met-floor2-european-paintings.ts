// Original schematic of the Floor 2 European Paintings wing (spec v2, section C).
// Quest order lives in the quest pack; this file only describes physical space.
//
// RULES (spec v2):
// - Only add a connection after checking it on The Met's current Floor 2 map or on site.
// - A shared wall, consecutive numbers, or quest order never imply a doorway.
// - Unknown connectivity is stored with verified: false and is never routed through.
// - 817 and 818 are NOT directly connected (enforced by a test).

export interface GalleryNode {
  id: string;
  label: string;
  /** Room outline in schematic map units (1 unit = 10 px of the official map screenshot). Not GPS. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** A hallway: routes run along it rather than through its middle. */
  kind?: "gallery" | "corridor";
  isQuestGallery: boolean;
  floor: number;
}

export interface GalleryConnection {
  id: string;
  from: string;
  to: string;
  bidirectional: boolean;
  type: "doorway" | "passage" | "corridor" | "stairs" | "elevator";
  /** Where the doorway is, in map units, on the wall the two rooms share. */
  at?: { x: number; y: number };
  stepFree?: boolean;
  verified: boolean;
  source?: string;
  verifiedAt?: string;
}

export interface RouteValidation {
  fromQuestGallery: string;
  toQuestGallery: string;
  path: string[];
  verifiedOn?: string;
  verifiedBy: "official-map" | "onsite";
  notes?: string;
}

const QUEST_GALLERIES = new Set(["810", "815", "816", "817", "818", "819", "821", "822", "824", "825"]);

const room = (id: string, x: number, y: number, w: number, h: number, kind: GalleryNode["kind"] = "gallery"): GalleryNode => ({
  id,
  label: id,
  x,
  y,
  w,
  h,
  kind,
  isQuestGallery: QUEST_GALLERIES.has(id),
  floor: 2,
});

/** Bump whenever a node or connection below changes, so analytics can compare route results by graph version. */
export const ROUTE_GRAPH_VERSION = "2026.10.23-1";

// Room outlines traced from The Met's Floor 2 map (screenshot Alex sent 2026-10-23),
// same orientation as that map, redrawn as our own schematic. Hall 800 runs down the
// right-hand side.
export const galleryNodes: GalleryNode[] = [
  room("830", 0, 0, 32.9, 25.2), room("826", 32.9, 0, 32.2, 25.2), room("823", 65.1, 0, 25.9, 25.2), room("820", 91, 0, 23, 25.2),
  room("828", 0, 25.2, 16, 24.1), room("829", 16, 25.2, 16.9, 24.1),
  room("825", 32.9, 25.2, 32.2, 27.9), room("822", 65.1, 25.2, 25.9, 27.9), room("819", 91, 25.2, 23, 27.9),
  room("827", 0, 49.3, 32.9, 25.5),
  room("824", 32.9, 53.1, 32.2, 23.1), room("821", 65.1, 53.1, 25.9, 23.1), room("818", 91, 53.1, 23, 23.1),
  room("812", 0, 74.8, 32.9, 25.5),
  room("811", 32.9, 76.2, 23.1, 22.6), room("810", 56, 76.2, 43.6, 22.6), room("809", 99.6, 76.2, 14.4, 22.6),
  room("808", 0, 100.3, 16, 18.3), room("807", 16, 100.3, 16.9, 18.3),
  room("813", 32.9, 98.8, 23.1, 23.4), room("814", 56, 98.8, 13.2, 23.4), room("815", 69.2, 98.8, 17.3, 23.4),
  room("816", 86.5, 98.8, 13.1, 23.4), room("817", 99.6, 98.8, 14.4, 23.4),
  room("805", 0, 118.6, 16, 18.3), room("806", 16, 118.6, 16.9, 18.3), room("804", 7.9, 136.9, 25, 17.2),
  room("803", 32.9, 122.2, 23.1, 31.9), room("802", 56, 122.2, 30.5, 27.7), room("801", 86.5, 122.2, 27.5, 27.7),
  room("800", 114, 0, 17.6, 149.9, "corridor"),
];

const OFFICIAL = "The Met’s Floor 2 map (screenshot Alex sent 2026-10-23): opening shown in the shared wall";

const door = (from: string, to: string, x: number, y: number, verified = true, source = OFFICIAL): GalleryConnection => ({
  id: `${from}-${to}`,
  from,
  to,
  bidirectional: true,
  type: to === "800" || from === "800" ? "passage" : "doorway",
  at: { x, y },
  verified,
  source,
  ...(verified ? { verifiedAt: "2026-10-23" } : {}),
});

// Every opening in a shared wall on the official map. Walls with no opening have no entry.
export const galleryConnections: GalleryConnection[] = [
  door("830", "826", 32.9, 12.7), door("826", "823", 65.1, 12.8), door("823", "820", 91, 12.6),
  door("830", "828", 8.1, 25.2), door("830", "829", 24.6, 25.2), door("826", "825", 49, 25.2),
  door("823", "822", 78.1, 25.2), door("820", "819", 102.6, 25.2),
  door("828", "829", 16, 37.4), door("825", "822", 65.1, 39.1), door("822", "819", 91, 32.3), door("819", "800", 114, 39),
  door("828", "827", 8.1, 49.3), door("829", "827", 24.6, 49.3),
  door("825", "824", 40.1, 53.1), door("822", "821", 72.4, 53.1), door("819", "818", 107.3, 53.1),
  door("827", "824", 32.9, 58.1), door("824", "821", 65.1, 64.7), door("821", "818", 91, 64.7),
  door("827", "812", 16.4, 74.8), door("824", "811", 44.5, 76.2), door("821", "810", 78, 76.2),
  door("812", "811", 32.9, 94.1), door("811", "810", 56, 87.5), door("810", "809", 99.6, 87.4), door("809", "800", 114, 87.4),
  door("812", "808", 8, 100.3), door("812", "807", 24.5, 100.3), door("808", "807", 16, 109.5),
  door("811", "813", 44.5, 98.8), door("810", "815", 78, 98.8),
  door("813", "814", 56, 102.8), door("814", "815", 69.2, 110.5), door("815", "816", 86.5, 110.5), door("816", "817", 99.6, 106),
  door("807", "806", 24.5, 118.6), door("805", "806", 16, 127.8), door("804", "803", 32.9, 145.7),
  door("803", "802", 56, 128.2), door("802", "801", 86.5, 136.1), door("817", "801", 109.5, 122.2), door("801", "800", 114, 136.1),
  // The map's section label covers this wall, so whether there is an opening can't be read.
  door("824", "810", 60.5, 76.2, false, "The Met’s Floor 2 map: wall hidden under the section label; check on site"),
];

/** One record per quest transition, filled in after checking the official map or walking it. */
const official = (fromQuestGallery: string, toQuestGallery: string, path: string[]): RouteValidation => ({
  fromQuestGallery,
  toQuestGallery,
  path,
  verifiedOn: "2026-10-23",
  verifiedBy: "official-map",
  notes: "Traced on The Met's Floor 2 map; walk it on site before launch.",
});

export const routeValidations: RouteValidation[] = [
  official("810", "815", ["810", "815"]),
  official("815", "816", ["815", "816"]),
  official("816", "817", ["816", "817"]),
  official("817", "818", ["817", "816", "815", "810", "821", "818"]),
  official("818", "819", ["818", "819"]),
  official("819", "821", ["819", "818", "821"]),
  official("821", "822", ["821", "822"]),
  official("822", "824", ["822", "821", "824"]),
  official("824", "825", ["824", "825"]),
];
