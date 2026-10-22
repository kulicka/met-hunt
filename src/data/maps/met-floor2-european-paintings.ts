// Original schematic of the Floor 2 European Paintings wing. Only gallery
// adjacency is modelled. Positions and doorways follow Alex's layout sketch of
// 2026-10-22 (Central Park side at top, Fifth Avenue side at bottom); check them
// against the current official Met map before launch.
//
// col/row are cells on a coarse grid, not GPS or real-world coordinates.

export interface MapRoom {
  gallery: string;
  col: number;
  row: number;
  /** Display label when one cell stands for more than one gallery. */
  label?: string;
}

export const rooms: MapRoom[] = [
  { gallery: "820", col: 1, row: 0 },
  { gallery: "823", col: 2, row: 0 },
  { gallery: "826", col: 3, row: 0 },
  { gallery: "830", col: 4, row: 0 },
  { gallery: "819", col: 1, row: 1 },
  { gallery: "822", col: 2, row: 1 },
  { gallery: "825", col: 3, row: 1 },
  { gallery: "828", col: 4, row: 1, label: "828/829" },
  { gallery: "818", col: 1, row: 2 },
  { gallery: "821", col: 2, row: 2 },
  { gallery: "824", col: 3, row: 2 },
  { gallery: "827", col: 4, row: 2 },
  { gallery: "809", col: 0, row: 3 },
  { gallery: "810", col: 1, row: 3 },
  { gallery: "811", col: 2, row: 3 },
  { gallery: "812", col: 3, row: 3 },
  { gallery: "813", col: 0, row: 4 },
  { gallery: "814", col: 1, row: 4 },
  { gallery: "815", col: 2, row: 4 },
  { gallery: "816", col: 3, row: 4 },
  { gallery: "817", col: 4, row: 4 },
];

// Doorways between galleries. Routes may only travel along these.
// Confirmed: there is no doorway between 817 and 818.
// Unconfirmed (assumed until Alex checks): 818-810 and 810-814 link the three bands.
export const doors: [string, string][] = [
  ["820", "823"], ["823", "826"], ["826", "830"],
  ["819", "822"], ["822", "825"], ["825", "828"],
  ["818", "821"], ["821", "824"], ["824", "827"],
  ["820", "819"], ["823", "822"], ["826", "825"],
  ["819", "818"], ["822", "821"], ["825", "824"],
  ["809", "810"], ["810", "811"], ["811", "812"],
  ["813", "814"], ["814", "815"], ["815", "816"], ["816", "817"],
  ["818", "810"],
  ["810", "814"],
];

const neighbors = new Map<string, string[]>();
for (const [a, b] of doors) {
  neighbors.set(a, [...(neighbors.get(a) ?? []), b]);
  neighbors.set(b, [...(neighbors.get(b) ?? []), a]);
}
for (const list of neighbors.values()) list.sort();

/**
 * Shortest walk through doorways, including galleries passed through on the way.
 * Rooms in `avoid` are never walked through (e.g. temporarily closed galleries).
 * Returns null when no open walk exists.
 */
export function walk(from: string, to: string, avoid: (gallery: string) => boolean = () => false): string[] | null {
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of neighbors.get(cur) ?? []) {
      if (!prev.has(n) && (n === to || !avoid(n))) {
        prev.set(n, cur);
        queue.push(n);
      }
    }
  }
  if (!prev.has(to)) return null;
  const path: string[] = [];
  for (let at: string | null = to; at != null; at = prev.get(at) ?? null) path.unshift(at);
  return path;
}
