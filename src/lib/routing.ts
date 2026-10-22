import { galleryConnections, type GalleryConnection } from "@/data/maps/met-floor2-european-paintings";
import type { ClosureOverride } from "@/data/closures";

export interface Route {
  /** Galleries walked through, start and end included. */
  path: string[];
  /** The connections used, in order. */
  edges: GalleryConnection[];
}

/**
 * Shortest walkable route between two galleries (spec v2, section D):
 * verified connections only, closed galleries and connections removed.
 * Returns null when no verified route exists; callers show the official-map fallback.
 */
export function findRoute(
  from: string,
  to: string,
  closures: ClosureOverride[],
  connections: GalleryConnection[] = galleryConnections,
): Route | null {
  const closedGalleries = new Set(closures.filter((c) => c.galleryId && c.status === "closed").map((c) => String(c.galleryId)));
  const closedEdges = new Set(closures.filter((c) => c.connectionId && c.status === "closed").map((c) => c.connectionId));
  if (closedGalleries.has(from) || closedGalleries.has(to)) return null;

  const usable = connections.filter(
    (c) => c.verified && !closedEdges.has(c.id) && !closedGalleries.has(c.from) && !closedGalleries.has(c.to),
  );
  const adjacency = new Map<string, { next: string; edge: GalleryConnection }[]>();
  const link = (a: string, b: string, e: GalleryConnection) =>
    adjacency.set(a, [...(adjacency.get(a) ?? []), { next: b, edge: e }]);
  for (const c of usable) {
    link(c.from, c.to, c);
    if (c.bidirectional) link(c.to, c.from, c);
  }
  for (const list of adjacency.values()) list.sort((p, q) => p.next.localeCompare(q.next));

  const prev = new Map<string, { at: string; edge: GalleryConnection } | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const { next, edge } of adjacency.get(cur) ?? []) {
      if (!prev.has(next)) {
        prev.set(next, { at: cur, edge });
        queue.push(next);
      }
    }
  }
  if (!prev.has(to)) return null;

  const path = [to];
  const edges: GalleryConnection[] = [];
  for (let step = prev.get(to); step; step = prev.get(step.at)) {
    path.unshift(step.at);
    edges.unshift(step.edge);
  }
  return { path, edges };
}
