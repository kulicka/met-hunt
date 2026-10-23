"use client";

import { pack } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { startAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { RestartButton } from "./Lifecycle";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen, Title } from "./ui";

export function StartScreen() {
  const progress = useProgress();
  const avatar = useAvatar();
  const count = progress.completedQuests.length;
  const total = pack.questIds.length;

  const go = () => {
    startAdventure();
    navigate({ name: "quest", id: progress.currentQuest });
  };

  let heading: string;
  let copy: string;
  let primary: { label: string; onClick: () => void } | null = { label: "START MY ADVENTURE", onClick: go };
  switch (progress.status) {
    case "in_progress":
      heading = `Welcome back, ${avatar.displayName}!`;
      copy = `You found ${count} of ${total} treasures.`;
      primary = { label: "CONTINUE ADVENTURE", onClick: go };
      break;
    case "ended_early":
      heading = `Welcome back, ${avatar.displayName}!`;
      copy = `You ended your last hunt with ${count} of ${total} treasures. Pick up where you left off, or begin again.`;
      primary = { label: "CONTINUE THIS ADVENTURE", onClick: go };
      break;
    case "completed":
      heading = `Hello again, ${avatar.displayName}!`;
      copy = `You found all ${total} Hidden Treasures. Ready for another hunt?`;
      primary = null;
      break;
    default:
      heading = `Ready for another adventure, ${avatar.displayName}?`;
      copy = "Somewhere inside each gallery, a tiny detail is hiding in plain sight. Read the clue. Look carefully. Find the treasure.";
      primary = { label: "START THE HUNT", onClick: go };
  }
  const finished = progress.status === "ended_early" || progress.status === "completed";

  return (
    <Screen className="min-h-dvh justify-center text-center">
      <AvatarArt asset={avatar.imageAsset} size={112} className="mx-auto" />
      <Eyebrow>The Met · Hidden Treasures</Eyebrow>
      <Title className="text-4xl">{heading}</Title>
      <p className="text-lg leading-relaxed">{copy}</p>
      {finished && <ProgressDots completed={progress.completedQuests} />}
      <div className="mt-2 flex flex-col gap-3">
        {primary && <Button onClick={primary.onClick}>{primary.label}</Button>}
        {finished && (
          <Button variant="secondary" onClick={() => navigate({ name: "collection" })}>
            OPEN MY NOTEBOOK
          </Button>
        )}
        {finished && <RestartButton label="START A NEW ADVENTURE" />}
        {!finished && (
          <Button variant="secondary" onClick={() => navigate({ name: "how" })}>
            How to Play
          </Button>
        )}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4">
        <Button variant="quiet" onClick={() => navigate({ name: "explorer" })}>
          Change Explorer
        </Button>
        <Button variant="quiet" onClick={() => navigate({ name: "parents" })}>
          For grown-ups
        </Button>
      </div>
    </Screen>
  );
}

const steps = [
  "Go to the gallery shown on your screen.",
  "Read the riddle.",
  "Search the artworks in that gallery.",
  "Find the hidden detail.",
  "Photograph what you found.",
  "Let the app check your discovery.",
  "Collect your treasure and move to the next gallery.",
];

const rules = [
  ["🔍", "Look closely"],
  ["🤫", "Use museum voices"],
  ["🖼️", "Don’t touch the art"],
  ["🚶", "Walk, don’t run"],
  ["📷", "Photograph the artwork — not other visitors"],
  ["⚡", "Do not use flash"],
];

export function HowToPlay() {
  const progress = useProgress();
  return (
    <Screen>
      <Title>How to Play</Title>
      <ol className="flex list-decimal flex-col gap-2 pl-6 text-lg">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="font-display text-xl italic">Don’t Google it — the fun is finding it yourself. 🔎</p>
      <Card>
        <h2 className="mb-3 font-display text-2xl font-semibold">Museum Detective Rules</h2>
        <ul className="flex flex-col gap-2 text-base">
          {rules.map(([icon, text]) => (
            <li key={text} className="flex gap-3">
              <span aria-hidden>{icon}</span>
              {text}
            </li>
          ))}
        </ul>
      </Card>
      <Button
        onClick={() => {
          startAdventure();
          navigate({ name: "quest", id: progress.currentQuest });
        }}
      >
        LET’S GO
      </Button>
    </Screen>
  );
}
