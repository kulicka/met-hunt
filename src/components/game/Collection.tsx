"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { loadReveals, openUnsolved, pack, questById, questNumber } from "@/lib/content";
import { resetProgress, useProgress } from "@/lib/progress";
import { ArtworkFigure } from "./FoundScreens";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

export function CollectionScreen() {
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const artworks = useArtworkStatus();
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  useEffect(() => {
    if (progress.completedQuests.length) loadReveals().then(setReveals, () => {});
  }, [progress.completedQuests.length]);

  const done = openUnsolved(progress.completedQuests, closures).length === 0;

  return (
    <Screen>
      <Title>My Treasures</Title>
      <p className="text-lg text-ink-soft">
        {progress.completedQuests.length} of {pack.questIds.length} found
      </p>
      <ul className="flex flex-col gap-4">
        {pack.questIds.map((id, i) => {
          const quest = questById(id)!;
          const solved = progress.completedQuests.includes(id);
          const found = reveals?.find((r) => r.id === id);
          const reveal = found && withMetData(found, statusFor(artworks, id));
          if (!solved) {
            return (
              <li key={id}>
                <Card className="flex items-center gap-4 border-dashed bg-paper-deep/50 opacity-80">
                  <Lock aria-hidden className="shrink-0 text-ink-soft" />
                  <div>
                    <p className="font-semibold">
                      Mystery #{questNumber(id)} · Gallery {quest.gallery}
                    </p>
                    <p className="text-ink-soft">{isGalleryClosed(quest.gallery, closures) ? "Gallery temporarily closed" : "Still hidden"}</p>
                  </div>
                </Card>
              </li>
            );
          }
          return (
            <motion.li
              key={id}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <p className="text-sm font-semibold uppercase tracking-widest text-gold">
                  Mystery #{questNumber(id)} · Gallery {quest.gallery} · ✓
                </p>
                {reveal ? (
                  <>
                    <p className="font-serif text-2xl font-bold">{reveal.hiddenObject}</p>
                    <ArtworkFigure reveal={reveal} />
                    {reveal.fact && <p className="mt-2">{reveal.fact}</p>}
                  </>
                ) : (
                  <p className="font-serif text-2xl font-bold">Treasure found</p>
                )}
              </Card>
            </motion.li>
          );
        })}
      </ul>
      <Button onClick={() => (done ? navigate({ name: "done" }) : navigate({ name: "quest", id: progress.currentQuest }))}>
        {done ? "BACK" : "BACK TO MY MYSTERY"}
      </Button>
    </Screen>
  );
}

export function FinalScreen() {
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const total = pack.questIds.length;
  const found = progress.completedQuests.length;
  const closed = pack.questIds.filter((id) => !progress.completedQuests.includes(id) && isGalleryClosed(questById(id)!.gallery, closures)).length;
  const remaining = openUnsolved(progress.completedQuests, closures);

  if (remaining.length) {
    // Not finished yet; send them to what is left.
    return (
      <Screen className="text-center">
        <Title>Almost there!</Title>
        <p className="text-lg">
          {remaining.length} {remaining.length === 1 ? "mystery is" : "mysteries are"} still waiting.
        </p>
        <Button onClick={() => navigate({ name: "quest", id: remaining[0] })}>KEEP HUNTING</Button>
      </Screen>
    );
  }

  const playAgain = () => {
    if (window.confirm("Start over? This clears all found treasures on this phone.")) {
      resetProgress();
      navigate({ name: "start" }, { replace: true });
    }
  };

  return (
    <Screen className="min-h-[80dvh] justify-center text-center">
      <motion.div aria-hidden className="text-7xl" initial={reduce ? false : { scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}>
        🏆
      </motion.div>
      <Title className="text-5xl">Mission complete!</Title>
      <p className="text-xl">
        {found === total
          ? `You found all ${total} Hidden Treasures at The Met.`
          : `You found ${found} Hidden Treasures at The Met.`}
      </p>
      <p className="font-serif text-3xl font-bold">
        {found} / {total} mysteries solved
      </p>
      {closed > 0 && (
        <p className="text-ink-soft">
          {closed === 1 ? "One gallery was" : `${closed} galleries were`} temporarily closed. Those treasures will wait for your next visit.
        </p>
      )}
      <Card className="mx-auto border-gold">
        <Eyebrow>Award</Eyebrow>
        <p className="font-serif text-3xl font-bold text-burgundy">Official Met Detective</p>
      </Card>
      <Button onClick={() => navigate({ name: "collection" })}>SEE MY TREASURES</Button>
      <Button variant="secondary" onClick={playAgain}>
        PLAY AGAIN
      </Button>
    </Screen>
  );
}
