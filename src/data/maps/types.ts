// Physical space: galleries and the doorways between them. A map belongs to a
// floor, not to an adventure, so two adventures on the same floor can share one.
//
// RULES (spec v2):
// - Only add a connection after checking it on The Met's current floor map or on site.
// - A shared wall, consecutive numbers, or quest order never imply a doorway.
// - Unknown connectivity is stored with verified: false and is never routed through.

export interface GalleryNode {
  id: string;
  label: string;
  /** Room outline in schematic map units. Not GPS. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** A hallway: routes run along it rather than through its middle. */
  kind?: "gallery" | "corridor";
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

export interface FloorMap {
  id: string;
  /** Bump whenever a node or connection changes, so analytics can compare route results by graph version. */
  routeGraphVersion: string;
  nodes: GalleryNode[];
  connections: GalleryConnection[];
  /** The part of the floor the treasure map shows, in map units. Rooms beyond it run off the edge. */
  view: { x: number; y: number; w: number; h: number };
  /** Small print under the drawing. */
  caption: string;
  /** What a screen reader hears for the drawing. */
  label: string;
}
