"use client";

import { useState } from "react";
import { adventures, MORE_COMING_SOON } from "@/adventures/registry";
import { recheckClosures } from "@/lib/closures";
import { setAdventure, useProfile } from "@/lib/profile";
import { getProgress, getProgressFor, playQuest, useProgress } from "@/lib/progress";
import { navigate } from "./router";
import { Button, Screen, Title } from "./ui";

// "Choose your adventure": one card per adventure in the registry. Each
// adventure keeps its own progress, so switching never loses anything.

const tile =
  "flex w-full cursor-pointer flex-col gap-1 rounded-3xl border bg-card p-4 text-left shadow-[0_1px_2px_rgb(13_13_16/0.04)] transition has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-burgundy";
const tileState = (selected: boolean) => (selected ? "border-ink ring-2 ring-ink" : "border-line hover:border-ink/40");

function progressLine(id: string, total: number) {
  const p = getProgressFor(id);
  if (!p || p.status === "not_started") return null;
  if (p.status === "completed") return `Finished! All ${total} treasures found ✓`;
  return `${p.completedQuests.length} of ${total} treasures found`;
}

export function AdventureList({ value, onPick }: { value?: string; onPick: (id: string) => void }) {
  useProgress(); // re-render when progress changes
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Choose your adventure</legend>
      {adventures.map((a) => {
        const line = progressLine(a.id, a.quests.length);
        return (
          <label key={a.id} className={`${tile} ${tileState(value === a.id)}`}>
            <input type="radio" name="adventure" className="sr-only" checked={value === a.id} onChange={() => onPick(a.id)} />
            <span className="flex items-center gap-3">
              <span aria-hidden className="text-4xl">{a.emoji}</span>
              <span className="flex flex-col">
                <span className="font-display text-2xl font-semibold leading-tight">{a.title}</span>
                <span className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-ink-soft">{a.where}</span>
              </span>
            </span>
            <span className="text-base leading-snug">{a.description}</span>
            <span className="text-sm text-ink-soft">
              {a.quests.length} mysteries
              {a.chapters && a.chapters.length > 1 ? ` in ${a.chapters.length} chapters` : ""}
              {a.bonus?.length ? ` + ${a.bonus.length} bonus` : ""}
            </span>
            {line && <span className="text-sm font-semibold text-forest">{line}</span>}
            {a.launchStatus === "field_test_required" && (
              <span className="mt-1 rounded-2xl bg-paper-deep px-3 py-2 text-sm">
                <strong>New and still being tested.</strong> Grown-ups: check today’s gallery closures, and ask a guard if a room
                is hard to find.
              </span>
            )}
          </label>
        );
      })}
      {MORE_COMING_SOON && (
        <div className="flex items-center gap-3 rounded-3xl border border-dashed border-ink/20 bg-card/50 p-4 text-ink-soft">
          <span aria-hidden className="text-3xl">🗺️</span>
          <span>More adventures are on the way.</span>
        </div>
      )}
    </fieldset>
  );
}

/**
 * Right after START THE HUNT, whenever a new hunt begins (nothing is preselected),
 * and from the menu or start screen to switch adventures mid-visit.
 */
export function AdventurePickerScreen({ start = false }: { start?: boolean }) {
  const profile = useProfile();
  const firstTime = start || !profile?.adventureId;
  const [choice, setChoice] = useState(firstTime ? undefined : profile?.adventureId);
  if (!profile) return null;

  const go = () => {
    if (!choice) return;
    setAdventure(choice);
    recheckClosures();
    const p = getProgress();
    // Switching to a hunt already under way shows its welcome-back screen. Anything
    // else (they tapped START THE HUNT, restarted, or picked one not begun yet) opens
    // the treasure map at the first mystery (or where an older save left off), so the
    // hunt begins with the whole route in view; SHOW MY CLUE goes on from there.
    if (!firstTime && p.status !== "not_started") return navigate({ name: "start" }, { replace: true });
    if (p.status === "completed") return navigate({ name: "start" }, { replace: true });
    playQuest(p.currentQuest);
    navigate({ name: "map", focus: p.currentQuest }, { replace: true });
  };

  return (
    <Screen>
      <Title className="text-center">CHOOSE YOUR ADVENTURE</Title>
      <p className="text-center text-ink-soft">
        {firstTime ? "Which part of the museum will you explore today?" : "Your treasures in every adventure stay saved."}
      </p>
      <AdventureList value={choice} onPick={setChoice} />
      <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-line bg-paper/85 px-5 pb-4 pt-3 backdrop-blur-md">
        <Button disabled={!choice} className="disabled:opacity-40" onClick={go}>
          {firstTime ? (choice ? "START THE HUNT" : "PICK AN ADVENTURE") : choice === profile.adventureId
              ? "BACK TO MY ADVENTURE"
              : getProgressFor(choice!)?.status === "not_started"
                ? "START THIS ADVENTURE"
                : "PLAY THIS ADVENTURE"}
        </Button>
      </div>
    </Screen>
  );
}
