"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/adventures/types";
import { useAdventure } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { startAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { RestartButton } from "./Lifecycle";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen, Title } from "./ui";

export function FinalScreen() {
  const { adventure, questIds, questById, openUnsolved, loadReveals } = useAdventure();
  const progress = useProgress();
  const closures = useClosures();
  const avatar = useAvatar();
  const reduce = useReducedMotion();
  const total = questIds.length;
  const stars = progress.bonusFound?.length ?? 0;
  const found = progress.completedQuests.length;
  const closed = questIds.filter((id) => !progress.completedQuests.includes(id) && isGalleryClosed(questById(id)!.gallery, closures)).length;
  const remaining = openUnsolved(progress.completedQuests, closures);
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  useEffect(() => {
    if (found) loadReveals().then(setReveals, () => {});
  }, [found, loadReveals]);

  if (progress.status === "in_progress" && remaining.length) {
    // Not finished yet; send them to what is left.
    return (
      <Screen className="text-center">
        <Title>{remaining.length <= 2 ? "Almost there!" : "Keep going!"}</Title>
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
        <p className="font-display text-3xl font-semibold">
          {found} / {total} mysteries solved
        </p>
        {stars > 0 && <p className="text-lg font-semibold text-gold">★ Plus {stars} bonus {stars === 1 ? "star" : "stars"}!</p>}
        <Certificate avatarAsset={avatar.imageAsset} name={avatar.displayName} title={titleCase(adventure.certificate.fullTitle)} />
        <Button onClick={() => navigate({ name: "certificate" })}>VIEW DETECTIVE CERTIFICATE</Button>
        <Button variant="secondary" onClick={() => navigate({ name: "collection" })}>
          OPEN MY NOTEBOOK
        </Button>
        <Button variant="secondary" onClick={() => navigate({ name: "adventures" })}>
          TRY ANOTHER ADVENTURE
        </Button>
        <RestartButton label="START OVER FROM MYSTERY 1" variant="quiet" />
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
      <p className="font-display text-xl italic text-ink-soft">Every great detective knows when it’s time to head home.</p>
      <div className="flex justify-center">
        <ProgressDots completed={progress.completedQuests} />
      </div>
      {reveals && found > 0 && (
        <ul aria-label="Treasures you found" className="flex flex-wrap justify-center gap-2">
          {questIds
            .filter((id) => progress.completedQuests.includes(id))
            .map((id) => (
              <li key={id} className="rounded-full border border-line bg-card px-3 py-1 text-sm font-semibold">
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
        title={titleCase(adventure.certificate.partialTitle)}
        detail={found ? `${found} of ${total} hidden treasures discovered` : "Began a museum adventure"}
      />
      <Button onClick={() => navigate({ name: "certificate" })}>VIEW MY CERTIFICATE</Button>
      <Button variant="secondary" onClick={() => navigate({ name: "collection" })}>
        OPEN MY NOTEBOOK
      </Button>
      <Button
        variant="secondary"
        onClick={() => {
          startAdventure();
          navigate({ name: "quest", id: remaining[0] ?? progress.currentQuest });
        }}
      >
        CONTINUE THIS ADVENTURE
      </Button>
      <RestartButton label="RESTART ADVENTURE" variant="quiet" />
    </Screen>
  );
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b(\w)(\w*)/g, (_, a: string, b: string) => (["of", "the"].includes(a + b) ? a + b : a.toUpperCase() + b));

function Certificate({ avatarAsset, name, title, detail }: { avatarAsset: string; name: string; title: string; detail?: string }) {
  return (
    <Card className="mx-auto flex w-full flex-col items-center gap-1 border-gold/40">
      <AvatarArt asset={avatarAsset} size={72} />
      <Eyebrow>Awarded to {name}</Eyebrow>
      <p className="font-display text-3xl font-semibold text-burgundy">{title}</p>
      {detail && <p className="text-ink-soft">{detail}</p>}
    </Card>
  );
}
