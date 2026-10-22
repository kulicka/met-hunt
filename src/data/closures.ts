// Temporary closures are operational data, not game content (spec v2, section E).
// The live list comes from data/closures.json on the server (editable without a
// rebuild, see DEPLOYMENT.md); this bundled copy is used until that loads or offline.

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
  closures: ClosureOverride[];
}

import bundled from "../../data/closures.json";

export const bundledClosures = bundled as ClosureList;
