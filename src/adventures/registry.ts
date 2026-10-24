import { egyptian } from "./egyptian";
import { europeanPaintings } from "./european-paintings";
import type { Adventure } from "./types";

// Every adventure the game offers, in the order the picker shows them.
// To add one, see docs/adding-an-adventure.md. Its answers and verification
// targets stay out of this file: reveals load lazily, and the server's half is
// in registry.server.ts.

export const adventures: Adventure[] = [europeanPaintings, egyptian];

/**
 * The adventure that saves, analytics events and photo checks from before the
 * picker existed belong to (it was the only one). Used to read old data, never
 * as a default choice: players always pick their adventure. Never change it.
 */
export const LEGACY_ADVENTURE_ID = europeanPaintings.id;

/** Show a "more adventures on the way" card on the picker. */
export const MORE_COMING_SOON = true;

export const adventureIds = adventures.map((a) => a.id);

export const adventureById = (id: string | undefined): Adventure | undefined => adventures.find((a) => a.id === id);
