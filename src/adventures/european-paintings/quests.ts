import type { QuestPublic } from "../types";

// Canonical riddles from the spec (section 21). Do not rewrite them.
export const quests: QuestPublic[] = [
  {
    id: 1,
    gallery: "810",
    riddle: ["I help you see, but I’m not a pair,", "Just one small circle hiding there."],
    hints: ["Look closely at the portraits.", "Look near someone’s face."],
  },
  {
    id: 2,
    gallery: "815",
    riddle: ["I have four legs but never race,", "For centuries I’ve stayed in place."],
    hints: ["This animal isn’t alive.", "Look among the objects surrounding a person."],
  },
  {
    id: 3,
    gallery: "816",
    riddle: ["I fold up small and spread out wide,", "To stir the air or help me hide."],
    hints: ["Look for something that can open and close.", "A person is holding it."],
  },
  {
    id: 4,
    gallery: "817",
    riddle: ["I’m big in life, but tiny here,", "My trunk is long, my feet stay near."],
    hints: ["You’re looking for an animal — but not a real one.", "It’s much smaller than you’d expect."],
  },
  {
    id: 5,
    gallery: "818",
    riddle: ["I have no voice, yet bells may ring,", "Above the roofs, I stand like a king."],
    hints: ["Look into the distance.", "Look above the rooftops."],
  },
  {
    id: 6,
    gallery: "819",
    riddle: ["We’re smaller than the rocks nearby,", "Two tiny travelers beneath the sky."],
    hints: ["The landscape is much bigger than what you’re searching for.", "Look near the enormous rock formation."],
  },
  {
    id: 7,
    gallery: "821",
    riddle: ["I bloom without a garden bed,", "And rest upon a little head."],
    hints: ["Look at the people, not the garden.", "Look closely at their hair."],
  },
  {
    id: 8,
    gallery: "822",
    riddle: ["I’m not a peach, I’m not a pear,", "But look behind — you’ll find me there."],
    hints: ["Don’t let all the fruit distract you.", "Look toward the upper-right background."],
  },
  {
    id: 9,
    gallery: "824",
    riddle: ["Two little trunks, but nowhere to roam,", "We hold the flowers in their home."],
    hints: ["The elephants are much smaller than real ones.", "Look at what is holding the flowers."],
  },
  {
    id: 10,
    gallery: "825",
    riddle: ["I have no voice, yet stories I tell,", "Beside the flowers, I quietly dwell."],
    hints: ["Don’t look only at the flowers.", "Look beside them for something you could read."],
  },
];
