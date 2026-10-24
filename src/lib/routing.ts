import type { ClosureOverride } from "@/data/closures";
import type { FloorMap, GalleryConnection } from "@/data/maps/types";

export interface Route {
  /** Galleries walked through, start and end included. */
  path: string[];
  /** The connections used, in order. */
  edges: GalleryConnection[];
}

type Graph = Pick<FloorMap, "nodes" | "connections">;
type Centers = Map<string, { x: number; y: number }>;

const centersByMap = new WeakMap<Graph["nodes"], Centers>();
function centersOf(nodes: Graph["nodes"]): Centers {
  let c = centersByMap.get(nodes);
  if (!c) centersByMap.set(nodes, (c = new Map(nodes.map((n) => [n.id, { x: n.x + n.w / 2, y: n.y + n.h / 2 }]))));
  return c;
}

/** Walking cost of a doorway: room middle to the doorway to the next room's middle. 1 when positions are unknown. */
function cost(centers: Centers, from: string, to: string, edge: GalleryConnection) {
  const a = centers.get(from), b = centers.get(to);
  if (!edge.at || !a || !b) return 1;
  return Math.hypot(edge.at.x - a.x, edge.at.y - a.y) + Math.hypot(b.x - edge.at.x, b.y - edge.at.y);
}

/**
 * Shortest walkable route between two galleries (spec v2, section D):
 * verified connections only, closed galleries and connections removed.
 * "Shortest" is walking distance on the schematic when doorway positions are known.
 * Returns null when no verified route exists; callers show the official-map fallback.
 */
export function findRoute(from: string, to: string, closures: ClosureOverride[], map: Graph): Route | null {
  const centers = centersOf(map.nodes);
  const closedGalleries = new Set(closures.filter((c) => c.galleryId && c.status === "closed").map((c) => String(c.galleryId)));
  const closedEdges = new Set(closures.filter((c) => c.connectionId && c.status === "closed").map((c) => c.connectionId));
  if (closedGalleries.has(from) || closedGalleries.has(to)) return null;

  const usable = map.connections.filter(
    (c) => c.verified && !closedEdges.has(c.id) && !closedGalleries.has(c.from) && !closedGalleries.has(c.to),
  );
  const adjacency = new Map<string, { next: string; edge: GalleryConnection; w: number }[]>();
  const link = (a: string, b: string, e: GalleryConnection) =>
    adjacency.set(a, [...(adjacency.get(a) ?? []), { next: b, edge: e, w: cost(centers, a, b, e) }]);
  for (const c of usable) {
    link(c.from, c.to, c);
    if (c.bidirectional) link(c.to, c.from, c);
  }

  // Dijkstra; ties broken by gallery id so the same map always gives the same route.
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, { at: string; edge: GalleryConnection }>();
  const done = new Set<string>();
  while (true) {
    let cur: string | null = null;
    for (const [id, d] of dist) {
      if (done.has(id)) continue;
      if (cur === null || d < dist.get(cur)! - 1e-9 || (Math.abs(d - dist.get(cur)!) < 1e-9 && id < cur)) cur = id;
    }
    if (cur === null || cur === to) break;
    done.add(cur);
    for (const { next, edge, w } of adjacency.get(cur) ?? []) {
      const d = dist.get(cur)! + w;
      if (!dist.has(next) || d < dist.get(next)! - 1e-9) {
        dist.set(next, d);
        prev.set(next, { at: cur, edge });
      }
    }
  }
  if (!dist.has(to)) return null;

  const path = [to];
  const edges: GalleryConnection[] = [];
  for (let step = prev.get(to); step; step = prev.get(step.at)) {
    path.unshift(step.at);
    edges.unshift(step.edge);
  }
  return { path, edges };
}
