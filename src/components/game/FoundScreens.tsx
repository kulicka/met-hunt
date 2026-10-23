"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { loadReveals, pack, questById, questNumber } from "@/lib/content";
import { endAdventure, useProgress } from "@/lib/progress";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen } from "./ui";

export function useReveal(id: number) {
  const [reveal, setReveal] = useState<QuestReveal | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    loadReveals().then(
      (all) => setReveal(all.find((r) => r.id === id) ?? null),
      () => setFailed(true),
    );
  }, [id]);
  const artworks = useArtworkStatus();
  return { reveal: reveal && withMetData(reveal, statusFor(artworks, id)), failed };
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
  const progress = useProgress();
  const { reveal, failed } = useReveal(id);
  const quest = questById(id);

  useEffect(() => {
    // Only reachable for solved quests.
    if (quest && !progress.completedQuests.includes(id)) navigate({ name: "quest", id }, { replace: true });
  }, [id, quest, progress.completedQuests]);

  if (!quest) return null;

  return (
    <Screen className="relative text-center">
      <Sparkles />
      <Eyebrow>Gallery {quest.gallery} · Mystery #{questNumber(id)}</Eyebrow>
      <h1 className="font-serif text-5xl font-bold">✨ Treasure found! 🎉</h1>
      <p className="font-serif text-2xl italic">“That’s the one!”</p>

      {reveal ? (
        <Card className="text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">You found</p>
          <p className="font-serif text-3xl font-bold">{reveal.hiddenObject}</p>
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

      <Button onClick={() => navigate({ name: "next", from: id }, { replace: true })}>ADD TO MY COLLECTION</Button>
    </Screen>
  );
}

export function ArtworkFigure({ reveal }: { reveal: QuestReveal }) {
  return (
    <figure className="mt-3 flex flex-col gap-2">
      {reveal.imageUrl && reveal.openAccess && (
        // eslint-disable-next-line @next/next/no-img-element -- Met Open Access image, shown only after the find
        <img src={reveal.imageUrl} alt={`${reveal.artwork} by ${reveal.artist}`} className="w-full rounded-lg border border-line" />
      )}
      <figcaption className="border-l-4 border-gold pl-3">
        <span className="block font-semibold">{reveal.artist}</span>
        <span className="block font-serif text-xl italic">
          {reveal.artwork}
          {reveal.year && !reveal.artwork.includes(reveal.year) ? `, ${reveal.year}` : ""}
        </span>
        {reveal.imageAttribution && <span className="block text-sm text-ink-soft">{reveal.imageAttribution}</span>}
      </figcaption>
    </figure>
  );
}

export function NextScreen({ from }: { from: number }) {
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const next = progress.completedQuests.includes(progress.currentQuest) ? null : progress.currentQuest;
  const closedLeft = pack.questIds.filter((q) => !progress.completedQuests.includes(q) && isGalleryClosed(questById(q)!.gallery, closures));

  if (!next || isGalleryClosed(questById(next)!.gallery, closures)) {
    return (
      <Screen className="text-center">
        <motion.div initial={reduce ? false : { scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <ProgressDots completed={progress.completedQuests} />
        </motion.div>
        <h1 className="font-serif text-4xl font-bold">Treasure added!</h1>
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
        {progress.completedQuests.length} of {pack.questIds.length} treasures collected
      </Eyebrow>
      <h1 className="font-serif text-4xl font-bold">Your next mystery</h1>
      <p className="font-serif text-6xl font-bold">Gallery {questById(next)!.gallery}</p>
      <Button onClick={() => navigate({ name: "map", focus: next, from })}>
        <MapIcon aria-hidden size={22} /> SHOW ME THE WAY
      </Button>
      <Button variant="secondary" onClick={() => navigate({ name: "quest", id: next })}>
        I’M THERE — SHOW MY CLUE
      </Button>
    </Screen>
  );
}
