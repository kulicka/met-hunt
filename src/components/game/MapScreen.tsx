"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { OFFICIAL_MAP_URL } from "@/lib/links";
import { arrivalConfirmed, routeRequested, track, trackQuest } from "@/lib/analytics/client";
import { closureVersion, useClosures } from "@/lib/closures";
import { useAdventure } from "@/lib/content";
import { playQuest, useProgress } from "@/lib/progress";
import type { QuestReveal } from "@/adventures/types";
import { navigate } from "./router";
import { roomState, TreasureMap, type RoomState } from "./TreasureMap";
import { Button, Card, Screen, Title } from "./ui";

interface Props {
  focus?: number;
  /** Set when arriving from a solved quest: emphasizes the walk from there. */
  from?: number;
}

export function MapScreen({ focus, from }: Props) {
  const adv = useAdventure();
  const { map, hasRoutes, questIds, questById, questNumber, openUnsolved, findRoute, isHeld, loadReveals, chapterOf } = adv;
  const progress = useProgress();
  const closures = useClosures();
  const open = openUnsolved(progress.completedQuests, closures);
  const current = open.includes(progress.currentQuest) ? progress.currentQuest : open[0];
  const fromQuest = from != null ? questById(from) : undefined;
  const route =
    hasRoutes && fromQuest && current != null ? findRoute(fromQuest.gallery, questById(current)!.gallery, closures) : undefined;
  // Closures are museum-wide; show the ones on this adventure's map, or (without a map)
  // in the same numbered section as its galleries (the Met numbers galleries by area: 1xx, 8xx …).
  const sections = new Set(questIds.map((id) => questById(id)!.gallery[0]));
  const nearby = (g: string) => (map ? map.nodes.some((n) => n.id === g) : sections.has(g[0]));
  const closedGalleries = closures
    .filter((c) => c.galleryId && c.status === "closed" && nearby(c.galleryId))
    .map((c) => c.galleryId!);
  const [selected, setSelected] = useState<number | null>(null);
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);

  // No adventure picked and begun yet (an old link, or after a restart): pick one first.
  const notStarted = progress.status === "not_started";
  useEffect(() => {
    if (notStarted) navigate({ name: "adventures", start: true }, { replace: true });
  }, [notStarted]);

  // Solved markers say what was found, so answers for solved quests are needed here.
  useEffect(() => {
    if (progress.completedQuests.length) loadReveals().then(setReveals, () => {});
  }, [progress.completedQuests.length, loadReveals]);

  // Analytics: how the map was opened and, after SHOW ME THE WAY, whether a verified route existed.
  // Recorded once per visit to this screen, with the route as first shown.
  const first = useRef({ from, current, route, closures });
  useEffect(() => {
    const { from, current, route, closures } = first.current;
    track("map_opened", { source: from != null ? "found" : focus != null ? "quest" : "menu" });
    if (from == null || current == null || route === undefined || !map) return;
    const a = questById(from)!.gallery;
    const b = questById(current)!.gallery;
    const unavailable = route ? null : findRoute(a, b, []) ? "closure_blocking" : "no_verified_route";
    routeRequested(
      {
        from_gallery: Number(a),
        to_gallery: Number(b),
        route_graph_version: map.routeGraphVersion,
        closure_version: closureVersion(),
        closures_active: closures.filter((c) => c.status === "closed").length,
      },
      unavailable,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per screen visit
  }, []);

  const goTo = (id: number, arrived = false) => {
    if (arrived) arrivalConfirmed(id, "map");
    else if (current != null && id !== current) trackQuest("quest_skipped", current, { reason: "user_switched" });
    playQuest(id);
    navigate({ name: "quest", id });
  };

  const states = questIds.map((id) => ({ id, state: roomState(adv, id, progress.completedQuests, closures, current) }));
  const stateText: Record<RoomState, string> = {
    found: "★ Found",
    current: "● Next mystery",
    upcoming: "○ Still to discover",
    closed: "🔒 Temporarily closed",
  };

  if (notStarted) return null;

  return (
    <Screen>
      <header className="text-center">
        <Title>{hasRoutes ? "Treasure Map" : "Gallery List"}</Title>
        <p className="font-display text-xl text-ink-soft">{questIds.length} mysteries hidden in The Met</p>
        {current && (
          <p className="mt-2 text-lg">
            Next mystery: <strong>Gallery {questById(current)!.gallery}</strong>
          </p>
        )}
      </header>

      {route === null && current && (
        <Card className="border-gold/40">
          <p className="font-mono text-[13px] font-medium uppercase tracking-[0.14em]">Next mystery: Gallery {questById(current)!.gallery}</p>
          <p className="mt-1 text-lg">
            {fromQuest && isHeld(fromQuest.gallery, questById(current)!.gallery)
              ? `We haven’t walked from Gallery ${fromQuest.gallery} to Gallery ${questById(current)!.gallery} yet, so there are no directions for it. Use The Met’s map or ask a guard for the best way.`
              : "Gallery routes can change. Use The Met’s current map or ask a guard for the best way."}
          </p>
          <a
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-card px-4 font-semibold shadow-[0_1px_2px_rgb(13_13_16/0.05)] hover:border-ink/40"
            href={OFFICIAL_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN THE MET’S OFFICIAL MAP <ExternalLink aria-hidden size={18} />
          </a>
        </Card>
      )}

      {closedGalleries.length > 0 && (
        <p className="rounded-2xl bg-paper-deep px-4 py-2 text-center">
          Temporarily closed: Gallery {closedGalleries.join(", ")}
        </p>
      )}

      {hasRoutes ? (
        <>
          <TreasureMap
            completed={progress.completedQuests}
            closures={closures}
            current={current}
            emphasis={route?.path}
            onSelect={setSelected}
          />
          <p className="-mt-2 text-center text-sm text-ink-soft">Pinch or double-tap to zoom. Drag to look around.</p>

          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm" aria-label="Map key">
            <li><span aria-hidden className="text-[#c99a1e]">★</span> Found</li>
            <li><span aria-hidden className="text-burgundy">●</span> Current mystery</li>
            <li>○ Still to discover</li>
            <li>🔒 Temporarily closed</li>
            <li>? Doorway not yet confirmed</li>
          </ul>
        </>
      ) : (
        <>
          {/* No doorway in this adventure is verified yet, so we never draw or describe a walk. */}
          <Card className="border-gold/40">
            <p className="text-lg">
              The walks between these galleries haven’t been checked yet, so there’s no drawn map. Look for the gallery
              number on the wall, use The Met’s map, or ask a guard.
            </p>
          </Card>
          <ol className="flex flex-col gap-2">
            {states.map(({ id, state }, i) => {
              const chapter = chapterOf(id);
              const newChapter = chapter && (i === 0 || chapterOf(states[i - 1].id)?.id !== chapter.id);
              return (
                <li key={id} className="flex flex-col gap-2">
                  {newChapter && (
                    <p className="mt-2 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">{chapter.title}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelected(id)}
                    className={`flex min-h-14 items-center justify-between rounded-2xl border bg-card px-4 text-left ${state === "current" ? "border-ink ring-2 ring-ink" : "border-line"}`}
                  >
                    <span className="font-semibold">
                      Mystery {questNumber(id)} · Gallery {questById(id)!.gallery}
                    </span>
                    <span className="text-sm text-ink-soft">{stateText[state]}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {selected != null && (
        <MarkerSheet
          id={selected}
          state={roomState(adv, selected, progress.completedQuests, closures, current)}
          reveal={reveals?.find((r) => r.id === selected)}
          onGo={() => goTo(selected)}
          onClose={() => setSelected(null)}
        />
      )}

      {current && from != null ? (
        <Button onClick={() => goTo(current, true)}>I’M THERE — SHOW MY CLUE</Button>
      ) : current ? (
        <Button onClick={() => goTo(current)}>SHOW MY CLUE</Button>
      ) : (
        <Button onClick={() => navigate({ name: "done" })}>SEE MY TREASURES</Button>
      )}

      {hasRoutes && <details className="rounded-3xl border border-line bg-card px-5 py-4">
        <summary className="cursor-pointer font-semibold">Map as a list</summary>
        <ol className="mt-2 flex flex-col gap-1">
          {states.map(({ id, state }) => (
            <li key={id}>
              Mystery {questNumber(id)} — Gallery {questById(id)!.gallery}: {stateText[state]}
            </li>
          ))}
        </ol>
      </details>}

      <div className="flex flex-col items-center gap-1">
        <Button variant="quiet" onClick={() => navigate({ name: "collection" })}>
          My notebook ({progress.completedQuests.length})
        </Button>
        <a
          className="inline-flex min-h-11 items-center gap-1 text-base text-ink-soft underline underline-offset-4"
          href={OFFICIAL_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open The Met’s official map <ExternalLink aria-hidden size={16} />
        </a>
      </div>
    </Screen>
  );
}

function MarkerSheet({
  id,
  state,
  reveal,
  onGo,
  onClose,
}: {
  id: number;
  state: RoomState;
  reveal?: QuestReveal;
  onGo: () => void;
  onClose: () => void;
}) {
  const { questById, questNumber } = useAdventure();
  const quest = questById(id)!;
  return (
    <Card className="relative" >
      <button type="button" onClick={onClose} className="absolute right-2 top-2 min-h-11 min-w-11 text-xl text-ink-soft" aria-label="Close">
        ×
      </button>
      <p className="font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">Mystery #{questNumber(id)}</p>
      <p className="font-display text-3xl font-semibold">Gallery {quest.gallery}</p>
      {state === "found" ? (
        <>
          <p className="mt-1 text-lg">Solved ★{reveal ? ` You found: ${reveal.hiddenObject}` : ""}</p>
          <Button variant="quiet" className="-ml-2" onClick={() => navigate({ name: "collection" })}>
            See it in my treasures
          </Button>
        </>
      ) : state === "closed" ? (
        <p className="mt-1 text-lg">This gallery is temporarily closed. You can skip this mystery without losing anything.</p>
      ) : (
        <Button className="mt-3" onClick={onGo}>
          GO TO THIS MYSTERY
        </Button>
      )}
    </Card>
  );
}
