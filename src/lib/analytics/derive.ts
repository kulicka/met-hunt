import type { AdventureState } from "@/lib/adventure";

// What happened between two adventure states, for analytics. Pure, so the
// mapping from game state to events can be tested without a browser.

export type Change =
  | { type: "adventure_started" }
  | { type: "adventure_resumed" }
  | { type: "adventure_ended_early" }
  | { type: "adventure_completed" }
  | { type: "quest_completed"; questId: number; method: CompletionMethod; hintsUsed: number }
  | { type: "quest_hint_opened"; questId: number; level: 1 | 2 };

export type CompletionMethod = "ai_verified" | "text_verified" | "parent_confirmed";

const completionMethod = (m: AdventureState["verificationMethod"][number] | undefined): CompletionMethod =>
  m === "ai-photo" ? "ai_verified" : m === "text" ? "text_verified" : "parent_confirmed";

export function changes(prev: AdventureState, next: AdventureState): Change[] {
  const out: Change[] = [];
  if (prev.status === "not_started" && next.status !== "not_started") out.push({ type: "adventure_started" });
  if (prev.status === "ended_early" && next.status === "in_progress") out.push({ type: "adventure_resumed" });
  if (prev.status === "in_progress" && next.status === "ended_early") out.push({ type: "adventure_ended_early" });

  for (const [key, used] of Object.entries(next.hintsUsed)) {
    const id = Number(key);
    const before = prev.hintsUsed[id] ?? 0;
    // One event per level, in case two hints were opened between observations.
    for (let level = before + 1; level <= used; level++) {
      if (level === 1 || level === 2) out.push({ type: "quest_hint_opened", questId: id, level });
    }
  }

  for (const id of next.completedQuests) {
    if (prev.completedQuests.includes(id)) continue;
    const method = completionMethod(next.verificationMethod[id]);
    out.push({ type: "quest_completed", questId: id, method, hintsUsed: next.hintsUsed[id] ?? 0 });
  }

  // Bonus finds are quests too (their own stable keys), but never count toward completion.
  for (const id of next.bonusFound ?? []) {
    if (prev.bonusFound?.includes(id)) continue;
    const method = completionMethod(next.verificationMethod[id]);
    out.push({ type: "quest_completed", questId: id, method, hintsUsed: next.hintsUsed[id] ?? 0 });
  }

  if (prev.status !== "completed" && next.status === "completed") out.push({ type: "adventure_completed" });
  return out;
}
