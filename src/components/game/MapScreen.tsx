"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import { OFFICIAL_MAP_URL } from "@/lib/links";
import { arrivalConfirmed, routeRequested, track, trackQuest } from "@/lib/analytics/client";
import { closureVersion, useClosures } from "@/lib/closures";
import { ROUTE_GRAPH_VERSION } from "@/data/maps/met-floor2-european-paintings";
import { loadReveals, openUnsolved, pack, questById, questNumber } from "@/lib/content";
import { findRoute } from "@/lib/routing";
import { playQuest, useProgress } from "@/lib/progress";
import type { QuestReveal } from "@/data/types";
import { navigate } from "./router";
import { roomState, TreasureMap, type RoomState } from "./TreasureMap";
import { Button, Card, Screen, Title } from "./ui";

interface Props {
  focus?: number;
  /** Set when arriving from a solved quest: emphasizes the walk from there. */
  from?: number;
}

export function MapScreen({ focus, from }: Props) {
  const progress = useProgress();
  const closures = useClosures();
  const open = openUnsolved(progress.completedQuests, closures);
  const current = open.includes(progress.currentQuest) ? progress.currentQuest : open[0];
  const route =
    from != null && current != null ? findRoute(questById(from)!.gallery, questById(current)!.gallery, closures) : undefined;
  const closedGalleries = closures.filter((c) => c.galleryId && c.status === "closed").map((c) => c.galleryId!);
  const [selected, setSelected] = useState<number | null>(null);
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);

  // Solved markers say what was found, so answers for solved quests are needed here.
  useEffect(() => {
    if (progress.completedQuests.length) loadReveals().then(setReveals, () => {});
  }, [progress.completedQuests.length]);

  // Analytics: how the map was opened and, after SHOW ME THE WAY, whether a verified route existed.
  // Recorded once per visit to this screen, with the route as first shown.
  const first = useRef({ from, current, route, closures });
  useEffect(() => {
    const { from, current, route, closures } = first.current;
    track("map_opened", { source: from != null ? "found" : focus != null ? "quest" : "menu" });
    if (from == null || current == null || route === undefined) return;
    const a = questById(from)!.gallery;
    const b = questById(current)!.gallery;
    const unavailable = route ? null : findRoute(a, b, []) ? "closure_blocking" : "no_verified_route";
    routeRequested(
      {
        from_gallery: Number(a),
        to_gallery: Number(b),
        route_graph_version: ROUTE_GRAPH_VERSION,
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

  const states = pack.questIds.map((id) => ({ id, state: roomState(id, progress.completedQuests, closures, current) }));
  const stateText: Record<RoomState, string> = {
    found: "✓ Found",
    current: "● Next mystery",
    upcoming: "○ Still to discover",
    closed: "Temporarily closed",
  };

  return (
    <Screen>
      <header className="text-center">
        <Title>Treasure Map</Title>
        <p className="font-serif text-xl text-ink-soft">{pack.questIds.length} mysteries hidden in The Met</p>
        {current && (
          <p className="mt-2 text-lg">
            Next mystery: <strong>Gallery {questById(current)!.gallery}</strong>
          </p>
        )}
      </header>

      {route === null && current && (
        <Card className="border-gold">
          <p className="font-semibold uppercase tracking-widest">Next mystery: Gallery {questById(current)!.gallery}</p>
          <p className="mt-1 text-lg">Gallery routes can change. Use The Met’s current map or ask a guard for the best way.</p>
          <a
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-ink bg-card px-4 font-semibold"
            href={OFFICIAL_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN THE MET’S OFFICIAL MAP <ExternalLink aria-hidden size={18} />
          </a>
        </Card>
      )}

      {closedGalleries.length > 0 && (
        <p className="rounded-xl bg-paper-deep px-4 py-2 text-center">
          Temporarily closed: Gallery {closedGalleries.join(", ")}
        </p>
      )}

      <TreasureMap
        completed={progress.completedQuests}
        closures={closures}
        current={current}
        emphasis={route?.path}
        focus={focus ?? current}
        onSelect={setSelected}
      />
      <p className="-mt-2 text-center text-sm text-ink-soft">Pinch or double-tap to zoom. Drag to look around.</p>

      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm" aria-label="Map key">
        <li>✓ Found</li>
        <li>● Current destination</li>
        <li>○ Still to discover</li>
        <li>▨ Temporarily closed</li>
        <li>? Doorway not yet confirmed</li>
      </ul>

      {selected != null && (
        <MarkerSheet
          id={selected}
          state={roomState(selected, progress.completedQuests, closures, current)}
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

      <details className="rounded-xl border border-line bg-card px-4 py-3">
        <summary className="cursor-pointer font-semibold">Map as a list</summary>
        <ol className="mt-2 flex flex-col gap-1">
          {states.map(({ id, state }) => (
            <li key={id}>
              Mystery {questNumber(id)} — Gallery {questById(id)!.gallery}: {stateText[state]}
            </li>
          ))}
        </ol>
      </details>

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
  const quest = questById(id)!;
  return (
    <Card className="relative" >
      <button type="button" onClick={onClose} className="absolute right-2 top-2 min-h-11 min-w-11 text-xl text-ink-soft" aria-label="Close">
        ×
      </button>
      <p className="text-sm font-semibold uppercase tracking-widest text-ink-soft">Mystery #{questNumber(id)}</p>
      <p className="font-serif text-3xl font-bold">Gallery {quest.gallery}</p>
      {state === "found" ? (
        <>
          <p className="mt-1 text-lg">Solved ✓{reveal ? ` You found: ${reveal.hiddenObject}` : ""}</p>
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
