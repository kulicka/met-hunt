import "server-only";
import { reveals as egyptianReveals } from "./egyptian/reveals";
import { verificationTargets as egyptianTargets } from "./egyptian/verification.server";
import { reveals as europeanPaintingsReveals } from "./european-paintings/reveals";
import { verificationTargets as europeanPaintingsTargets } from "./european-paintings/verification.server";
import { adventureById, LEGACY_ADVENTURE_ID } from "./registry";
import type { Adventure, QuestReveal, VerificationTarget } from "./types";

// The server's half of each adventure: what the photo checker looks for, and
// the answers the startup artwork check looks up. Never imported by the browser.

interface ServerAdventure {
  adventure: Adventure;
  targets: VerificationTarget[];
  reveals: QuestReveal[];
}

export const serverAdventures: ServerAdventure[] = [
  { adventure: adventureById("european-paintings")!, targets: europeanPaintingsTargets, reveals: europeanPaintingsReveals },
  { adventure: adventureById("met-egyptian-adventure")!, targets: egyptianTargets, reveals: egyptianReveals },
];

/** The verify target for one quest. Requests without an adventure come from pages loaded before there was a choice. */
export function verificationTarget(adventureId: string | null, questId: number): VerificationTarget | undefined {
  const entry = serverAdventures.find((s) => s.adventure.id === (adventureId ?? LEGACY_ADVENTURE_ID));
  return entry?.targets.find((t) => t.questId === questId);
}
