"use client";

import { pack } from "@/lib/content";
import { useProgress, updateProgress } from "@/lib/progress";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

export function StartScreen() {
  const progress = useProgress();
  const resume = progress.gameStarted;

  const start = () => {
    updateProgress((p) => ({ ...p, gameStarted: true }));
    navigate({ name: "quest", id: progress.currentQuest });
  };

  return (
    <Screen className="min-h-dvh justify-center text-center">
      <div aria-hidden className="mx-auto text-5xl">🔎</div>
      <Eyebrow>The Met</Eyebrow>
      <Title className="text-5xl">Hidden Treasures</Title>
      <p className="font-serif text-2xl text-ink-soft">{pack.description}</p>
      <p className="text-lg leading-relaxed">
        Somewhere inside each gallery, a tiny detail is hiding in plain sight. Read the clue. Look carefully. Find the
        treasure.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        <Button onClick={start}>{resume ? "CONTINUE THE HUNT" : "START THE HUNT"}</Button>
        <Button variant="secondary" onClick={() => navigate({ name: "how" })}>
          How to Play
        </Button>
      </div>
      <Button variant="quiet" className="mx-auto mt-6" onClick={() => navigate({ name: "parents" })}>
        For grown-ups
      </Button>
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
      <p className="font-serif text-xl italic">Don’t Google it — the fun is finding it yourself. 🔎</p>
      <Card>
        <h2 className="mb-3 font-serif text-2xl font-bold">Museum Detective Rules</h2>
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
          updateProgress((p) => ({ ...p, gameStarted: true }));
          navigate({ name: "quest", id: progress.currentQuest });
        }}
      >
        LET’S GO
      </Button>
    </Screen>
  );
}
