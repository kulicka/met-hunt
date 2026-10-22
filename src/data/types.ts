// Content types for quest packs. Gallery/artwork assignments change over time,
// so all of this lives in data files, never in UI components.

export interface QuestPack {
  id: string;
  title: string;
  museum: string;
  floor?: string;
  description: string;
  questIds: number[];
  mapAsset: string;
}

/** Safe to show before a quest is solved: no artist, title, image, or answer. */
export interface QuestPublic {
  id: number;
  gallery: string;
  riddle: [string, string];
  hints: [string, string];
}

/** Shown only after a discovery is verified, or in grown-up mode. */
export interface QuestReveal {
  id: number;
  artist: string;
  artwork: string;
  year?: string;
  hiddenObject: string;
  fact?: string;
  imageUrl?: string;
  imageAttribution?: string;
  metObjectUrl?: string;
  metObjectId?: number;
  /** Only show imageUrl when this is true (Met Open Access / public domain confirmed). */
  openAccess?: boolean;
}

/** Server only. Never sent to the browser. */
export interface VerificationTarget {
  questId: number;
  artist: string;
  artwork: string;
  hiddenObject: string;
  verificationDescription: string;
  referenceImages?: string[];
}
