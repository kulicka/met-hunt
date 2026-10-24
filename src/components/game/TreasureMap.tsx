"use client";

import { useMemo } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import type { ClosureOverride } from "@/data/closures";
import type { FloorMap, GalleryConnection, GalleryNode } from "@/data/maps/types";
import { isGalleryClosed } from "@/lib/closures";
import { useAdventure, type AdventureContent } from "@/lib/content";

// Scale of the drawing. The part of the floor shown comes from the map (FloorMap.view);
// rooms beyond its edges are drawn too and simply run off the map.
const S = 6;
const PAD_BOTTOM = 34;
const INSET = 1.6; // px between neighbouring rooms, so walls read as gaps

/** Pixel helpers for one map. */
function geometry(map: FloorMap) {
  const view = map.view;
  const byId = new Map(map.nodes.map((n) => [n.id, n]));
  const px = (x: number) => (x - view.x) * S;
  const py = (y: number) => (y - view.y) * S;
  const center = (n: GalleryNode) => ({ x: px(n.x + n.w / 2), y: py(n.y + n.h / 2) });
  const edgeBetween = (a: string, b: string) =>
    map.connections.find((c) => (c.from === a && c.to === b) || (c.from === b && c.to === a));
  return {
    width: view.w * S,
    height: view.h * S + PAD_BOTTOM,
    byId,
    px,
    py,
    center,
    box: (n: GalleryNode) => ({ x: px(n.x) + INSET, y: py(n.y) + INSET, w: n.w * S - 2 * INSET, h: n.h * S - 2 * INSET }),
    doorPoint: (a: string, b: string) => {
      const at = edgeBetween(a, b)?.at;
      return at ? { x: px(at.x), y: py(at.y) } : center(byId.get(b)!);
    },
  };
}
type Geometry = ReturnType<typeof geometry>;

/** Room middle → doorway → room middle. Through a hallway the line follows the hall instead of its middle. */
function pathD({ byId, center, doorPoint }: Geometry, path: string[]) {
  const pts: { x: number; y: number }[] = [];
  path.forEach((id, i) => {
    const n = byId.get(id)!;
    if (n.kind === "corridor" && i > 0 && i < path.length - 1) {
      const c = center(n);
      pts.push({ x: c.x, y: doorPoint(path[i - 1], id).y }, { x: c.x, y: doorPoint(id, path[i + 1]).y });
    } else {
      pts.push(center(n));
    }
    if (i < path.length - 1) pts.push(doorPoint(id, path[i + 1]));
  });
  return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
}

export type RoomState = "found" | "current" | "upcoming" | "closed";

export function roomState(
  adv: AdventureContent,
  questId: number,
  completed: number[],
  closures: ClosureOverride[],
  current?: number,
): RoomState {
  if (completed.includes(questId)) return "found";
  if (adv.isQuestClosed(questId, closures)) return "closed";
  return questId === current ? "current" : "upcoming";
}

/** Verified routes between consecutive open quest galleries. Missing legs are simply not drawn. */
function huntPaths(adv: AdventureContent, closures: ClosureOverride[]): string[][] {
  const stops = adv.questOrder.filter((g) => !isGalleryClosed(g, closures));
  const paths: string[][] = [];
  for (let i = 1; i < stops.length; i++) {
    const route = adv.findRoute(stops[i - 1], stops[i], closures);
    if (route) paths.push(route.path);
  }
  return paths;
}

function Doorway({ g, c, closures }: { g: Geometry; c: GalleryConnection; closures: ClosureOverride[] }) {
  const { byId, px, py } = g;
  const a = byId.get(c.from);
  if (!a || !c.at) return null;
  const closed = isGalleryClosed(c.from, closures) || isGalleryClosed(c.to, closures) || closures.some((o) => o.connectionId === c.id);
  const cls = !c.verified ? "door door--unknown" : closed ? "door door--closed" : "door";
  // An opening in a left/right wall sits on the x edge of a room; otherwise it is in a top/bottom wall.
  const sideWall = Math.abs(c.at.x - a.x) < 0.6 || Math.abs(c.at.x - (a.x + a.w)) < 0.6;
  const [w, h] = sideWall ? [12, 26] : [26, 12];
  const x = px(c.at.x) - w / 2, y = py(c.at.y) - h / 2;
  return (
    <g className={cls}>
      <rect x={x} y={y} width={w} height={h} rx={3} />
      {!c.verified && <text x={px(c.at.x)} y={py(c.at.y) + 5}>?</text>}
    </g>
  );
}

const MARK: Record<RoomState, string> = { found: "✓", current: "●", upcoming: "○", closed: "closed" };
const SPOKEN: Record<RoomState, string> = { found: "solved", current: "next mystery", upcoming: "still to discover", closed: "temporarily closed" };

interface Props {
  completed: number[];
  closures: ClosureOverride[];
  current?: number;
  /** Verified walk to emphasize (from the last solved gallery to the next one). */
  emphasis?: string[] | null;
  onSelect: (questId: number) => void;
}

/** Only for adventures with a map (AdventureContent.hasRoutes). */
export function TreasureMap({ completed, closures, current, emphasis, onSelect }: Props) {
  const adv = useAdventure();
  const { map, questByGallery, questNumber } = adv;
  const g = useMemo(() => geometry(map!), [map]);
  const { width: MAP_W, height: MAP_H, box } = g;

  // Opens zoomed out, so the whole floor and the highlighted walk are in view;
  // players pinch or double-tap to look closer.
  return (
    <TransformWrapper minScale={1} maxScale={3.5} centerOnInit doubleClick={{ mode: "zoomIn" }}>
      <TransformComponent wrapperClass="!w-full rounded-2xl border border-line bg-card/60" contentClass="!w-full">
        <svg
          className="tmap block h-auto w-full touch-none select-none"
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="group"
          aria-label={map!.label}
        >
          <defs>
            <filter id="ink">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" />
              <feDisplacementMap in="SourceGraphic" scale="1.8" />
            </filter>
            <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="var(--line)" strokeWidth="3" />
            </pattern>
          </defs>

          <text className="schematic-label" x={MAP_W / 2} y={MAP_H - 12}>{map!.caption}</text>

          <g filter="url(#ink)">
            {map!.nodes.map((n) => {
              const b = box(n);
              const quest = questByGallery(n.id);
              const closed = isGalleryClosed(n.id, closures);
              if (!quest) {
                return (
                  <rect key={n.id} className={`room-body room--quiet-body${closed ? " room--blocked-body" : ""}`} x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill={closed ? "url(#hatch)" : undefined} aria-hidden />
                );
              }
              const state = roomState(adv, quest.id, completed, closures, current);
              const num = questNumber(quest.id);
              return (
                <g
                  key={n.id}
                  id={`room-${n.id}`}
                  className={`room room--${state}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Mystery ${num}, Gallery ${n.label}: ${SPOKEN[state]}`}
                  onClick={() => onSelect(quest.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(quest.id);
                    }
                  }}
                >
                  {state === "current" && <rect className="pulse" x={b.x} y={b.y} width={b.w} height={b.h} rx={6} />}
                  <rect className="room-body" x={b.x} y={b.y} width={b.w} height={b.h} rx={6} fill={state === "closed" ? "url(#hatch)" : undefined} />
                </g>
              );
            })}
            {map!.connections.map((c) => (
              <Doorway key={c.id} g={g} c={c} closures={closures} />
            ))}
          </g>

          <g className="route" aria-hidden>
            {huntPaths(adv, closures).map((p) => (
              <path key={p.join("-")} d={pathD(g, p)} />
            ))}
          </g>
          {emphasis && <path className="route-leg" d={pathD(g, emphasis)} aria-hidden />}

          {/* Labels sit above the route so the dotted line never hides a gallery number. */}
          <g className="labels" aria-hidden>
            {map!.nodes.map((n) => {
              const b = box(n);
              const quest = questByGallery(n.id);
              const closed = isGalleryClosed(n.id, closures);
              if (!quest) {
                return (
                  <g key={n.id} className={`room room--quiet${closed ? " room--blocked" : ""}`}>
                    <text x={b.x + b.w / 2} y={b.y + b.h / 2 + (closed ? -2 : 5)}>{n.label}</text>
                    {closed && <text className="closed-note" x={b.x + b.w / 2} y={b.y + b.h / 2 + 16}>closed</text>}
                  </g>
                );
              }
              const state = roomState(adv, quest.id, completed, closures, current);
              return (
                <g key={n.id} className={`room room--${state}`}>
                  <text className="num" x={b.x + b.w / 2} y={b.y + b.h / 2 + 2}>{n.label}</text>
                  <text className="mark" x={b.x + b.w / 2} y={b.y + b.h / 2 + 22}>{MARK[state]}</text>
                  <g className="badge" transform={`translate(${b.x + 16} ${b.y + 16})`}>
                    <circle r="11" />
                    <text y="4">{questNumber(quest.id)}</text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
