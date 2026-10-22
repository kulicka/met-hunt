import { isGalleryClosed } from "@/data/gallery-status";
import { hiddenTreasuresPack } from "@/data/hidden-treasures/pack";
import { quests } from "@/data/hidden-treasures/quests";
import type { QuestPublic, QuestReveal } from "@/data/types";

export const pack = hiddenTreasuresPack;

export const packQuests: QuestPublic[] = pack.questIds.map((id) => quests.find((q) => q.id === id)!);

export const questById = (id: number) => packQuests.find((q) => q.id === id);

export const questNumber = (id: number) => pack.questIds.indexOf(id) + 1;

export const questByGallery = (gallery: string) => packQuests.find((q) => q.gallery === gallery);

export const isQuestClosed = (id: number) => {
  const q = questById(id);
  return q ? isGalleryClosed(q.gallery) : false;
};

/** Quests the player can still do today: unsolved and not in a closed gallery. */
export const openUnsolved = (completed: number[]) =>
  pack.questIds.filter((id) => !completed.includes(id) && !isQuestClosed(id));

/** Next open, unsolved quest after `id` in route order, wrapping to any skipped ones. */
export function nextUnsolved(id: number, completed: number[]): number | null {
  const order = pack.questIds;
  const start = order.indexOf(id);
  for (let i = 1; i <= order.length; i++) {
    const candidate = order[(start + i) % order.length];
    if (candidate !== id && !completed.includes(candidate) && !isQuestClosed(candidate)) return candidate;
  }
  return null;
}

// Answers live in their own chunk, loaded only when a find is revealed or a
// grown-up opens the answer key. Calling this early just warms it for offline use.
let revealsPromise: Promise<QuestReveal[]> | null = null;
export function loadReveals(): Promise<QuestReveal[]> {
  revealsPromise ??= import("@/data/hidden-treasures/reveals")
    .then((m) => m.reveals)
    .catch((error) => {
      revealsPromise = null; // let a later call retry once the signal is back
      throw error;
    });
  return revealsPromise;
}
