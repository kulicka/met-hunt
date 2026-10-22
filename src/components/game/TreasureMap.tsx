"use client";

import { useEffect, useRef } from "react";
import { TransformComponent, TransformWrapper, type ReactZoomPanPinchContentRef } from "react-zoom-pan-pinch";
import { isGalleryClosed } from "@/data/gallery-status";
import { doors, rooms, walk, type MapRoom } from "@/data/maps/met-floor2-european-paintings";
import { pack, questByGallery, questById, questNumber } from "@/lib/content";

const COL_W = 118, ROW_H = 86, GAP = 22, PAD_X = 24, PAD_TOP = 56, PAD_BOTTOM = 56;
const ROOM_W = COL_W - GAP, ROOM_H = ROW_H - GAP;
const maxCol = Math.max(...rooms.map((r) => r.col));
const maxRow = Math.max(...rooms.map((r) => r.row));
export const MAP_W = PAD_X * 2 + (maxCol + 1) * COL_W - GAP;
export const MAP_H = PAD_TOP + PAD_BOTTOM + (maxRow + 1) * ROW_H - GAP;

const byGallery = new Map(rooms.map((r) => [r.gallery, r]));
const x = (r: MapRoom) => PAD_X + r.col * COL_W;
const y = (r: MapRoom) => PAD_TOP + r.row * ROW_H;
const cx = (g: string) => x(byGallery.get(g)!) + ROOM_W / 2;
const cy = (g: string) => y(byGallery.get(g)!) + ROOM_H / 2;
const pathD = (walkRooms: string[]) => walkRooms.map((g, i) => `${i ? "L" : "M"}${cx(g)} ${cy(g)}`).join(" ");

export type RoomState = "found" | "current" | "upcoming" | "closed";

export function roomState(questId: number, completed: number[], current?: number): RoomState {
  if (completed.includes(questId)) return "found";
  if (isGalleryClosed(questById(questId)!.gallery)) return "closed";
  return questId === current ? "current" : "upcoming";
}

/** Walks between consecutive open game stops, following doorways and skipping closed rooms. */
export function huntLegs(): string[][] {
  const stops = pack.questIds.map((id) => questById(id)!.gallery).filter((g) => !isGalleryClosed(g));
  const legs: string[][] = [];
  for (let i = 1; i < stops.length; i++) {
    const leg = walk(stops[i - 1], stops[i], isGalleryClosed);
    if (leg) legs.push(leg);
  }
  return legs;
}

function Doorway({ a, b }: { a: string; b: string }) {
  const ra = byGallery.get(a)!, rb = byGallery.get(b)!;
  if (ra.row === rb.row) {
    const left = ra.col < rb.col ? ra : rb;
    return <rect className="door" x={x(left) + ROOM_W - 2} y={y(left) + ROOM_H / 2 - 9} width={GAP + 4} height={18} rx={3} />;
  }
  if (ra.col === rb.col) {
    const top = ra.row < rb.row ? ra : rb;
    return <rect className="door" x={x(top) + ROOM_W / 2 - 9} y={y(top) + ROOM_H - 2} width={18} height={GAP + 4} rx={3} />;
  }
  return null;
}

const MARK: Record<RoomState, string> = { found: "✓", current: "●", upcoming: "○", closed: "closed" };

interface Props {
  completed: number[];
  current?: number;
  /** Emphasize the walk from this quest's gallery to `current`. */
  legFrom?: number;
  /** Quest to center on. */
  focus?: number;
  onSelect: (questId: number) => void;
}

export function TreasureMap({ completed, current, legFrom, focus, onSelect }: Props) {
  const zoom = useRef<ReactZoomPanPinchContentRef>(null);
  const legs = huntLegs();
  const currentGallery = current ? questById(current)?.gallery : undefined;
  const fromGallery = legFrom ? questById(legFrom)?.gallery : undefined;
  const emphasis = fromGallery && currentGallery ? walk(fromGallery, currentGallery, isGalleryClosed) : null;
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
          aria-label="Treasure map of the European Paintings galleries. A list of the same information follows the map."
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
          <text className="edge-label" x={MAP_W / 2} y={MAP_H - 18}>FIFTH AVENUE SIDE</text>

          <g className="compass" transform={`translate(${PAD_X + ROOM_W / 2} ${PAD_TOP + ROW_H})`} aria-hidden>
            <circle r="28" />
            <path d="M0 -24 L6 0 L0 24 L-6 0 Z" />
            <path className="north" d="M0 -24 L6 0 L-6 0 Z" />
            <text y="-32">N</text>
          </g>

          <g filter="url(#ink)">
            {doors.map(([a, b]) => (
              <Doorway key={`${a}-${b}`} a={a} b={b} />
            ))}
            {rooms.map((r) => {
              const quest = questByGallery(r.gallery);
              const label = r.label ?? r.gallery;
              if (!quest) {
                const closed = isGalleryClosed(r.gallery);
                return (
                  <g key={r.gallery} className="room room--quiet" aria-hidden>
                    <rect className="room-body" x={x(r)} y={y(r)} width={ROOM_W} height={ROOM_H} rx={10} fill={closed ? "url(#hatch)" : undefined} />
                    <text x={x(r) + ROOM_W / 2} y={y(r) + ROOM_H / 2 + 5}>{label}</text>
                  </g>
                );
              }
              const state = roomState(quest.id, completed, current);
              const n = questNumber(quest.id);
              return (
                <g
                  key={r.gallery}
                  id={`room-${r.gallery}`}
                  data-gallery={r.gallery}
                  className={`room room--${state}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Mystery ${n}, Gallery ${r.gallery}: ${{ found: "solved", current: "next mystery", upcoming: "still to discover", closed: "gallery closed today" }[state]}`}
                  onClick={() => onSelect(quest.id)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(quest.id))}
                >
                  {state === "current" && <rect className="pulse" x={x(r)} y={y(r)} width={ROOM_W} height={ROOM_H} rx={10} />}
                  <rect className="room-body" x={x(r)} y={y(r)} width={ROOM_W} height={ROOM_H} rx={10} fill={state === "closed" ? "url(#hatch)" : undefined} />
                  <text className="num" x={x(r) + ROOM_W / 2} y={y(r) + ROOM_H / 2 + 2}>{label}</text>
                  <text className="mark" x={x(r) + ROOM_W / 2} y={y(r) + ROOM_H / 2 + 22}>{MARK[state]}</text>
                  <g className="badge" transform={`translate(${x(r) + 4} ${y(r) + 4})`}>
                    <circle r="11" />
                    <text y="4">{n}</text>
                  </g>
                </g>
              );
            })}
          </g>

          <g className="route" aria-hidden>
            {legs.map((leg) => (
              <path key={leg.join("-")} d={pathD(leg)} />
            ))}
          </g>
          {emphasis && <path className="route-leg" d={pathD(emphasis)} aria-hidden />}
        </svg>
      </TransformComponent>
    </TransformWrapper>
  );
}
