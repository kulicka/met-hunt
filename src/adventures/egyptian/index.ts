import type { Adventure, Chapter, QuestPublic } from "../types";
import { fieldNotes } from "./field-notes";
import { bonusQuests, stops } from "./quests";
import { CONTENT_PACK_VERSION, questVersions } from "./versions";

// Egyptian Adventure (docs/egyptian-adventure-spec.md, v1.0 draft).
// launchStatus stays "field_test_required" until every stop and route passes the
// spec's field-test checklist (section 8). There is deliberately no map: no
// doorway between these galleries has been verified, so the game lists gallery
// numbers and chapter changes instead of drawing routes.

// ---------- curator switches ----------
// Change these (and deploy) to adjust the lineup. Saved progress survives: a find
// in a stop that leaves the lineup is kept and returns if the stop comes back.

/** The proposed launch itinerary, by chapter (spec section 2). Editorial order, not a walking route. */
const CHAPTERS = [
  { id: "royal-treasures", title: "Royal Treasures", stops: [111, 112, 114, 115, 116, 117] },
  { id: "pharaoh-secrets", title: "Secrets of the Pharaohs", stops: [122, 123, 124, 125] },
];

/** Swap a stop for a reserve, e.g. { 125: 126 } puts Gallery 126 in Gallery 125's place. */
const SUBSTITUTIONS: Record<number, number> = {};

/** Stops to leave out entirely (a shortened adventure). Completion counts what is left. */
const DISABLED: number[] = [];

// ---------- built from the switches ----------

const lineupOf = (ids: number[]) => ids.map((id) => SUBSTITUTIONS[id] ?? id).filter((id) => !DISABLED.includes(id));

const chapters: Chapter[] = CHAPTERS.map((c) => ({ id: c.id, title: c.title, questIds: lineupOf(c.stops) })).filter(
  (c) => c.questIds.length > 0,
);
const quests: QuestPublic[] = chapters.flatMap((c) => c.questIds.map((id) => stops[id]));
// Reserve stops (Gallery 126, which repeats Gallery 111's beetle theme) and any
// switched-off stops. Playable only once swapped in.
const otherQuests = Object.values(stops).filter((s) => !quests.includes(s));

/**
 * Walks between consecutive stops (spec section 5). None is verified yet, so none
 * is drawn or described step by step. Fill these in after walking them.
 */
export interface RouteLeg {
  from: string;
  to: string;
  routeVerified: boolean;
  nextGalleryConnection?: string;
  accessibilityCheckedAt?: string;
}

export const routeLegs: RouteLeg[] = quests.slice(1).map((q, i) => ({ from: quests[i].gallery, to: q.gallery, routeVerified: false }));

export const egyptian: Adventure = {
  id: "met-egyptian-adventure",
  title: "Egyptian Adventure",
  where: "Floor 1 · Egyptian Art, Galleries 111–125",
  description:
    "Travel through ancient Egypt as a treasure detective. Decode riddles, find tiny secrets hidden in real artworks, and collect ten discoveries!",
  emoji: "🏺",
  launchStatus: "field_test_required",
  quests,
  chapters,
  bonus: bonusQuests,
  otherQuests,
  loadReveals: () => import("./reveals").then((m) => m.reveals),
  loadStamps: () => import("./Stamps"),
  fieldNotes,
  versions: { contentPackVersion: CONTENT_PACK_VERSION, quests: questVersions },
  certificate: {
    fullTitle: "LEGENDARY ART DETECTIVE",
    partialTitle: "EXPLORER OF HIDDEN TREASURES",
  },
};
