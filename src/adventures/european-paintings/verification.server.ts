import "server-only";
import type { VerificationTarget } from "../types";

// Quest-specific verification targets (spec section 21). The verify route builds
// its prompt from these; the client only ever sends a quest id.
export const verificationTargets: VerificationTarget[] = [
  {
    questId: 1,
    artist: "Édouard Manet",
    artwork: "Young Lady in 1866",
    hiddenObject: "Monocle",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows Manet’s “Young Lady in 1866” and that the monocle/single circular eyeglass detail is visible or sufficiently represented.",
  },
  {
    questId: 2,
    artist: "Edgar Degas",
    artwork: "The Collector of Prints",
    hiddenObject: "Small Chinese horse sculpture",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Degas’s “The Collector of Prints” and that the small horse sculpture is visible.",
  },
  {
    questId: 3,
    artist: "Edgar Degas",
    artwork: "Dancer with a Fan",
    hiddenObject: "Open folding fan",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Degas’s pastel “Dancer with a Fan” (The Met 29.100.557, ca. 1890–95) and that the open folding fan is visible. Gallery 816 also has Degas’s other “Dancer with a Fan” (29.100.188, ca. 1880); a photo of that one with its fan visible counts too.",
  },
  {
    questId: 4,
    artist: "Henri de Toulouse-Lautrec",
    artwork: "Madame Thadée Natanson at the Theater",
    hiddenObject: "Tiny plaster elephant",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Toulouse-Lautrec’s “Madame Thadée Natanson at the Theater” and that the small elephant figure is visible.",
  },
  {
    questId: 5,
    artist: "Claude Monet",
    artwork: "View of Vétheuil",
    hiddenObject: "Church tower",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Monet’s “View of Vétheuil” and that the distant church tower above the rooftops is visible.",
  },
  {
    questId: 6,
    artist: "Claude Monet",
    artwork: "The Manneporte (Étretat)",
    hiddenObject: "Two tiny people/figures",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Monet’s “The Manneporte (Étretat)” and that the two tiny human figures near/beneath the monumental rock formation can reasonably be identified.",
  },
  {
    questId: 7,
    artist: "Pierre-Auguste Renoir",
    artwork: "The Daughters of Catulle Mendès",
    hiddenObject: "Flower in a girl’s hair",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Renoir’s “The Daughters of Catulle Mendès” and that the flower worn in a girl’s hair is visible.",
  },
  {
    questId: 8,
    artist: "Paul Gauguin",
    artwork: "Still Life with Teapot and Fruit",
    hiddenObject: "Small human figure/person in the upper-right background",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Gauguin’s “Still Life with Teapot and Fruit” and that the small human figure in the upper-right/background area is visible.",
  },
  {
    questId: 9,
    artist: "Pierre-Auguste Renoir",
    artwork: "Still Life with Flowers and Prickly Pears",
    hiddenObject: "Elephant-head handles on the flower vase",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Renoir’s “Still Life with Flowers and Prickly Pears” and that at least one elephant-head/elephant-trunk vase handle is reasonably visible.",
  },
  {
    questId: 10,
    artist: "Vincent van Gogh",
    artwork: "Oleanders",
    hiddenObject: "Book beside the flowers",
    verificationDescription:
      "Verify that the submitted photograph plausibly shows Van Gogh’s “Oleanders” and that the book beside the flowers is visible.",
  },
];
