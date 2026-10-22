// Shared types for the startup artwork check (server: src/lib/server/met-collection.ts,
// client: src/lib/artwork-status.ts).

export type ArtworkCheck =
  /** On view, in the gallery the quest expects. */
  | "ok"
  /** On view, but The Met lists it in a different gallery. */
  | "moved"
  /** In the collection, but not currently on view. */
  | "off_view"
  /** No confident match in the collection search. */
  | "not_found"
  /** The API couldn't be reached or answered oddly; nothing is known. */
  | "error";

export interface ArtworkStatus {
  questId: number;
  check: ArtworkCheck;
  expectedGallery: string;
  galleryNumber?: string;
  objectId?: number;
  objectUrl?: string;
  /** Only set when The Met marks the object public domain (Open Access). */
  imageUrl?: string;
}

export interface ArtworkStatusList {
  /** ISO time of the check, or null before the first one finishes. */
  checkedAt: string | null;
  artworks: ArtworkStatus[];
}
