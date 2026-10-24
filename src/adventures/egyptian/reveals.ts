import type { QuestReveal } from "../types";

// Answers. Loaded with a dynamic import() so they ship in their own chunk (see index.ts).
// Object ids and links are from the spec; images stay off until usage rights are
// confirmed (spec section 6.3), so imageUrl and openAccess are left out.

export const reveals: QuestReveal[] = [
  {
    id: 111,
    artwork: "Scarab ring of Sithathoryunet",
    hiddenObject: "Tiny scarab beetle on a royal ring, with red and blue decoration",
    metObjectId: 545530,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/545530",
  },
  {
    id: 112,
    artwork: "Canopic chest of Hapiankhtifi",
    hiddenObject: "Gilded eyes and stars decorating the chest/lid",
    metObjectId: 544327,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/544327",
  },
  {
    id: 114,
    artwork: "Coffin of Ahmose",
    hiddenObject: "Vulture with outstretched wings on the coffin's chest",
    metObjectId: 543865,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/543865",
  },
  {
    id: 115,
    artwork: "Head of an Osiride Statue of Hatshepsut",
    hiddenObject: "Hatshepsut wearing the double crown of Egypt",
    metObjectId: 549030,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/549030",
  },
  {
    id: 116,
    artwork: "Mirror with Hathor emblem",
    hiddenObject: "Hathor goddess emblem on the mirror handle",
    metObjectId: 545128,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/545128",
  },
  {
    id: 117,
    artwork: "Cosmetic spoon with feline handle",
    hiddenObject: "Small feline carved into the cosmetic spoon handle",
    metObjectId: 554745,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/554745",
  },
  {
    id: 122,
    artwork: "Funerary Figure of Akhenaten",
    hiddenObject: "Two ankh symbols held by the royal figure",
    metObjectId: 544684,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/544684",
  },
  {
    id: 123,
    artwork: "Jubilee Relief of Ramesses II",
    hiddenObject: "Row of upright cobra figures along the roof of the shrine above the king",
    metObjectId: 548209,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/548209",
  },
  {
    id: 124,
    artwork: "Ostracon with Pharaoh Spearing a Lion",
    hiddenObject: "Lion in a royal hunting scene drawn on a limestone fragment",
    metObjectId: 544076,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/544076",
  },
  {
    id: 125,
    artwork: "Cat amulet",
    hiddenObject: "Tiny cat-shaped amulet with spotted decoration",
    metObjectId: 553799,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/553799",
  },
  {
    id: 1171,
    artwork: "Heart amulet",
    hiddenObject: "Tiny heart-shaped glass amulet",
    metObjectId: 545417,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/545417",
  },
  {
    id: 126,
    artwork: "Inner Coffin of Kharushere",
    hiddenObject: "Scarab beetle at the top of the coffin's head",
    metObjectId: 550805,
    metObjectUrl: "https://www.metmuseum.org/art/collection/search/550805",
  },
];
