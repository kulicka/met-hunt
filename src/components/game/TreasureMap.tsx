"use client";

import { useEffect, useRef } from "react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import type { ClosureOverride } from "@/data/closures";
import { galleryConnections, galleryNodes, type GalleryConnection, type GalleryNode } from "@/data/maps/met-floor2-european-paintings";
import { isGalleryClosed } from "@/lib/closures";
import { isQuestClosed, questByGallery, questById, questNumber, questOrder } from "@/lib/content";
import { findRoute } from "@/lib/routing";

const COL_W = 118, ROW_H = 86, GAP = 22, PAD_X = 24, PAD_TOP = 56, PAD_BOTTOM = 76;
const ROOM_W = COL_W - GAP, ROOM_H = ROW_H - GAP;
const maxCol = Math.max(...galleryNodes.map((n) => n.x));
const maxRow = Math.max(...galleryNodes.map((n) => n.y));
const MAP_W = PAD_X * 2 + (maxCol + 1) * COL_W - GAP;
const MAP_H = PAD_TOP + PAD_BOTTOM + (maxRow + 1) * ROW_H - GAP;

const byId = new Map(galleryNodes.map((n) => [n.id, n]));
const rx = (n: GalleryNode) => PAD_X + n.x * COL_W;
const ry = (n: GalleryNode) => PAD_TOP + n.y * ROW_H;
const cx = (id: string) => rx(byId.get(id)!) + ROOM_W / 2;
const cy = (id: string) => ry(byId.get(id)!) + ROOM_H / 2;
const pathD = (path: string[]) => path.map((g, i) => `${i ? "L" : "M"}${cx(g)} ${cy(g)}`).join(" ");

export type RoomState = "found" | "current" | "upcoming" | "closed";

export function roomState(questId: number, completed: number[], closures: ClosureOverride[], current?: number): RoomState {
  if (completed.includes(questId)) return "found";
  if (isQuestClosed(questId, closures)) return "closed";
  return questId === current ? "current" : "upcoming";
}

/** Verified routes between consecutive open quest galleries. Missing legs are simply not drawn. */
function huntPaths(closures: ClosureOverride[]): string[][] {
  const stops = questOrder.filter((g) => !isGalleryClosed(g, closures));
  const paths: string[][] = [];
  for (let i = 1; i < stops.length; i++) {
    const route = findRoute(stops[i - 1], stops[i], closures);
    if (route) paths.push(route.path);
  }
  return paths;
}

function Doorway({ c, closures }: { c: GalleryConnection; closures: ClosureOverride[] }) {
  const a = byId.get(c.from), b = byId.get(c.to);
  if (!a || !b) return null;
  const closed = isGalleryClosed(c.from, closures) || isGalleryClosed(c.to, closures) || closures.some((o) => o.connectionId === c.id);
  const cls = !c.verified ? "door door--unknown" : closed ? "door door--closed" : "door";
  if (a.y === b.y) {
    const left = a.x < b.x ? a : b;
    const x = rx(left) + ROOM_W - 2, y = ry(left) + ROOM_H / 2 - 9;
    return (
      <g className={cls}>
        <rect x={x} y={y} width={GAP + 4} height={18} rx={3} />
        {!c.verified && <text x={x + (GAP + 4) / 2} y={y + 14}>?</text>}
      </g>
    );
  }
  if (a.x === b.x) {
    const top = a.y < b.y ? a : b;
    const x = rx(top) + ROOM_W / 2 - 9, y = ry(top) + ROOM_H - 2;
    return (
      <g className={cls}>
        <rect x={x} y={y} width={18} height={GAP + 4} rx={3} />
        {!c.verified && <text x={x + 9} y={y + (GAP + 4) / 2 + 5}>?</text>}
      </g>
    );
  }
  return null; // not drawable on this grid; still usable for routing if verified
}

const MARK: Record<RoomState, string> = { found: "✓", current: "●", upcoming: "○", closed: "closed" };
const SPOKEN: Record<RoomState, string> = { found: "solved", current: "next mystery", upcoming: "still to discover", closed: "temporarily closed" };

interface Props {
  completed: number[];
  closures: ClosureOverride[];
  current?: number;
  /** Verified walk to emphasize (from the last solved gallery to the next one). */
  emphasis?: string[] | null;
  /** Quest to center on. */
  focus?: number;
  onSelect: (questId: number) => void;
}

export function TreasureMap({ completed, closures, current, emphasis, focus, onSelect }: Props) {
  const zoom = useRef<ReactZoomPanPinchContentRef>(null);
  const focusGallery = focus ? questById(focus)?.gallery : undefined;

  useEffect(() => {
    if (!focusGallery) return;
    const t = setTimeout(() => zoom.current?.zoomToElement(`room-${focusGallery}`, 1.9, 500), 150);
    return () => clearTimeout(t);
  }, [focusGallery]);

  return (
    <TransformWrapper ref={zoom} minScale={1} maxScale={3.5} centerOnInit doubleClick={{ mode: "zoomIn" }}>
      <TransformComponent wrapperClass="!w-full rounded-2xl border border-line bg-card/60" contentClass="!w-full">
        <svg
          className="tmap block h-auto w-full touch-none select-none"
          viewBox={`0 0 ${MAP_W} ${MAP_H}`}
          role="group"
          aria-label="Treasure map of the European Paintings galleries, schematic and not to scale. A list of the same information follows the map."
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

          <text className="edge-label" x={MAP_W / 2} y={30}>CENTRAL PARK SIDE</text>
          <text className="edge-label" x={MAP_W / 2} y={MAP_H - 40}>FIFTH AVENUE SIDE</text>
          <text className="schematic-label" x={MAP_W / 2} y={MAP_H - 14}>SCHEMATIC — NOT TO SCALE</text>

          <g className="compass" transform={`translate(${PAD_X + ROOM_W / 2} ${PAD_TOP + ROW_H})`} aria-hidden>
            <circle r="28" />
            <path d="M0 -24 L6 0 L0 24 L-6 0 Z" />
            <path className="north" d="M0 -24 L6 0 L-6 0 Z" />
            <text y="-32">N</text>
          </g>

          <g filter="url(#ink)">
            {galleryConnections.map((c) => (
              <Doorway key={c.id} c={c} closures={closures} />
            ))}
            {galleryNodes.map((n) => {
              const quest = questByGallery(n.id);
              const closed = isGalleryClosed(n.id, closures);
              if (!quest) {
                return (
                  <rect key={n.id} className={`room-body room--quiet-body${closed ? " room--blocked-body" : ""}`} x={rx(n)} y={ry(n)} width={ROOM_W} height={ROOM_H} rx={10} fill={closed ? "url(#hatch)" : undefined} aria-hidden />
                );
              }
              const state = roomState(quest.id, completed, closures, current);
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
                  {state === "current" && <rect className="pulse" x={rx(n)} y={ry(n)} width={ROOM_W} height={ROOM_H} rx={10} />}
                  <rect className="room-body" x={rx(n)} y={ry(n)} width={ROOM_W} height={ROOM_H} rx={10} fill={state === "closed" ? "url(#hatch)" : undefined} />
                </g>
              );
            })}
          </g>

          <g className="route" aria-hidden>
            {huntPaths(closures).map((p) => (
              <path key={p.join("-")} d={pathD(p)} />
            ))}
          </g>
          {emphasis && <path className="route-leg" d={pathD(emphasis)} aria-hidden />}

          {/* Labels sit above the route so the dotted line never hides a gallery number. */}
          <g className="labels" aria-hidden>
            {galleryNodes.map((n) => {
              const quest = questByGallery(n.id);
              const closed = isGalleryClosed(n.id, closures);
              if (!quest) {
                return (
                  <g key={n.id} className={`room room--quiet${closed ? " room--blocked" : ""}`}>
                    <text x={rx(n) + ROOM_W / 2} y={ry(n) + ROOM_H / 2 + (closed ? -2 : 5)}>{n.label}</text>
                    {closed && <text className="closed-note" x={rx(n) + ROOM_W / 2} y={ry(n) + ROOM_H / 2 + 16}>closed</text>}
                  </g>
                );
              }
              const state = roomState(quest.id, completed, closures, current);
              return (
                <g key={n.id} className={`room room--${state}`}>
                  <text className="num" x={rx(n) + ROOM_W / 2} y={ry(n) + ROOM_H / 2 + 2}>{n.label}</text>
                  <text className="mark" x={rx(n) + ROOM_W / 2} y={ry(n) + ROOM_H / 2 + 22}>{MARK[state]}</text>
                  <g className="badge" transform={`translate(${rx(n) + 4} ${ry(n) + 4})`}>
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
