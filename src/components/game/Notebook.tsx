"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Lock } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { loadReveals, openUnsolved, pack, questById, questNumber } from "@/lib/content";
import { useProgress, type VerificationMethod } from "@/lib/progress";
import { ArtworkFigure } from "./FoundScreens";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

// The Detective Notebook is derived from completedQuests plus the reveal content:
// there is no second record of what was found. Locked entries show only the
// mystery number and gallery (both already on the map), never the art or answer.

const Stamp = lazy(() => import("./Stamps"));
export const warmStamps = () => import("./Stamps").catch(() => {});

function StampSlot({ questId, size = 88 }: { questId: number; size?: number }) {
  return (
    <Suspense fallback={<span className="block rounded-full border-2 border-dashed border-burgundy/40" style={{ width: size, height: size }} />}>
      <Stamp questId={questId} size={size} />
    </Suspense>
  );
}

const CONFIRMED: Record<VerificationMethod, string> = {
  "ai-photo": "Confirmed with a photo",
  "grown-up": "Confirmed by a grown-up",
  manual: "Confirmed by a grown-up",
};

function useReveals(enabled: boolean) {
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (enabled) loadReveals().then(setReveals, () => setFailed(true));
  }, [enabled]);
  return { reveals, failed };
}

function backTarget(status: string, done: boolean, currentQuest: number) {
  if (status === "in_progress" && !done) return { label: "BACK TO MY MYSTERY", go: () => navigate({ name: "quest", id: currentQuest }) };
  return { label: "BACK", go: () => navigate({ name: status === "in_progress" ? "done" : "start" }) };
}

export function NotebookScreen() {
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const count = progress.completedQuests.length;
  const { reveals } = useReveals(count > 0);
  const done = openUnsolved(progress.completedQuests, closures).length === 0;
  const back = backTarget(progress.status, done, progress.currentQuest);

  return (
    <Screen>
      <Eyebrow>Detective Notebook</Eyebrow>
      <Title>{count === 1 ? "1 treasure discovered" : `${count} treasures discovered`}</Title>
      <ul className="grid grid-cols-2 gap-3">
        {pack.questIds.map((id) => {
          const quest = questById(id)!;
          const n = questNumber(id);
          if (!progress.completedQuests.includes(id)) {
            const closed = isGalleryClosed(quest.gallery, closures);
            return (
              <li key={id}>
                <div className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper-deep/40 p-3 text-center text-ink-soft">
                  <Lock aria-hidden size={22} />
                  <p className="font-serif text-xl font-bold">Mystery #{n}</p>
                  <p className="text-sm">{closed ? `Gallery ${quest.gallery} is closed today` : "Not discovered yet"}</p>
                </div>
              </li>
            );
          }
          const reveal = reveals?.find((r) => r.id === id);
          return (
            <motion.li key={id} initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
              <button
                type="button"
                onClick={() => navigate({ name: "entry", id })}
                className="flex h-full min-h-44 w-full flex-col items-center gap-1 rounded-2xl border-2 border-gold/60 bg-card p-3 text-center shadow-sm hover:border-gold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
              >
                <StampSlot questId={id} size={76} />
                <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                  #{n} · Gallery {quest.gallery}
                </span>
                <span className="font-serif text-lg font-bold leading-tight">{reveal?.hiddenObject ?? "Treasure found"}</span>
              </button>
            </motion.li>
          );
        })}
      </ul>
      {progress.status !== "not_started" && (
        <Button variant="secondary" onClick={() => navigate({ name: "certificate" })}>
          VIEW MY CERTIFICATE
        </Button>
      )}
      <Button onClick={back.go}>{back.label}</Button>
    </Screen>
  );
}

/** One unlocked notebook page. `fresh` when arriving straight from a find. */
export function EntryScreen({ id, fresh }: { id: number; fresh?: boolean }) {
  const progress = useProgress();
  const reduce = useReducedMotion();
  const artworks = useArtworkStatus();
  const unlocked = progress.completedQuests.includes(id);
  const { reveals, failed } = useReveals(unlocked);
  const quest = questById(id);

  useEffect(() => {
    if (!unlocked) navigate({ name: "collection" }, { replace: true });
  }, [unlocked]);
  if (!quest || !unlocked) return null;

  const found = reveals?.find((r) => r.id === id);
  const reveal = found && withMetData(found, statusFor(artworks, id));
  const method = progress.verificationMethod[id];

  return (
    <Screen className="text-center">
      <motion.div
        className="mx-auto"
        initial={fresh && !reduce ? { scale: 1.8, rotate: -20, opacity: 0 } : false}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
      >
        <StampSlot questId={id} size={132} />
      </motion.div>
      <Eyebrow>
        Mystery #{questNumber(id)} · Gallery {quest.gallery}
      </Eyebrow>
      {fresh && <p className="font-semibold text-forest">Added to your Detective Notebook!</p>}
      {reveal ? (
        <Card className="text-left">
          <p className="font-serif text-3xl font-bold">{reveal.hiddenObject}</p>
          <ArtworkFigure reveal={reveal} />
          {reveal.fact && <p className="mt-3 text-lg">{reveal.fact}</p>}
          {method && <p className="mt-3 text-sm font-semibold uppercase tracking-widest text-ink-soft">✓ {CONFIRMED[method]}</p>}
          {reveal.metObjectUrl && (
            <a href={reveal.metObjectUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-ink-soft underline underline-offset-4">
              See it on The Met’s website <ExternalLink aria-hidden size={16} />
            </a>
          )}
        </Card>
      ) : (
        <p className="text-ink-soft">{failed ? "This page will fill in when you have signal again." : "Opening your notebook…"}</p>
      )}
      {fresh ? (
        <Button onClick={() => navigate({ name: "next", from: id }, { replace: true })}>ON TO THE NEXT MYSTERY</Button>
      ) : (
        <Button onClick={() => navigate({ name: "collection" })}>BACK TO MY NOTEBOOK</Button>
      )}
    </Screen>
  );
}
