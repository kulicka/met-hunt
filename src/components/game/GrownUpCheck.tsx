"use client";

import { useState } from "react";
import { loadReveals, questById } from "@/lib/content";
import type { QuestReveal } from "@/data/types";
import { HoldButton } from "./HoldButton";
import { Button, Card, Eyebrow, Screen } from "./ui";

export function GrownUpCheck({ questId, onConfirm, onCancel }: { questId: number; onConfirm: () => void; onCancel: () => void }) {
  const [answer, setAnswer] = useState<QuestReveal | null | "error">(null);
  const quest = questById(questId)!;

  const reveal = () =>
    loadReveals().then(
      (all) => setAnswer(all.find((r) => r.id === questId) ?? "error"),
      () => setAnswer("error"),
    );

  return (
    <Screen>
      <Eyebrow>For grown-ups · Gallery {quest.gallery}</Eyebrow>
      <h1 className="font-serif text-4xl font-bold">Did they find it?</h1>
      <p className="text-lg">
        Take a look at what your explorer found. AI checks can be wrong, so your word counts.
      </p>
      {answer && answer !== "error" ? (
        <Card>
          <p className="text-sm font-semibold uppercase tracking-widest text-ink-soft">The answer</p>
          <p className="mt-1 text-xl font-semibold">{answer.hiddenObject}</p>
          <p className="text-ink-soft">
            in <em>{answer.artwork}</em> by {answer.artist}
          </p>
        </Card>
      ) : answer === "error" ? (
        <p className="text-ink-soft">The answer key couldn’t load without signal. You can still confirm the find.</p>
      ) : (
        <HoldButton seconds={2} onComplete={reveal}>
          Hold to see the answer
        </HoldButton>
      )}
      <Button onClick={onConfirm}>✓ YES, THEY FOUND IT</Button>
      <Button variant="secondary" onClick={onCancel}>
        Not yet — keep hunting
      </Button>
    </Screen>
  );
}
