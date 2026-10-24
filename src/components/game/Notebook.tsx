"use client";

import { useEffect, useState, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Lock } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { Adventure, QuestReveal, StampProps } from "@/adventures/types";
import { useAdventure } from "@/lib/content";
import { useProgress, type VerificationMethod } from "@/lib/progress";
import { ArtworkFigure } from "./FoundScreens";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

// The Detective Notebook is derived from completedQuests plus the reveal content:
// there is no second record of what was found. Locked entries show only the
// mystery number and gallery (both already on the map), never the art or answer.

// Each adventure's stamps are their own chunk, loaded once per adventure.
const stampSets = new Map<string, ComponentType<StampProps>>();
export const warmStamps = (a: Adventure) =>
  a.loadStamps().then((m) => void stampSets.set(a.id, m.default), () => {});

function StampSlot({ questId, size = 88 }: { questId: number; size?: number }) {
  const { adventure } = useAdventure();
  const [Stamp, setStamp] = useState<{ C: ComponentType<StampProps> } | null>(() => {
    const C = stampSets.get(adventure.id);
    return C ? { C } : null;
  });
  useEffect(() => {
    let live = true;
    adventure.loadStamps().then(
      (m) => {
        stampSets.set(adventure.id, m.default);
        if (live) setStamp({ C: m.default });
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [adventure]);
  if (!Stamp) return <span className="block rounded-full border-2 border-dashed border-burgundy/40" style={{ width: size, height: size }} />;
  return <Stamp.C questId={questId} size={size} />;
}

const CONFIRMED: Record<VerificationMethod, string> = {
  "ai-photo": "Confirmed with a photo",
  "grown-up": "Confirmed by a grown-up",
  manual: "Confirmed by a grown-up",
};

function useReveals(enabled: boolean) {
  const { loadReveals } = useAdventure();
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (enabled) loadReveals().then(setReveals, () => setFailed(true));
  }, [enabled, loadReveals]);
  return { reveals, failed };
}

function backTarget(status: string, done: boolean, currentQuest: number) {
  if (status === "in_progress" && !done) return { label: "BACK TO MY MYSTERY", go: () => navigate({ name: "quest", id: currentQuest }) };
  return { label: "BACK", go: () => navigate({ name: status === "in_progress" ? "done" : "start" }) };
}

export function NotebookScreen() {
  const { adventure, questIds, bonus, questById, questNumber, openUnsolved, chapterOf } = useAdventure();
  const progress = useProgress();
  const closures = useClosures();
  const reduce = useReducedMotion();
  const count = progress.completedQuests.length;
  const bonusCount = progress.bonusFound?.length ?? 0;
  const { reveals } = useReveals(count + bonusCount > 0);
  const done = openUnsolved(progress.completedQuests, closures).length === 0;
  const back = backTarget(progress.status, done, progress.currentQuest);

  return (
    <Screen>
      <Eyebrow>Detective Notebook</Eyebrow>
      <Title>{count === 1 ? "1 treasure discovered" : `${count} treasures discovered`}</Title>
      <p className="-mt-3 text-ink-soft">
        {adventure.emoji} {adventure.title}
        {bonusCount > 0 ? ` · ★ ${bonusCount} bonus ${bonusCount === 1 ? "star" : "stars"}` : ""}
      </p>
      <ul className="grid grid-cols-2 gap-3">
        {[...questIds, ...bonus.map((b) => b.id)].flatMap((id, i, all) => {
          const quest = questById(id)!;
          const n = questNumber(id);
          const isExtra = n === 0;
          const label = isExtra ? "Bonus ★" : `Mystery #${n}`;
          const chapter = chapterOf(id);
          const heading =
            chapter && (i === 0 || chapterOf(all[i - 1])?.id !== chapter.id) ? (
              <li key={`chapter-${chapter.id}`} className="col-span-2 mt-2 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                {chapter.title}
              </li>
            ) : isExtra && i > 0 && questNumber(all[i - 1]) !== 0 ? (
              <li key="bonus-heading" className="col-span-2 mt-2 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
                Bonus mysteries · extra stars
              </li>
            ) : null;
          const found = isExtra ? progress.bonusFound?.includes(id) : progress.completedQuests.includes(id);
          if (!found) {
            const closed = isGalleryClosed(quest.gallery, closures);
            return [
              heading,
              <li key={id}>
                <div className="flex h-full min-h-44 flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-ink/20 bg-card/50 p-3 text-center text-ink-soft">
                  <Lock aria-hidden size={22} />
                  <p className="font-display text-xl font-semibold">{label}</p>
                  <p className="text-sm">{closed ? `Gallery ${quest.gallery} is closed today` : isExtra ? "Optional" : "Not discovered yet"}</p>
                </div>
              </li>,
            ];
          }
          const reveal = reveals?.find((r) => r.id === id);
          return [
            heading,
            <motion.li key={id} initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
              <button
                type="button"
                onClick={() => navigate({ name: "entry", id })}
                className="flex h-full min-h-44 w-full flex-col items-center gap-1 rounded-3xl border border-line bg-card p-3 text-center shadow-[0_1px_2px_rgb(13_13_16/0.04),0_12px_30px_-22px_rgb(13_13_16/0.3)] hover:border-ink/40 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
              >
                <StampSlot questId={id} size={76} />
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-gold">
                  {isExtra ? "★ Bonus" : `#${n}`} · Gallery {quest.gallery}
                </span>
                <span className="font-display text-lg font-semibold leading-tight">{reveal?.hiddenObject ?? "Treasure found"}</span>
              </button>
            </motion.li>,
          ];
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
  const { adventure, questById, questNumber, isFound, isBonus } = useAdventure();
  const progress = useProgress();
  const reduce = useReducedMotion();
  const artworks = useArtworkStatus();
  const unlocked = isFound(progress, id);
  const { reveals, failed } = useReveals(unlocked);
  const quest = questById(id);

  useEffect(() => {
    if (!unlocked) navigate({ name: "collection" }, { replace: true });
  }, [unlocked]);
  if (!quest || !unlocked) return null;

  const found = reveals?.find((r) => r.id === id);
  const reveal = found && withMetData(found, statusFor(artworks, adventure.id, id));
  const method = progress.verificationMethod[id];
  const bonus = isBonus(id);

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
        {bonus ? "Bonus mystery" : `Mystery #${questNumber(id)}`} · Gallery {quest.gallery}
      </Eyebrow>
      {fresh && <p className="font-semibold text-forest">{bonus ? "You earned a bonus star! ★" : "Added to your Detective Notebook!"}</p>}
      {reveal ? (
        <Card className="text-left">
          <p className="font-display text-3xl font-semibold">{reveal.hiddenObject}</p>
          <ArtworkFigure reveal={reveal} />
          {reveal.fact && <p className="mt-3 text-lg">{reveal.fact}</p>}
          {method && <p className="mt-3 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">✓ {CONFIRMED[method]}</p>}
          {reveal.metObjectUrl && (
            <a href={reveal.metObjectUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-ink-soft underline underline-offset-4">
              See it on The Met’s website <ExternalLink aria-hidden size={16} />
            </a>
          )}
        </Card>
      ) : (
        <p className="text-ink-soft">{failed ? "This page will fill in when you have signal again." : "Opening your notebook…"}</p>
      )}
      {fresh && bonus ? (
        <Button onClick={() => navigate({ name: "quest", id: progress.currentQuest }, { replace: true })}>BACK TO MY MYSTERY</Button>
      ) : fresh ? (
        <Button onClick={() => navigate({ name: "next", from: id }, { replace: true })}>ON TO THE NEXT MYSTERY</Button>
      ) : (
        <Button onClick={() => navigate({ name: "collection" })}>BACK TO MY NOTEBOOK</Button>
      )}
    </Screen>
  );
}
