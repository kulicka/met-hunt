import { floor2EuropeanPaintings } from "@/data/maps/met-floor2-european-paintings";
import type { Adventure } from "../types";
import { quests } from "./quests";
import { CONTENT_PACK_VERSION, questVersions } from "./versions";

// The first adventure: ten hidden details in Floor 2's European Paintings
// galleries (spec v2.0). Riddles are canonical; see versions.ts before editing.
export const europeanPaintings: Adventure = {
  id: "european-paintings",
  title: "European Paintings",
  where: "Floor 2 · Galleries 810–825",
  description: "10 galleries. 10 mysteries. Can you find them all?",
  emoji: "🖼️",
  launchStatus: "ready",
  quests,
  map: floor2EuropeanPaintings,
  loadReveals: () => import("./reveals").then((m) => m.reveals),
  loadStamps: () => import("./Stamps"),
  versions: { contentPackVersion: CONTENT_PACK_VERSION, quests: questVersions },
  certificate: {
    fullTitle: "LEGENDARY ART DETECTIVE",
    partialTitle: "EXPLORER OF HIDDEN TREASURES",
  },
  // Before adventures were pluggable, this was the only hunt and saved here.
  legacyProgressKeys: ["met-hidden-treasures:adventure:v2", "met-hidden-treasures:progress:v1"],
};
