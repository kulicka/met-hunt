// Types for adventures: one self-contained package per museum section.
// Gallery/artwork assignments change over time, so all of this lives in data
// files, never in UI components. See docs/adding-an-adventure.md.

import type { ComponentType } from "react";
import type { FloorMap } from "@/data/maps/types";

/** Safe to show before a quest is solved: no artist, title, image, or answer. */
export interface QuestPublic {
  /** Unique within its adventure only. Never reused for a different artwork. */
  id: number;
  gallery: string;
  /** The mystery's name, e.g. "The Mirror's Secret". It hints at the answer, so players see it only after the find (grown-ups see it in the answer key). */
  title?: string;
  /** Editorially locked lines, usually two (Egyptian Gallery 111 has four). Never rewrite them. */
  riddle: string[];
  hints: [string, string];
}

/** An optional extra mystery. Never counts toward completion. */
export interface BonusQuest extends QuestPublic {
  /** The required quest whose gallery it is in; its clue screen offers the bonus. */
  atQuest: number;
}

export interface Chapter {
  id: string;
  title: string;
  questIds: number[];
}

/** Shown only after a discovery is verified, or in grown-up mode. */
export interface QuestReveal {
  id: number;
  /** Left out when unknown (most ancient objects). */
  artist?: string;
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
  artist?: string;
  artwork: string;
  hiddenObject: string;
  verificationDescription: string;
  referenceImages?: string[];
}

/** Stable content IDs and published versions of one quest, for analytics (analytics spec, section 7). */
export interface QuestVersion {
  questId: number;
  /** Stable analytics key, e.g. "q01". */
  key: string;
  galleryId: number;
  artworkId: string;
  hiddenDetailId: string;
  riddleVersion: string;
  hintSetVersion: string;
  artworkAssignmentVersion: string;
  /** fingerprint() of the riddle lines joined by "\n", as published in riddleVersion. */
  riddleFingerprint: string;
  /** fingerprint() of the hints joined by "\n", as published in hintSetVersion. */
  hintsFingerprint: string;
}

export interface StampProps {
  questId: number;
  size?: number;
}

/**
 * Everything one adventure needs, in one object. The game, progress, notebook,
 * hints, certificate and analytics read only from this; nothing in the UI names
 * a gallery, artwork, or quest.
 */
export interface Adventure {
  /**
   * Stable id: the progress storage key, the analytics `pack_id`, and the verify
   * request all use it. Lowercase letters, digits and dashes, at most 40 characters.
   * Never rename or reuse it, or players lose their progress.
   */
  id: string;
  /** Shown on the adventure picker, e.g. "European Paintings". */
  title: string;
  /** Where in the museum, e.g. "Floor 2 · Galleries 810–825". */
  where: string;
  /** One or two short sentences for the picker. */
  description: string;
  /** An emoji for the picker card. */
  emoji: string;
  /**
   * Look of the quest screen: "egyptian" is warm parchment with sand-dune and palm
   * line art. Left out: the app's standard look. Decoration never pictures an answer.
   */
  theme?: "egyptian";
  /**
   * "field_test_required" until someone has walked every route and checked every
   * target on site. The picker and the grown-ups area say so.
   */
  launchStatus: "ready" | "field_test_required";
  /** Required quests in play order. The first one is where a new adventure starts. */
  quests: QuestPublic[];
  /** Optional groups of quests, in order. A new chapter gets its own heading between mysteries. */
  chapters?: Chapter[];
  /** Optional extra mysteries. */
  bonus?: BonusQuest[];
  /**
   * Stops that may be in saved progress but aren't in `quests` right now:
   * reserve stops and stops switched off. Finds there are kept, not counted.
   */
  otherQuests?: QuestPublic[];
  /**
   * The galleries and verified doorways the treasure map and directions use.
   * Leave it out until doorways are verified: the game then lists gallery
   * numbers and points to The Met's own map instead of drawing routes.
   */
  map?: FloorMap;
  /**
   * Quest-to-quest walks (gallery numbers) the game must not give directions for
   * yet, e.g. until walked on site. The map still shows both galleries; the player
   * gets the "use The Met's map or ask a guard" card instead of a drawn route.
   */
  heldRoutes?: { from: string; to: string; reason: string }[];
  /** Answers, in their own chunk: loaded only after a find or in grown-up mode. */
  loadReveals: () => Promise<QuestReveal[]>;
  /** Notebook stamps, one per quest and bonus. Also its own chunk, since each one pictures an answer. */
  loadStamps: () => Promise<{ default: ComponentType<StampProps> }>;
  /** Published content versions. Bump these with every change (docs/content-versions.md). */
  versions: {
    /** Unique across all adventures, so analytics can tell packs apart by version alone. */
    contentPackVersion: string;
    quests: QuestVersion[];
  };
  certificate: {
    /** Only when every quest is found, e.g. "LEGENDARY ART DETECTIVE". */
    fullTitle: string;
    /** Any partial result, including zero. */
    partialTitle: string;
  };
  /** On-site checks still owed, per quest, for the grown-ups area (field-test adventures). */
  fieldNotes?: Record<number, string>;
  /**
   * Browser storage keys this adventure's progress used before adventures were
   * pluggable. Read once into this adventure, then left alone. Only the first
   * adventure has any; new adventures leave this out.
   */
  legacyProgressKeys?: string[];
}
