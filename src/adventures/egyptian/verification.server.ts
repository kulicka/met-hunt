import "server-only";
import type { VerificationTarget } from "../types";

// What the photo checker looks for at each stop. verificationNotes from the spec are
// field-test reminders for people (see fieldNotes in index.ts), not checker instructions.

export const verificationTargets: VerificationTarget[] = [
  {
    questId: 105,
    artwork: "Model Bakery and Brewery",
    hiddenObject: "White flour painted on a baker's hands",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Model Bakery and Brewery” (The Met object 544258) and that this detail is visible: White flour painted on a baker's hands. Other wooden tomb models from Meketre stand nearby (a granary, a slaughterhouse, boats); only the bakery and brewery counts.",
  },
  {
    questId: 107,
    artwork: "Heqanakht Papyrus Fragments",
    hiddenObject: "Ancient writing recording grain and household accounts",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Heqanakht Papyrus Fragments” (The Met object 545452) and that this detail is visible: Ancient writing recording grain and household accounts. Several other Heqanakht letters and accounts are shown in the same gallery; the photo must show these fragments, not just any papyrus or a label.",
  },
  {
    questId: 108,
    artwork: "Relief of Fowl and Herds Crossing Water",
    hiddenObject: "Cattle being led through water in a carved relief",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Relief of Fowl and Herds Crossing Water” (The Met object 546098) and that this detail is visible: Cattle being led through water in a carved relief.",
  },
  {
    questId: 110,
    artwork: "Statuette of Reniseneb",
    hiddenObject: "A child's distinctive side braid",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Statuette of Reniseneb” (The Met object 329884) and that this detail is visible: A child's distinctive side braid. A stela of the same person is in the same gallery; only the small statue of the girl counts.",
  },
  {
    questId: 111,
    artwork: "Scarab ring of Sithathoryunet",
    hiddenObject: "Tiny scarab beetle on a royal ring, with red and blue decoration",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Scarab ring of Sithathoryunet” (The Met object 545530) and that this detail is visible: Tiny scarab beetle on a royal ring, with red and blue decoration.",
  },
  {
    questId: 112,
    artwork: "Canopic chest of Hapiankhtifi",
    hiddenObject: "Gilded eyes and stars decorating the chest/lid",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Canopic chest of Hapiankhtifi” (The Met object 544327) and that this detail is visible: Gilded eyes and stars decorating the chest/lid.",
  },
  {
    questId: 114,
    artwork: "Coffin of Ahmose",
    hiddenObject: "Vulture with outstretched wings on the coffin's chest",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Coffin of Ahmose” (The Met object 543865) and that this detail is visible: Vulture with outstretched wings on the coffin's chest.",
  },
  {
    questId: 115,
    artwork: "Head of an Osiride Statue of Hatshepsut",
    hiddenObject: "Hatshepsut wearing the double crown of Egypt",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Head of an Osiride Statue of Hatshepsut” (The Met object 549030) and that this detail is visible: Hatshepsut wearing the double crown of Egypt. Several sculptures wear double crowns; only this object counts.",
  },
  {
    questId: 116,
    artwork: "Mirror with Hathor emblem",
    hiddenObject: "Hathor goddess emblem on the mirror handle",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Mirror with Hathor emblem” (The Met object 545128) and that this detail is visible: Hathor goddess emblem on the mirror handle.",
  },
  {
    questId: 117,
    artwork: "Cosmetic spoon with feline handle",
    hiddenObject: "Small feline carved into the cosmetic spoon handle",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Cosmetic spoon with feline handle” (The Met object 554745) and that this detail is visible: Small feline carved into the cosmetic spoon handle.",
  },
  {
    questId: 122,
    artwork: "Funerary Figure of Akhenaten",
    hiddenObject: "Two ankh symbols held by the royal figure",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Funerary Figure of Akhenaten” (The Met object 544684) and that this detail is visible: Two ankh symbols held by the royal figure.",
  },
  {
    questId: 123,
    artwork: "Jubilee Relief of Ramesses II",
    hiddenObject: "Row of upright cobra figures along the roof of the shrine above the king",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Jubilee Relief of Ramesses II” (The Met object 548209) and that this detail is visible: Row of upright cobra figures along the roof of the shrine above the king.",
  },
  {
    questId: 124,
    artwork: "Ostracon with Pharaoh Spearing a Lion",
    hiddenObject: "Lion in a royal hunting scene drawn on a limestone fragment",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Ostracon with Pharaoh Spearing a Lion” (The Met object 544076) and that this detail is visible: Lion in a royal hunting scene drawn on a limestone fragment.",
  },
  {
    questId: 125,
    artwork: "Cat amulet",
    hiddenObject: "Tiny cat-shaped amulet with spotted decoration",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Cat amulet” (The Met object 553799) and that this detail is visible: Tiny cat-shaped amulet with spotted decoration.",
  },
  {
    questId: 1171,
    artwork: "Heart amulet",
    hiddenObject: "Tiny heart-shaped glass amulet",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Heart amulet” (The Met object 545417) and that this detail is visible: Tiny heart-shaped glass amulet.",
  },
  {
    questId: 126,
    artwork: "Inner Coffin of Kharushere",
    hiddenObject: "Scarab beetle at the top of the coffin's head",
    verificationDescription:
      "Verify that the submitted museum photograph plausibly shows the Egyptian artwork “Inner Coffin of Kharushere” (The Met object 550805) and that this detail is visible: Scarab beetle at the top of the coffin's head.",
  },
];
