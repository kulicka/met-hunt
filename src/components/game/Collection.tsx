"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { loadReveals, openUnsolved, pack, questById, questNumber } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { startAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { ArtworkFigure } from "./FoundScreens";
import { RestartButton } from "./Lifecycle";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen, Title } from "./ui";

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
      {progress.status === "in_progress" && !done ? (
        <Button onClick={() => navigate({ name: "quest", id: progress.currentQuest })}>BACK TO MY MYSTERY</Button>
      ) : (
        <Button onClick={() => navigate({ name: progress.status === "in_progress" ? "done" : "start" })}>BACK</Button>
      )}
    </Screen>
  );
}

export function FinalScreen() {
  const progress = useProgress();
  const closures = useClosures();
  const avatar = useAvatar();
  const reduce = useReducedMotion();
  const total = pack.questIds.length;
  const found = progress.completedQuests.length;
  const closed = pack.questIds.filter((id) => !progress.completedQuests.includes(id) && isGalleryClosed(questById(id)!.gallery, closures)).length;
  const remaining = openUnsolved(progress.completedQuests, closures);
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  useEffect(() => {
    if (found) loadReveals().then(setReveals, () => {});
  }, [found]);

  if (progress.status === "in_progress" && remaining.length) {
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

  // The top award is only for finding every treasure.
  if (progress.status === "completed") {
    return (
      <Screen className="min-h-[80dvh] justify-center text-center">
        <motion.div aria-hidden className="text-7xl" initial={reduce ? false : { scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}>
          🏆
        </motion.div>
        <Title className="text-5xl">Mission complete!</Title>
        <p className="text-xl">You found all {total} Hidden Treasures at The Met.</p>
        <p className="font-serif text-3xl font-bold">
          {found} / {total} mysteries solved
        </p>
        <Certificate avatarAsset={avatar.imageAsset} name={avatar.displayName} title="Official Met Detective" />
        <Button onClick={() => navigate({ name: "collection" })}>SEE MY TREASURES</Button>
        <RestartButton label="START A NEW ADVENTURE" />
      </Screen>
    );
  }

  // Ended early, or every open gallery is done while some are closed.
  return (
    <Screen className="min-h-[80dvh] justify-center text-center">
      <Title className="text-4xl">ADVENTURE COMPLETE FOR TODAY!</Title>
      <p className="text-xl">
        Nice work, {avatar.displayName}! You discovered {found} hidden {found === 1 ? "treasure" : "treasures"}.
      </p>
      <p className="font-serif text-xl italic text-ink-soft">Every great detective knows when it’s time to head home.</p>
      <div className="flex justify-center">
        <ProgressDots completed={progress.completedQuests} />
      </div>
      {reveals && found > 0 && (
        <ul aria-label="Treasures you found" className="flex flex-wrap justify-center gap-2">
          {pack.questIds
            .filter((id) => progress.completedQuests.includes(id))
            .map((id) => (
              <li key={id} className="rounded-full border border-gold bg-card px-3 py-1 text-sm font-semibold">
                ✓ {reveals.find((r) => r.id === id)?.hiddenObject}
              </li>
            ))}
        </ul>
      )}
      {closed > 0 && (
        <p className="text-ink-soft">
          {closed === 1 ? "One gallery was" : `${closed} galleries were`} temporarily closed. Those treasures will wait for your next visit.
        </p>
      )}
      <Certificate
        avatarAsset={avatar.imageAsset}
        name={avatar.displayName}
        title="Met Treasure Hunter"
        detail={`${found} of ${total} hidden treasures discovered`}
      />
      <Button
        onClick={() => {
          startAdventure();
          navigate({ name: "quest", id: remaining[0] ?? progress.currentQuest });
        }}
      >
        CONTINUE THIS ADVENTURE
      </Button>
      {found > 0 && (
        <Button variant="secondary" onClick={() => navigate({ name: "collection" })}>
          SEE MY TREASURES
        </Button>
      )}
      <RestartButton label="RESTART ADVENTURE" variant="quiet" />
    </Screen>
  );
}

function Certificate({ avatarAsset, name, title, detail }: { avatarAsset: string; name: string; title: string; detail?: string }) {
  return (
    <Card className="mx-auto flex w-full flex-col items-center gap-1 border-2 border-gold">
      <AvatarArt asset={avatarAsset} size={72} />
      <Eyebrow>Awarded to {name}</Eyebrow>
      <p className="font-serif text-3xl font-bold text-burgundy">{title}</p>
      {detail && <p className="text-ink-soft">{detail}</p>}
    </Card>
  );
}
