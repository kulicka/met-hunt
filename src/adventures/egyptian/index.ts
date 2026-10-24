import { floor1Egyptian } from "@/data/maps/met-floor1-egyptian";
import type { Adventure, Chapter, QuestPublic } from "../types";
import { fieldNotes } from "./field-notes";
import { bonusQuests, stops } from "./quests";
import { CONTENT_PACK_VERSION, questVersions } from "./versions";

// Egyptian Adventure (docs/egyptian-adventure-spec.md, v1.0 draft).
// launchStatus stays "field_test_required" until every stop and route passes the
// spec's field-test checklist (section 8). The map is traced from The Met's
// Egyptian Art galleries map (Alex, 2026-10-24); the 117 → 122 walk stays held
// back until it is checked on site (spec section 5).

// ---------- curator switches ----------
// Change these (and deploy) to adjust the lineup. Saved progress survives: a find
// in a stop that leaves the lineup is kept and returns if the stop comes back.

/**
 * The four Daily Life stops in Galleries 105, 107, 108 and 110
 * (docs/egyptian-four-new-quests-spec.md). Off until someone confirms on site that
 * each object is on view and its detail can be seen (field notes). Turning this on
 * puts them first, in gallery order, for a 14-stop hunt. If one turns out to be off
 * view, add it to DISABLED rather than swapping in something else.
 */
export const EXPANDED_ROUTE = false;

const DAILY_LIFE = { id: "daily-life", title: "Daily Life by the Nile", stops: [105, 107, 108, 110] };

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

/**
 * Walks between consecutive stops (spec section 5). All but 117 → 122 are traced on
 * The Met's map (data/maps/met-floor1-egyptian.ts) but none is walked on site yet.
 * Fill in the rest after walking them.
 */
export interface RouteLeg {
  from: string;
  to: string;
  routeVerified: boolean;
  nextGalleryConnection?: string;
  accessibilityCheckedAt?: string;
}

const lineupOf = (ids: number[]) => ids.map((id) => SUBSTITUTIONS[id] ?? id).filter((id) => !DISABLED.includes(id));

const COUNT_WORDS: Record<number, string> = { 10: "ten", 11: "eleven", 12: "twelve", 13: "thirteen", 14: "fourteen" };

/** The adventure for one lineup. `expanded` adds the Daily Life stops; tests build both. */
export function buildEgyptian(expanded: boolean): { adventure: Adventure; routeLegs: RouteLeg[] } {
  const chapters: Chapter[] = (expanded ? [DAILY_LIFE, ...CHAPTERS] : CHAPTERS)
    .map((c) => ({ id: c.id, title: c.title, questIds: lineupOf(c.stops) }))
    .filter((c) => c.questIds.length > 0);
  const quests: QuestPublic[] = chapters.flatMap((c) => c.questIds.map((id) => stops[id]));
  // Reserve stops (Gallery 126, which repeats Gallery 111's beetle theme), the Daily
  // Life stops while they are off, and any switched-off stops. Playable only once
  // swapped in.
  const otherQuests = Object.values(stops).filter((s) => !quests.includes(s));
  const routeLegs = quests.slice(1).map((q, i) => ({ from: quests[i].gallery, to: q.gallery, routeVerified: false }));

  /**
   * Spec section 5: no directions for 117 → 122 until walked on site. On The Met's map
   * 122 opens only into 121, and with 118–120 closed (and the 119 ↔ 121 opening
   * unreadable) the walk is a long loop through the west galleries:
   * 117, 116, 115, 111, 110, 108, 107, 132, 128, 123, 121, 122.
   * The Daily Life spec also asks for its walks (one doorway each on The Met's map)
   * to be checked in person before directions are shown; drop a leg once walked.
   */
  const dailyLifeLegs = routeLegs.filter((l) => ["105", "107", "108", "110"].includes(l.from));
  const heldRoutes = [
    { from: "117", to: "122", reason: "Not yet walked on site (spec section 5)." },
    ...dailyLifeLegs.map((l) => ({ from: l.from, to: l.to, reason: "Not yet walked on site (four new quests spec, section 2)." })),
  ];

  const galleries = quests.map((q) => Number(q.gallery));
  const adventure: Adventure = {
    id: "met-egyptian-adventure",
    title: "Egyptian Adventure",
    where: `Floor 1 · Egyptian Art, Galleries ${Math.min(...galleries)}–${Math.max(...galleries)}`,
    description: `Travel through ancient Egypt as a treasure detective. Decode riddles, find tiny secrets hidden in real artworks, and collect ${COUNT_WORDS[quests.length] ?? quests.length} discoveries!`,
    emoji: "🏺",
    theme: "egyptian",
    launchStatus: "field_test_required",
    quests,
    chapters,
    bonus: bonusQuests,
    otherQuests,
    map: floor1Egyptian,
    heldRoutes,
    loadReveals: () => import("./reveals").then((m) => m.reveals),
    loadStamps: () => import("./Stamps"),
    fieldNotes,
    versions: { contentPackVersion: CONTENT_PACK_VERSION, quests: questVersions },
    certificate: {
      fullTitle: "LEGENDARY ART DETECTIVE",
      partialTitle: "EXPLORER OF HIDDEN TREASURES",
    },
  };
  return { adventure, routeLegs };
}

const live = buildEgyptian(EXPANDED_ROUTE);
export const egyptian: Adventure = live.adventure;
export const routeLegs: RouteLeg[] = live.routeLegs;
