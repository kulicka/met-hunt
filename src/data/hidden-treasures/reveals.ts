import type { QuestReveal } from "../types";

// Load with a dynamic import() so answers ship in their own chunk and are only
// fetched once a treasure is found or grown-up mode opens.
// TODO: fill metObjectId / metObjectUrl / imageUrl from the Met Open Access
// dataset and set openAccess only after confirming isPublicDomain.
export const reveals: QuestReveal[] = [
  {
    id: 1,
    artist: "Édouard Manet",
    artwork: "Young Lady in 1866",
    year: "1866",
    hiddenObject: "Monocle",
    fact: "Manet’s model, Victorine Meurent, was a painter too, and her own paintings were shown in Paris.",
  },
  {
    id: 2,
    artist: "Edgar Degas",
    artwork: "The Collector of Prints",
    year: "1866",
    hiddenObject: "Small Chinese horse sculpture",
    fact: "Degas was a passionate art collector himself, just like the man in this painting.",
  },
  {
    id: 3,
    artist: "Edgar Degas",
    artwork: "Dancer with a Fan",
    hiddenObject: "Folding fan",
    fact: "Degas pictured ballet dancers so often that they appear in more than half of all his works.",
  },
  {
    id: 4,
    artist: "Henri de Toulouse-Lautrec",
    artwork: "Madame Thadée Natanson at the Theater",
    year: "1895",
    hiddenObject: "Tiny plaster elephant",
    fact: "Toulouse-Lautrec was famous for his bold posters of Paris theaters and dance halls.",
  },
  {
    id: 5,
    artist: "Claude Monet",
    artwork: "View of Vétheuil",
    year: "1880",
    hiddenObject: "Church tower",
    fact: "Monet lived in the village of Vétheuil for about three years and painted it again and again.",
  },
  {
    id: 6,
    artist: "Claude Monet",
    artwork: "The Manneporte (Étretat)",
    year: "1883",
    hiddenObject: "Two tiny people",
    fact: "The Manneporte is a giant natural stone arch on the coast of Normandy, in France.",
  },
  {
    id: 7,
    artist: "Pierre-Auguste Renoir",
    artwork: "The Daughters of Catulle Mendès",
    year: "1888",
    hiddenObject: "Flower in a girl’s hair",
    fact: "The three sisters were the daughters of a poet and a composer.",
  },
  {
    id: 8,
    artist: "Paul Gauguin",
    artwork: "Still Life with Teapot and Fruit",
    year: "1896",
    hiddenObject: "Small figure in the background",
    fact: "Gauguin painted this still life in Tahiti, far from his home in France.",
  },
  {
    id: 9,
    artist: "Pierre-Auguste Renoir",
    artwork: "Still Life with Flowers and Prickly Pears",
    hiddenObject: "Elephant-head handles on the vase",
    fact: "Prickly pears are the fruit of a cactus.",
  },
  {
    id: 10,
    artist: "Vincent van Gogh",
    artwork: "Oleanders",
    year: "1888",
    hiddenObject: "Book beside the flowers",
    fact: "The yellow book is a novel by Émile Zola, one of Van Gogh’s favorite writers.",
  },
];
