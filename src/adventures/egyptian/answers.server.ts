import "server-only";
import type { QuestArtworkAnswer } from "@/lib/answer-match";

// Typed answers for "Continue without a photo". Accession numbers and official
// titles are from The Met's Open Access data (github.com/metmuseum/openaccess,
// MetObjects.csv, read 2026-10-24), matched by the object ids in reveals.ts.
// metCollectionId is the id in the collection URL and is never an answer.
// Where the gallery has look-alikes with the same title, only the number counts.

export const answers: QuestArtworkAnswer[] = [
  {
    questId: 105,
    metCollectionId: "544258",
    accessionNumbers: ["20.3.12"],
    canonicalTitle: "Model Bakery and Brewery from the Tomb of Meketre",
    // The Met also lists the figures on their own (Gallery 105, “20.3.12-BAKERS”); they are the bakers whose hands the riddle means.
    acceptedTitles: ["Model Bakery and Brewery", "Bakers and Brewers from Meketre's Model Bakery and Brewery"],
    titleUnique: true,
    nearbyTitles: ["Model of a Granary with Scribes", "Model of a Slaughter House", "Model Cattle stable from the tomb of Meketre", "Model of a procession of offering bearers"],
  },
  {
    questId: 107,
    metCollectionId: "545452",
    accessionNumbers: ["22.3.523a–f"],
    canonicalTitle: "Heqanakht Papyrus Fragments",
    acceptedTitles: [],
    titleUnique: true,
    // Heqanakht's letters and accounts are listed in Gallery 107 too; Accounts VI and VII also record grain.
    nearbyTitles: ["Heqanakht Letter I", "Heqanahkt Letter II", "Heqanakht Letter V", "Heqanakht Account VI", "Heqanakht Account VII", "Papyrus fragment", "Meketre papyrus"],
    curatorReview: "Gallery 107 also lists Heqanakht's letters and his grain accounts (Accounts VI and VII). Only the fragments 22.3.523a–f count; check on site that they are the papyrus children will find.",
  },
  {
    questId: 108,
    metCollectionId: "546098",
    accessionNumbers: ["15.3.1164"],
    canonicalTitle: "Relief block depicting plucking and roasting fowl and herds crossing water",
    acceptedTitles: ["Relief of Fowl and Herds Crossing Water"],
    titleUnique: true,
  },
  {
    questId: 110,
    metCollectionId: "329884",
    accessionNumbers: ["2021.41.106"],
    canonicalTitle: "Statuette of Reniseneb",
    acceptedTitles: [],
    titleUnique: true,
    nearbyTitles: ["Stela of Reniseneb", "Statuette of Lady Kemtet", "Statuette of Lady Dedetamun", "Statuette of the Steward Senbi"],
  },
  {
    questId: 111,
    metCollectionId: "545530",
    accessionNumbers: ["16.1.24"],
    canonicalTitle: "Scarab ring of Sithathoryunet",
    acceptedTitles: [],
    titleUnique: true,
    // Six other scarab rings are listed in Gallery 111.
    nearbyTitles: ["Scarab Ring", "Scarab Ring Without Mounting", "Scarab Ring Inscribed for a Lady Senebhotep"],
  },
  {
    questId: 112,
    metCollectionId: "544327",
    accessionNumbers: ["12.183.14a–c"],
    canonicalTitle: "Canopic chest of Hapiankhtifi",
    acceptedTitles: [],
    titleUnique: true,
    nearbyTitles: ["Canopic Chest of Senbi", "Canopic chest of Ukhhotep"],
  },
  {
    questId: 114,
    metCollectionId: "543865",
    accessionNumbers: ["14.10.2a, b"],
    canonicalTitle: "Coffin of Ahmose",
    acceptedTitles: [],
    // A second "Coffin of Ahmose" (12.181.298a, b) is also listed in Gallery 114.
    titleUnique: false,
    curatorReview: "Two objects titled “Coffin of Ahmose” are listed in Gallery 114, so only 14.10.2a, b counts. Approve the title if the other one is off view.",
  },
  {
    questId: 115,
    metCollectionId: "549030",
    accessionNumbers: ["31.3.159"],
    canonicalTitle: "Head of an Osiride Statue of Hatshepsut",
    acceptedTitles: [],
    titleUnique: true,
    nearbyTitles: ["Head from an Osiride Statue of Hatshepsut"],
  },
  {
    questId: 116,
    metCollectionId: "545128",
    accessionNumbers: ["36.3.13"],
    canonicalTitle: "Mirror",
    acceptedTitles: ["Mirror with Hathor emblem"],
    // The Met's title is just "Mirror", and another "Mirror" (36.3.12a, b) is in Gallery 116.
    titleUnique: false,
    curatorReview: "The label title is just “Mirror” (another mirror is in the same gallery), so players need the number 36.3.13 or the adventure's name “Mirror with Hathor emblem”.",
  },
  {
    questId: 117,
    metCollectionId: "554745",
    accessionNumbers: ["10.130.1288"],
    canonicalTitle: "Cosmetic spoon with feline handle",
    acceptedTitles: [],
    titleUnique: true,
    nearbyTitles: ["Cosmetic spoon with duck-head handle", "Cosmetic spoon"],
  },
  {
    questId: 1171,
    metCollectionId: "545417",
    accessionNumbers: ["10.130.1782"],
    canonicalTitle: "Heart amulet",
    acceptedTitles: [],
    // Three objects titled "Heart amulet" are listed in Gallery 117.
    titleUnique: false,
    curatorReview: "Three “Heart amulet”s are listed in Gallery 117, so only 10.130.1782 counts.",
  },
  {
    questId: 122,
    metCollectionId: "544684",
    accessionNumbers: ["47.57.2"],
    canonicalTitle: "Funerary Figure of Akhenaten",
    acceptedTitles: [],
    // Two more "Funerary Figure of Akhenaten" (1982.50, 66.99.35) are listed in Gallery 122.
    titleUnique: false,
    curatorReview: "Three “Funerary Figure of Akhenaten”s are listed in Gallery 122, so only 47.57.2 counts.",
  },
  {
    questId: 123,
    metCollectionId: "548209",
    accessionNumbers: ["05.4.256"],
    canonicalTitle: "Jubilee Relief of Ramesses II",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 124,
    metCollectionId: "544076",
    accessionNumbers: ["26.7.1453"],
    canonicalTitle: "Ostracon with Pharaoh Spearing a Lion and a Royal Hymn on its Back",
    acceptedTitles: ["Ostracon with Pharaoh Spearing a Lion"],
    titleUnique: true,
  },
  {
    questId: 125,
    metCollectionId: "553799",
    accessionNumbers: ["15.43.23"],
    canonicalTitle: "Cat amulet",
    acceptedTitles: [],
    titleUnique: true,
    nearbyTitles: ["Cat with kittens amulet"],
  },
  {
    questId: 126,
    metCollectionId: "550805",
    accessionNumbers: ["86.1.33a, b"],
    canonicalTitle: "Inner Coffin of Kharushere",
    acceptedTitles: [],
    titleUnique: true,
  },
];
