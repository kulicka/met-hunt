// Temporary closures are operational data, not game content (spec v2, section E).
// The server reads The Met's gallery closures page itself (src/lib/server/met-closures.ts)
// and serves it at /api/closures. data/closures.json is its fallback, and this bundled
// copy is used until the first answer arrives or when the phone is offline.

export interface ClosureOverride {
  galleryId?: string;
  connectionId?: string;
  status: "closed" | "restricted";
  effectiveDate?: string;
  note?: string;
  sourceUrl?: string;
}

export interface ClosureList {
  checkedAt: string;
  sourceUrl: string;
  /** met-page: read from The Met's page; manual: CLOSURES_JSON; file: data/closures.json or the bundled copy. */
  source?: "met-page" | "manual" | "file";
  closures: ClosureOverride[];
}

import bundled from "../../data/closures.json";

export const bundledClosures = bundled as ClosureList;
