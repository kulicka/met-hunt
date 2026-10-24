import "server-only";
import type { QuestArtworkAnswer } from "@/lib/answer-match";

// Typed answers for "Continue without a photo". Accession numbers, object ids and
// official titles are from The Met's Open Access data (github.com/metmuseum/openaccess,
// MetObjects.csv, read 2026-10-24), matched by artist, title and gallery.
// metCollectionId is the id in the collection URL and is never an answer.

export const answers: QuestArtworkAnswer[] = [
  {
    questId: 1,
    metCollectionId: "436964",
    accessionNumbers: ["89.21.3"],
    canonicalTitle: "Young Lady in 1866",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 2,
    metCollectionId: "436122",
    accessionNumbers: ["29.100.44"],
    canonicalTitle: "The Collector of Prints",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 3,
    // Two Degas pastels titled "Dancer with a Fan" are listed in Gallery 816
    // (29.100.188, ca. 1880, object 436135; 29.100.557, ca. 1890–95, object 436136).
    // Which one is the mystery isn't recorded, so typed answers aren't checked yet.
    metCollectionId: "",
    accessionNumbers: [],
    canonicalTitle: "Dancer with a Fan",
    acceptedTitles: [],
    titleUnique: false,
    curatorReview: "Two “Dancer with a Fan” pastels hang in Gallery 816 (29.100.188 and 29.100.557). Pick the target; until then typed answers can't be checked here.",
  },
  {
    questId: 4,
    metCollectionId: "437833",
    accessionNumbers: ["64.153"],
    canonicalTitle: "Madame Thadée Natanson (Misia Godebska, 1872–1950) at the Theater",
    acceptedTitles: ["Madame Thadée Natanson at the Theater"],
    titleUnique: true,
  },
  {
    questId: 5,
    metCollectionId: "437110",
    accessionNumbers: ["56.135.1"],
    canonicalTitle: "View of Vétheuil",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 6,
    metCollectionId: "438823",
    accessionNumbers: ["51.30.5"],
    canonicalTitle: "The Manneporte (Etretat)",
    acceptedTitles: [],
    titleUnique: true,
    // Monet's other Manneporte (1886, 31.67.11) hangs in the same gallery.
    nearbyTitles: ["The Manneporte near Etretat"],
  },
  {
    questId: 7,
    metCollectionId: "438014",
    accessionNumbers: ["1998.325.3"],
    canonicalTitle: "The Daughters of Catulle Mendès, Huguette (1871–1964), Claudine (1876–1937), and Helyonne (1879–1955)",
    acceptedTitles: ["The Daughters of Catulle Mendès"],
    titleUnique: true,
  },
  {
    questId: 8,
    metCollectionId: "437999",
    accessionNumbers: ["1997.391.2"],
    canonicalTitle: "Still Life with Teapot and Fruit",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 9,
    metCollectionId: "441104",
    accessionNumbers: ["2010.454"],
    canonicalTitle: "Still Life with Flowers and Prickly Pears",
    acceptedTitles: [],
    titleUnique: true,
  },
  {
    questId: 10,
    metCollectionId: "436530",
    accessionNumbers: ["62.24"],
    canonicalTitle: "Oleanders",
    acceptedTitles: [],
    titleUnique: true,
  },
];
