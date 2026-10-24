import "server-only";
import type { QuestArtworkAnswer } from "@/lib/answer-match";
import { answers as egyptianAnswers } from "./egyptian/answers.server";
import { reveals as egyptianReveals } from "./egyptian/reveals";
import { verificationTargets as egyptianTargets } from "./egyptian/verification.server";
import { answers as europeanPaintingsAnswers } from "./european-paintings/answers.server";
import { reveals as europeanPaintingsReveals } from "./european-paintings/reveals";
import { verificationTargets as europeanPaintingsTargets } from "./european-paintings/verification.server";
import { adventureById, LEGACY_ADVENTURE_ID } from "./registry";
import type { Adventure, QuestReveal, VerificationTarget } from "./types";

// The server's half of each adventure: what the photo checker looks for, the
// typed answers it accepts, and the answers the startup artwork check looks up. Never imported by the browser.

interface ServerAdventure {
  adventure: Adventure;
  targets: VerificationTarget[];
  reveals: QuestReveal[];
  answers: QuestArtworkAnswer[];
}

export const serverAdventures: ServerAdventure[] = [
  { adventure: adventureById("european-paintings")!, targets: europeanPaintingsTargets, reveals: europeanPaintingsReveals, answers: europeanPaintingsAnswers },
  { adventure: adventureById("met-egyptian-adventure")!, targets: egyptianTargets, reveals: egyptianReveals, answers: egyptianAnswers },
];

const entryFor = (adventureId: string | null) => serverAdventures.find((s) => s.adventure.id === (adventureId ?? LEGACY_ADVENTURE_ID));

/** The verify target for one quest. Requests without an adventure come from pages loaded before there was a choice. */
export function verificationTarget(adventureId: string | null, questId: number): VerificationTarget | undefined {
  return entryFor(adventureId)?.targets.find((t) => t.questId === questId);
}

/** The typed-answer set for one quest, or undefined when none is curated yet. */
export function questAnswer(adventureId: string | null, questId: number): QuestArtworkAnswer | undefined {
  return entryFor(adventureId)?.answers.find((a) => a.questId === questId);
}
