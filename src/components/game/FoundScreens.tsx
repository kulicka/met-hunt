"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/adventures/types";
import { useAdventure } from "@/lib/content";
import { endAdventure, useProgress } from "@/lib/progress";
import { arrivalConfirmed } from "@/lib/analytics/client";
import { OFFICIAL_MAP_URL } from "@/lib/links";
import { RatePuzzle } from "./RatePuzzle";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen } from "./ui";

export function useReveal(id: number) {
  const { adventure, loadReveals } = useAdventure();
  const [reveal, setReveal] = useState<QuestReveal | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadReveals().then(
      (all) => setReveal(all.find((r) => r.id === id) ?? null),
      () => setFailed(true),
    );
  }, [id, loadReveals]);
  const artworks = useArtworkStatus();
  return { reveal: reveal && withMetData(reveal, statusFor(artworks, adventure.id, id)), failed };
}

/** A few gold sparkles, once. Nothing at all with reduced motion. */
function Sparkles() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const dots = [
    [-120, -40], [-80, -90], [0, -110], [80, -90], [120, -40], [-60, 20], [60, 20],
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute left-1/2 top-10">
      {dots.map(([dx, dy], i) => (
        <motion.span
          key={i}
          className="absolute text-xl text-gold"
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
          animate={{ x: dx, y: dy, opacity: [0, 1, 0], scale: 1 }}
          transition={{ duration: 1.1, delay: i * 0.04, ease: "easeOut" }}
        >
          ✦
        </motion.span>
      ))}
    </div>
  );
}

export function FoundScreen({ id }: { id: number }) {
  const { questById, questNumber, isFound, isBonus, hasRoutes } = useAdventure();
  const progress = useProgress();
  const closures = useClosures();
  const { reveal, failed } = useReveal(id);
  const quest = questById(id);
  const found = isFound(progress, id);
  const bonus = isBonus(id);

  useEffect(() => {
    // Only reachable for solved quests.
    if (quest && !found) navigate({ name: "quest", id }, { replace: true });
  }, [id, quest, found]);

  if (!quest) return null;

  const showTheWay = () => {
    const next = progress.currentQuest;
    const open = !progress.completedQuests.includes(next) && !isGalleryClosed(questById(next)!.gallery, closures);
    // When nothing is left (or only closed galleries), the next screen wraps up the hunt.
    // Without a verified map, the next screen names the gallery (and any new chapter) instead.
    navigate(open && hasRoutes ? { name: "map", focus: next, from: id } : { name: "next", from: id }, { replace: true });
  };

  return (
    <Screen className="relative text-center">
      <Sparkles />
      <Eyebrow>
        Gallery {quest.gallery} · {bonus ? "Bonus mystery ★" : `Mystery #${questNumber(id)}`}
      </Eyebrow>
      <h1 className="font-display text-5xl font-semibold">✨ Treasure found! 🎉</h1>
      <p className="font-display text-2xl italic">“That’s the one!”</p>

      {reveal ? (
        <Card className="text-left">
          <p className="font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-gold">You found</p>
          <p className="font-display text-3xl font-semibold">{reveal.hiddenObject}</p>
          <ArtworkFigure reveal={reveal} />
          {reveal.fact && <p className="mt-3 text-lg">{reveal.fact}</p>}
          {reveal.metObjectUrl && (
            <a
              href={reveal.metObjectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1 text-ink-soft underline underline-offset-4"
            >
              See it on The Met’s website <ExternalLink aria-hidden size={16} />
            </a>
          )}
        </Card>
      ) : failed ? (
        <p className="text-ink-soft">Your treasure is saved. Its story will appear when you have signal again.</p>
      ) : (
        <p className="text-ink-soft">Unwrapping your treasure…</p>
      )}

      <RatePuzzle questId={id} after="found" />

      <Button onClick={() => navigate({ name: "entry", id, fresh: true }, { replace: true })}>ADD TO MY NOTEBOOK</Button>
      {bonus ? (
        <Button variant="secondary" onClick={() => navigate({ name: "quest", id: progress.currentQuest }, { replace: true })}>
          BACK TO MY MYSTERY
        </Button>
      ) : (
        <Button variant="secondary" onClick={showTheWay}>
          <MapIcon aria-hidden size={20} /> {hasRoutes ? "SHOW ME THE WAY" : "WHERE NEXT?"}
        </Button>
      )}
    </Screen>
  );
}

export function ArtworkFigure({ reveal }: { reveal: QuestReveal }) {
  return (
    <figure className="mt-3 flex flex-col gap-2">
      {reveal.imageUrl && reveal.openAccess && (
        // eslint-disable-next-line @next/next/no-img-element -- Met Open Access image, shown only after the find
        <img src={reveal.imageUrl} alt={reveal.artist ? `${reveal.artwork} by ${reveal.artist}` : reveal.artwork} className="w-full rounded-2xl border border-line" />
      )}
      <figcaption className="border-l-2 border-ink pl-3">
        {reveal.artist && <span className="block font-semibold">{reveal.artist}</span>}
        <span className="block font-display text-xl italic">
          {reveal.artwork}
          {reveal.year && !reveal.artwork.includes(reveal.year) ? `, ${reveal.year}` : ""}
        </span>
        {reveal.imageAttribution && <span className="block text-sm text-ink-soft">{reveal.imageAttribution}</span>}
      </figcaption>
    </figure>
  );
}

export function NextScreen({ from }: { from: number }) {
  const { questIds, questById, chapterOf, hasRoutes } = useAdventure();
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const next = progress.completedQuests.includes(progress.currentQuest) ? null : progress.currentQuest;
  const closedLeft = questIds.filter((q) => !progress.completedQuests.includes(q) && isGalleryClosed(questById(q)!.gallery, closures));

  if (!next || isGalleryClosed(questById(next)!.gallery, closures)) {
    return (
      <Screen className="text-center">
        <motion.div initial={reduce ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <ProgressDots completed={progress.completedQuests} />
        </motion.div>
        <h1 className="font-display text-4xl font-semibold">Treasure added!</h1>
        {closedLeft.length > 0 && (
          <p className="text-lg">
            {closedLeft.length === 1 ? "One gallery is" : `${closedLeft.length} galleries are`} temporarily closed, so the hunt ends here.
          </p>
        )}
        <Button
          onClick={() => {
            endAdventure(); // no-op once all ten are found (already completed)
            navigate({ name: "done" }, { replace: true });
          }}
        >
          FINISH THE HUNT
        </Button>
      </Screen>
    );
  }

  const chapter = chapterOf(next);
  const newChapter = chapter && chapter.id !== chapterOf(from)?.id ? chapter : undefined;

  return (
    <Screen className="text-center">
      <motion.div
        className="flex justify-center"
        initial={reduce ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <ProgressDots completed={progress.completedQuests} current={next} />
      </motion.div>
      <Eyebrow>
        {progress.completedQuests.length} of {questIds.length} treasures collected
      </Eyebrow>
      {newChapter && (
        <Card>
          <p className="font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-gold">New chapter</p>
          <p className="font-display text-3xl font-semibold">{newChapter.title}</p>
        </Card>
      )}
      {!progress.completedQuests.includes(from) && questById(from) && (
        // Arrived here by skipping a mystery: it waits, and comes round again after the others.
        <>
          <p className="text-lg">Gallery {questById(from)!.gallery} will wait for you. Come back to it any time.</p>
          <RatePuzzle questId={from} after="skipped" />
        </>
      )}
      <h1 className="font-display text-4xl font-semibold">Your next mystery</h1>
      <p className="whitespace-nowrap font-display text-5xl font-semibold min-[360px]:text-6xl">Gallery {questById(next)!.gallery}</p>
      {hasRoutes ? (
        <Button onClick={() => navigate({ name: "map", focus: next, from })}>
          <MapIcon aria-hidden size={22} /> SHOW ME THE WAY
        </Button>
      ) : (
        <>
          {/* No doorway here is verified yet, so no directions: just the gallery number. */}
          <p className="text-lg">Look for the gallery number on the wall. A guard or The Met’s map can point the way.</p>
          <a
            className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border border-line bg-card px-6 font-semibold shadow-[0_1px_2px_rgb(13_13_16/0.05)] hover:border-ink/40"
            href={OFFICIAL_MAP_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapIcon aria-hidden size={22} /> OPEN THE MET’S MAP <ExternalLink aria-hidden size={18} />
          </a>
        </>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          arrivalConfirmed(next, "next_screen");
          navigate({ name: "quest", id: next });
        }}
      >
        I’M THERE — SHOW MY CLUE
      </Button>
    </Screen>
  );
}
