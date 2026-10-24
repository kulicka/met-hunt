// Built-in explorers. Names are fixed: the game never asks for or stores a
// child's own name. Illustrations are original SVGs in
// src/components/game/AvatarArt.tsx, keyed by imageAsset.

export interface Avatar {
  id: string;
  displayName: string;
  description: string;
  imageAsset: string;
  /** Shown first and larger in the explorer picker. */
  featured?: boolean;
}

export const avatars: Avatar[] = [
  { id: "scout", displayName: "Scout", description: "A sharp-eyed young detective who spots tiny details.", imageAsset: "scout" },
  { id: "fig", displayName: "Fig", description: "A clever, curious fox who loves clues.", imageAsset: "fig" },
  { id: "otto", displayName: "Otto", description: "A thoughtful owl who always looks twice.", imageAsset: "otto" },
  { id: "milo", displayName: "Milo", description: "An adventurous museum mouse who discovers overlooked treasures.", imageAsset: "milo" },
  { id: "cleo", displayName: "Cleo", description: "An elegant art-loving cat who notices beautiful details.", imageAsset: "cleo" },
  { id: "pip", displayName: "Pip", description: "A lively bird who sees things from new angles.", imageAsset: "pip" },
  { id: "dash", displayName: "Dash", description: "A curious dog who follows every lead.", imageAsset: "dash" },
  { id: "remy", displayName: "Remy", description: "A playful raccoon who finds the unexpected.", imageAsset: "remy" },
  // Newer explorers stay at the end so avatars[0] (the fallback) never changes.
  { id: "koti", displayName: "Koti", description: "A curious girl who can’t wait to see what’s around the next corner.", imageAsset: "koti", featured: true },
  { id: "mustard", displayName: "Mustard", description: "A little puppy who climbs every step to explore.", imageAsset: "mustard", featured: true },
];

export const avatarById = (id?: string) => avatars.find((a) => a.id === id) ?? avatars[0];
