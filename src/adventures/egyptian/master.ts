// The original Egyptian master collection (spec section 4), kept as an immutable
// archive: id "met-egyptian-original-master-v1". It is never played and never
// edited. The launch edition (quests.ts) is a separate, separately versioned copy;
// a test checks the two agree where they share a stop, and that nothing here
// changes. Closed galleries (118–120) and the unconfirmed Gallery 113 baboon live
// only here until their objects and galleries are confirmed.

export interface MasterMystery {
  gallery: string;
  title: string;
  riddle: string[];
  /** null when no specific on-view object is identified yet. */
  metObjectId: number | null;
  status: string;
  optional?: true;
}

export const EGYPTIAN_MASTER_ID = "met-egyptian-original-master-v1";

export const egyptianOriginalMaster: readonly MasterMystery[] = Object.freeze([
  { gallery: "111", title: "The Princess's Golden Beetle", riddle: ["Among a princess's treasures bright,", "A tiny beetle catches the light.", "With red and blue upon my back,", "Find the jewel in the royal pack."], metObjectId: 545530, status: "Provisional four-line riddle" },
  { gallery: "112", title: "The Chest with Golden Eyes", riddle: ["I have no face, but eyes that see,", "A thousand stars look down on me."], metObjectId: 544327, status: "Saved" },
  { gallery: "113", title: "The Ancient Baboon", riddle: ["I never climb, I never leap,", "An ancient monkey with secrets to keep."], metObjectId: null, status: "Do not enable until specific on-view object identified" },
  { gallery: "114", title: "The Bird with Spread Wings", riddle: ["I never flutter, never fly,", "My wings spread wide as years go by."], metObjectId: 543865, status: "Saved" },
  { gallery: "115", title: "The Double Queen", riddle: ["One royal head, two crowns to show,", "A double queen from long ago."], metObjectId: 549030, status: "Exact target sculpture should be validated" },
  { gallery: "116", title: "The Mirror's Secret", riddle: ["I once reflected every face,", "A goddess guards my holding place."], metObjectId: 545128, status: "Saved" },
  { gallery: "117", title: "The Cat on the Handle", riddle: ["I'm not a pet, I never roam,", "A beauty tool became my home."], metObjectId: 554745, status: "Saved" },
  { gallery: "118", title: "The Royal Cats", riddle: ["Nine lives to live, but none to chase,", "Among bright jewels, I have my place."], metObjectId: 548681, status: "Gallery reported closed 2026-10-23" },
  { gallery: "119", title: "The Secret Name Inside Life", riddle: ["Find a blue symbol shaped like a key,", "A king's name waits inside of me."], metObjectId: 548476, status: "Gallery reported closed 2026-10-23" },
  { gallery: "120", title: "The Ancient Puzzle", riddle: ["No puzzle box, no missing clue,", "Just ancient pieces dressed in blue."], metObjectId: 551605, status: "Gallery reported closed 2026-10-23" },
  { gallery: "117", title: "The Heart That Never Beats", riddle: ["I never beat, yet memories keep,", "A tiny heart that cannot sleep."], metObjectId: 545417, status: "Optional bonus", optional: true },
]);
