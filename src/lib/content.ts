import type { ClosureOverride } from "@/data/closures";
import { adventureById, adventures } from "@/adventures/registry";
import type { Adventure, QuestReveal } from "@/adventures/types";
import { findRoute } from "./routing";
import { useProfile, getProfile } from "./profile";

// Lookups over one adventure's quests, built once per adventure. Screens get the
// player's current adventure from useAdventure(); nothing here is tied to a
// particular museum section.

function build(adventure: Adventure) {
  const questIds = adventure.quests.map((q) => q.id);
  const bonus = adventure.bonus ?? [];
  const bonusIds = bonus.map((b) => b.id);
  const playable = [...adventure.quests, ...bonus];
  /** A required or bonus quest. Reserve and switched-off stops can't be played. */
  const questById = (id: number) => playable.find((q) => q.id === id);

  const isQuestClosed = (id: number, closures: ClosureOverride[]) => {
    const q = questById(id);
    return q ? closures.some((c) => c.galleryId === q.gallery && c.status === "closed") : false;
  };

  // Answers live in their own chunk, loaded only when a find is revealed or a
  // grown-up opens the answer key. Calling this early just warms it for offline use.
  let revealsPromise: Promise<QuestReveal[]> | null = null;
  const loadReveals = (): Promise<QuestReveal[]> =>
    (revealsPromise ??= adventure.loadReveals().catch((error) => {
      revealsPromise = null; // let a later call retry once the signal is back
      throw error;
    }));

  return {
    adventure,
    map: adventure.map,
    questIds,
    quests: adventure.quests,
    questById,
    /** 1-based position in the lineup; 0 for a bonus mystery. */
    questNumber: (id: number) => questIds.indexOf(id) + 1,
    bonus,
    bonusIds,
    isBonus: (id: number) => bonusIds.includes(id),
    /** Whether a required or bonus quest has been found. */
    isFound: (p: { completedQuests: number[]; bonusFound?: number[] }, id: number) =>
      bonusIds.includes(id) ? !!p.bonusFound?.includes(id) : p.completedQuests.includes(id),
    /** Bonus mysteries offered on this quest's clue screen. */
    bonusAt: (questId: number) => bonus.filter((b) => b.atQuest === questId),
    chapterOf: (id: number) => adventure.chapters?.find((c) => c.questIds.includes(id)),
    /** Every stop, including reserves, for the grown-ups' answer key. */
    allQuests: [...playable, ...(adventure.otherQuests ?? [])],
    /** For parseAdventure: ids saved progress may hold besides the lineup. */
    extraIds: { bonus: bonusIds, other: (adventure.otherQuests ?? []).map((q) => q.id) },
    /** Canonical quest order as galleries (spec v2 questOrder). Game sequence only, not connectivity. */
    questOrder: adventure.quests.map((q) => q.gallery),
    questByGallery: (gallery: string) => adventure.quests.find((q) => q.gallery === gallery),
    /** Walking routes are drawn only for adventures with a verified map. */
    hasRoutes: !!adventure.map,
    isQuestClosed,
    /** Quests the player can still do today: unsolved and not in a closed gallery. */
    openUnsolved: (completed: number[], closures: ClosureOverride[]) =>
      questIds.filter((id) => !completed.includes(id) && !isQuestClosed(id, closures)),
    /** Next open, unsolved quest after `id` in route order, wrapping to any skipped ones. */
    nextUnsolved(id: number, completed: number[], closures: ClosureOverride[]): number | null {
      const start = questIds.indexOf(id);
      for (let i = 1; i <= questIds.length; i++) {
        const candidate = questIds[(start + i) % questIds.length];
        if (candidate !== id && !completed.includes(candidate) && !isQuestClosed(candidate, closures)) return candidate;
      }
      return null;
    },
    /** Verified walking route on this adventure's map (see routing.ts). */
    findRoute: (from: string, to: string, closures: ClosureOverride[]) =>
      adventure.map ? findRoute(from, to, closures, adventure.map) : null,
    loadReveals,
    versionOf: (questId: number) => adventure.versions.quests.find((v) => v.questId === questId),
  };
}

export type AdventureContent = ReturnType<typeof build>;

const cache = new Map<string, AdventureContent>();

export function contentFor(adventure: Adventure): AdventureContent {
  let c = cache.get(adventure.id);
  if (!c) cache.set(adventure.id, (c = build(adventure)));
  return c;
}

/** The adventure the player chose, or the first one before they have chosen. */
export const resolveAdventure = (id: string | undefined): Adventure => adventureById(id) ?? adventures[0];

/** For code outside React (progress store, analytics). */
export const activeAdventure = (): AdventureContent => contentFor(resolveAdventure(getProfile().adventureId));

/** The player's current adventure. Screens re-render when it changes. */
export function useAdventure(): AdventureContent {
  const profile = useProfile();
  return contentFor(resolveAdventure(profile?.adventureId));
}
