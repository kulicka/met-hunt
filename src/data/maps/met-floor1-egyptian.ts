// Original schematic of the Floor 1 Egyptian Art wing. Quest order lives in the
// adventure; this file only describes physical space. The rules for adding
// doorways are in ./types.ts.

import type { FloorMap, GalleryConnection, GalleryNode, RouteValidation } from "./types";

const room = (id: string, x: number, y: number, w: number, h: number): GalleryNode => ({ id, label: id, x, y, w, h, kind: "gallery", floor: 1 });

/** Bump whenever a node or connection below changes, so analytics can compare route results by graph version. */
export const ROUTE_GRAPH_VERSION = "2026.10.24-1";

// Room outlines traced from The Met's Egyptian Art galleries map (screenshot Alex
// sent 2026-10-24), same orientation as that map, redrawn as our own schematic.
// The Fifth Avenue side is on the right. The stairs and elevator west of 132 are left out.
export const galleryNodes: GalleryNode[] = [
  room("133", 1.5, 7.5, 31.3, 22.3), room("128", 32.8, 7.5, 23.9, 22.3), room("123", 56.7, 7.5, 69.1, 13.3),
  room("121", 125.8, 7.5, 24.2, 40.3), room("120", 150, 2, 35, 9.8), room("119", 150, 11.8, 35, 29.7),
  room("127", 56.7, 20.8, 28.4, 17.9), room("125", 85.1, 20.8, 13.4, 17.9), room("124", 98.5, 20.8, 27.3, 17.9),
  room("132", 32.8, 29.8, 23.9, 39.7), room("126", 56.7, 38.7, 69.1, 21.9),
  room("122", 125.8, 47.8, 24.2, 12.8), room("118", 150, 41.5, 35, 19.1),
  room("109", 56.7, 60.6, 80.8, 8.9), room("117", 137.5, 60.6, 12.5, 31.9), room("116", 150, 60.6, 35, 31.9),
  room("104", 1.5, 69.5, 31.3, 23), room("107", 32.8, 69.5, 23.9, 23), room("108", 56.7, 69.5, 22.3, 23),
  room("112", 79, 69.5, 21.6, 23), room("113", 100.6, 69.5, 21.6, 23), room("114", 122.2, 69.5, 15.3, 23),
  room("106", 1.5, 92.5, 32.5, 34.7), room("105", 34, 92.5, 18.8, 34.7), room("110", 52.8, 92.5, 32.4, 34.7),
  room("111", 85.2, 92.5, 48.8, 34.7), room("115", 134, 92.5, 51, 34.7),
];

const OFFICIAL = "The Met’s Egyptian Art galleries map (screenshot Alex sent 2026-10-24): opening shown in the shared wall";

const door = (from: string, to: string, x: number, y: number, verified = true, source = OFFICIAL): GalleryConnection => ({
  id: `${from}-${to}`,
  from,
  to,
  bidirectional: true,
  type: "doorway",
  at: { x, y },
  verified,
  source,
  ...(verified ? { verifiedAt: "2026-10-24" } : {}),
});

// Every opening in a shared wall on the official map. Walls with no opening have no
// entry: notably 122 opens only into 121, 126 only into 125, and 117 only into 116.
export const galleryConnections: GalleryConnection[] = [
  door("133", "128", 32.8, 16.2), door("128", "123", 56.7, 17), door("128", "132", 40.1, 29.8),
  door("127", "123", 60, 20.8), door("125", "123", 91.8, 20.8), door("124", "123", 122.8, 20.8), door("123", "121", 125.8, 16.6),
  door("125", "126", 91.8, 38.7),
  door("120", "119", 153.4, 11.8), door("119", "118", 167.5, 41.5), door("118", "116", 167.5, 60.6),
  door("121", "122", 143.2, 47.8),
  door("132", "107", 40.1, 69.5), door("104", "107", 32.8, 81), door("108", "107", 56.7, 81),
  door("109", "108", 64.3, 69.5), door("109", "114", 129.9, 69.5),
  door("104", "106", 17, 92.5), door("107", "105", 42.8, 92.5), door("108", "110", 64.3, 92.5),
  door("112", "111", 93.6, 92.5), door("113", "111", 111.1, 92.5), door("114", "111", 129.9, 92.5),
  door("110", "111", 85.2, 109.8), door("117", "116", 150, 84.5), door("116", "115", 167.5, 92.5),
  door("111", "115", 134, 110, true, `${OFFICIAL} (a partition with several openings)`),
  door("106", "105", 34, 110, true, `${OFFICIAL} (one open space around the stairs)`),
  // A narrow gap is drawn here but it is hard to read at this scale.
  door("121", "119", 150, 15.2, false, "The Met’s Egyptian Art galleries map: possible opening, too small to read; check on site"),
];

/** One record per quest transition, traced on the official map. */
const official = (fromQuestGallery: string, toQuestGallery: string, path: string[]): RouteValidation => ({
  fromQuestGallery,
  toQuestGallery,
  path,
  verifiedOn: "2026-10-24",
  verifiedBy: "official-map",
  notes: "Traced on The Met's Egyptian Art galleries map; walk it on site before launch.",
});

export const routeValidations: RouteValidation[] = [
  official("111", "112", ["111", "112"]),
  official("112", "114", ["112", "111", "114"]),
  official("114", "115", ["114", "111", "115"]),
  official("115", "116", ["115", "116"]),
  official("116", "117", ["116", "117"]),
  // 117 → 122 is held back by the adventure until it is walked on site (see egyptian/index.ts).
  official("122", "123", ["122", "121", "123"]),
  official("123", "124", ["123", "124"]),
  official("124", "125", ["124", "123", "125"]),
];

export const floor1Egyptian: FloorMap = {
  id: "met-floor1-egyptian",
  routeGraphVersion: ROUTE_GRAPH_VERSION,
  nodes: galleryNodes,
  connections: galleryConnections,
  // The quest galleries, plus the west rooms a detour around closed galleries can use.
  view: { x: 31, y: 0, w: 156, h: 128.5 },
  caption: "SCHEMATIC · LAID OUT LIKE THE MET’S EGYPTIAN ART MAP",
  label: "Treasure map of the Egyptian Art galleries, schematic and not to scale. A list of the same information follows the map.",
};
