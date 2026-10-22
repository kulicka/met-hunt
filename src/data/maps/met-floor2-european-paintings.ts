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
  /** Schematic grid column/row, not GPS or real-world coordinates. */
  x: number;
  y: number;
  isQuestGallery: boolean;
  floor: number;
}

export interface GalleryConnection {
  id: string;
  from: string;
  to: string;
  bidirectional: boolean;
  type: "doorway" | "passage" | "corridor" | "stairs" | "elevator";
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

const node = (id: string, x: number, y: number, label = id): GalleryNode => ({
  id,
  label,
  x,
  y,
  isQuestGallery: QUEST_GALLERIES.has(id),
  floor: 2,
});

// Layout from Alex's sketch of 2026-10-22 (Central Park side at top).
export const galleryNodes: GalleryNode[] = [
  node("820", 1, 0), node("823", 2, 0), node("826", 3, 0), node("830", 4, 0),
  node("819", 1, 1), node("822", 2, 1), node("825", 3, 1), node("828", 4, 1, "828/829"),
  node("818", 1, 2), node("821", 2, 2), node("824", 3, 2), node("827", 4, 2),
  node("809", 0, 3), node("810", 1, 3), node("811", 2, 3), node("812", 3, 3),
  node("813", 0, 4), node("814", 1, 4), node("815", 2, 4), node("816", 3, 4), node("817", 4, 4),
];

const SKETCH = "Alex’s reading of The Met’s Floor 2 map (sketch sent 2026-10-22)";

const edge = (from: string, to: string, verified: boolean, source = SKETCH): GalleryConnection => ({
  id: `${from}-${to}`,
  from,
  to,
  bidirectional: true,
  type: "doorway",
  verified,
  source,
  ...(verified ? { verifiedAt: "2026-10-22" } : {}),
});

export const galleryConnections: GalleryConnection[] = [
  // Drawn as connected in the sketch.
  edge("820", "823", true), edge("823", "826", true), edge("826", "830", true),
  edge("819", "822", true), edge("822", "825", true), edge("825", "828", true),
  edge("818", "821", true), edge("821", "824", true), edge("824", "827", true),
  edge("820", "819", true), edge("823", "822", true), edge("826", "825", true),
  edge("819", "818", true), edge("822", "821", true), edge("825", "824", true),
  edge("809", "810", true), edge("810", "811", true), edge("811", "812", true),
  edge("813", "814", true), edge("814", "815", true), edge("815", "816", true), edge("816", "817", true),
  // How the three bands link is not yet known. Stored as unknown; never routed through.
  edge("818", "810", false, "Alex’s first sketch; not shown in the second. Needs checking."),
  edge("810", "813", false, "Alex’s first sketch; not shown in the second. Needs checking."),
];

/** One record per quest transition, filled in after checking the official map or walking it. */
export const routeValidations: RouteValidation[] = [];
