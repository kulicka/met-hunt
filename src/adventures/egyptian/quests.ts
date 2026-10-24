import type { BonusQuest, QuestPublic } from "../types";

// Egyptian Adventure launch edition (docs/egyptian-adventure-spec.md, section 3), plus
// the four Daily Life stops in Galleries 105–110 (docs/egyptian-four-new-quests-spec.md).
// riddle lines are editorially locked: spelling, punctuation, apostrophes and line
// breaks exactly as in the spec. Gallery 111 has four lines on purpose. Hints are
// draft copy and may be edited (with a hintSetVersion bump) without touching riddles.
// Quest ids are the gallery numbers; the bonus is 1171. Stable string ids (egy-111 …)
// are the analytics keys in versions.ts.

export const stops: Record<number, QuestPublic> = {
  // Daily Life stops: off until checked on site (EXPANDED_ROUTE in index.ts).
  105: {
    id: 105,
    gallery: "105",
    title: "The Flour-Covered Hands",
    riddle: ["My hands are white, but there's no snow,", "I'm making something you all know!"],
    hints: ["Look for someone preparing food.", "Find a tiny wooden workshop full of busy workers, and look at the hands of the ones making bread."],
  },
  107: {
    id: 107,
    gallery: "107",
    title: "The Ancient Shopping List",
    riddle: ["No carts, no stores, no checkout line,", "I counted grain in ancient time!"],
    hints: ["Find a message written on papyrus.", "Look for torn pieces of papyrus covered in rows of ancient writing that kept track of grain."],
  },
  108: {
    id: 108,
    gallery: "108",
    title: "The Cows Crossing the Water",
    riddle: ["We have four hooves, but here's the twist,", "We're walking where the fish exist!"],
    hints: ["Look carefully at a carved scene with animals.", "Find the stone carving where a herd is being led through water."],
  },
  110: {
    id: 110,
    gallery: "110",
    title: "The Girl with a Secret Braid",
    riddle: ["I'm just a child from long ago,", "One special braid I have to show!"],
    hints: ["Look at the child's hairstyle.", "Find a small statue of a girl with one braid hanging down the side of her head."],
  },
  111: {
    id: 111,
    gallery: "111",
    title: "The Princess's Golden Beetle",
    riddle: ["Among a princess's treasures bright,", "A tiny beetle catches the light.", "With red and blue upon my back,", "Find the jewel in the royal pack."],
    hints: ["Look for something a princess could wear.", "Find a small beetle-shaped ring among royal jewelry."],
  },
  112: {
    id: 112,
    gallery: "112",
    title: "The Chest with Golden Eyes",
    riddle: ["I have no face, but eyes that see,", "A thousand stars look down on me."],
    hints: ["Find an ancient chest rather than a statue.", "Look for painted or gilded eyes and stars."],
  },
  114: {
    id: 114,
    gallery: "114",
    title: "The Bird with Spread Wings",
    riddle: ["I never flutter, never fly,", "My wings spread wide as years go by."],
    hints: ["Look at the decoration on a coffin.", "Find the bird spreading its wings across the chest."],
  },
  115: {
    id: 115,
    gallery: "115",
    title: "The Double Queen",
    riddle: ["One royal head, two crowns to show,", "A double queen from long ago."],
    hints: ["Search for a sculpture of a ruler.", "Find the tall crown combining two shapes on Hatshepsut's head."],
  },
  116: {
    id: 116,
    gallery: "116",
    title: "The Mirror's Secret",
    riddle: ["I once reflected every face,", "A goddess guards my holding place."],
    hints: ["Find a beauty tool from ancient Egypt.", "Look closely at the handle of a mirror."],
  },
  117: {
    id: 117,
    gallery: "117",
    title: "The Cat on the Handle",
    riddle: ["I'm not a pet, I never roam,", "A beauty tool became my home."],
    hints: ["Look for something used to hold cosmetics.", "Search the handle of a small spoon for a cat-like animal."],
  },
  122: {
    id: 122,
    gallery: "122",
    title: "The King with Two Keys",
    riddle: ["No locks to open, no doors to see,", "Two ancient keys belong to me."],
    hints: ["Find a small royal figure holding something.", "Look for two loop-topped ankh symbols, shaped like keys."],
  },
  123: {
    id: 123,
    gallery: "123",
    title: "The Roof of Cobras",
    riddle: ["We have no feet, but stand in line,", "Above a king in stone design."],
    hints: ["Look for a large carved stone scene featuring a king.", "Inspect the top of the shrine for a row of snakes."],
  },
  124: {
    id: 124,
    gallery: "124",
    title: "The Lion and the Pharaoh",
    riddle: ["A mighty king is hunting me,", "But I’m as still as still can be."],
    hints: ["Look for a drawing, not a large statue.", "Find the lion beside a pharaoh in a hunting scene."],
  },
  125: {
    id: 125,
    gallery: "125",
    title: "The Spotted Cat",
    riddle: ["I'm small enough to hide from you,", "With spotted fur that isn't true."],
    hints: ["Look for a very small animal amulet.", "Find the cat decorated with little spots."],
  },
  126: {
    id: 126,
    gallery: "126",
    title: "The Beetle on the Head",
    riddle: ["I'm not a hairpin, not a hat,", "But on a head is where I'm at."],
    hints: ["Find a brightly decorated coffin.", "Look at the top of the coffin's head for a beetle."],
  },
};

/** Optional: found in Gallery 117, never counts toward the ten. */
export const bonusQuests: BonusQuest[] = [
  {
    id: 1171,
    atQuest: 117,
    gallery: "117",
    title: "The Heart That Never Beats",
    riddle: ["I never beat, yet memories keep,", "A tiny heart that cannot sleep."],
    hints: ["Search for a small glass amulet.", "Find the tiny heart shape."],
  },
];
