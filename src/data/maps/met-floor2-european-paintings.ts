// Original schematic of the Floor 2 European Paintings wing. Only gallery
// adjacency is modelled. Positions and doorways follow Alex's layout sketch
// (Central Park at top, Fifth Avenue at bottom); check them against the
// current official Met map before launch.
//
// col/row are cells on a coarse grid, not GPS or real-world coordinates.

export interface MapRoom {
  gallery: string;
  col: number;
  row: number;
}

export const rooms: MapRoom[] = [
  { gallery: "820", col: 0, row: 0 },
  { gallery: "823", col: 1, row: 0 },
  { gallery: "826", col: 2, row: 0 },
  { gallery: "819", col: 0, row: 1 },
  { gallery: "822", col: 1, row: 1 },
  { gallery: "825", col: 2, row: 1 },
  { gallery: "818", col: 0, row: 2 },
  { gallery: "821", col: 1, row: 2 },
  { gallery: "824", col: 2, row: 2 },
  { gallery: "810", col: 0, row: 3 },
  { gallery: "811", col: 1, row: 3 },
  { gallery: "812", col: 2, row: 3 },
  { gallery: "813", col: 0, row: 4 },
  { gallery: "814", col: 1, row: 4 },
  { gallery: "815", col: 2, row: 4 },
  { gallery: "816", col: 3, row: 4 },
  { gallery: "817", col: 4, row: 4 },
];

// Doorways between galleries. Routes may only travel along these.
// The sketch draws 810/811/812 as one area; here they are a connected row.
export const doors: [string, string][] = [
  ["820", "819"], ["823", "822"],
  ["819", "822"], ["822", "825"],
  ["819", "818"], ["822", "821"], ["825", "824"],
  ["818", "821"], ["821", "824"],
  ["818", "810"], ["810", "811"], ["811", "812"],
  ["810", "813"],
  ["813", "814"], ["814", "815"], ["815", "816"], ["816", "817"],
];

const neighbors = new Map<string, string[]>();
for (const [a, b] of doors) {
  neighbors.set(a, [...(neighbors.get(a) ?? []), b]);
  neighbors.set(b, [...(neighbors.get(b) ?? []), a]);
}
for (const list of neighbors.values()) list.sort();

/** Shortest walk through doorways, including galleries passed through on the way. */
export function walk(from: string, to: string): string[] {
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of neighbors.get(cur) ?? []) {
      if (!prev.has(n)) {
        prev.set(n, cur);
        queue.push(n);
      }
    }
  }
  if (!prev.has(to)) return [from, to];
  const path: string[] = [];
  for (let at: string | null = to; at != null; at = prev.get(at) ?? null) path.unshift(at);
  return path;
}
