"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { GALLERY_CLOSURES_URL, OFFICIAL_MAP_URL } from "@/lib/links";
import { loadReveals, nextUnsolved, pack, questById, questNumber } from "@/lib/content";
import { completeQuest, resetProgress, useProgress } from "@/lib/progress";
import { HoldButton } from "./HoldButton";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

const linkClass = "inline-flex min-h-11 items-center gap-1 underline underline-offset-4";

export function ParentsScreen() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <Screen className="min-h-[70dvh] justify-center text-center">
        <Eyebrow>For grown-ups</Eyebrow>
        <Title>Answer key &amp; settings</Title>
        <p className="text-lg">This area shows every answer. Hold the button for 3 seconds to open it.</p>
        <HoldButton seconds={3} onComplete={() => setOpen(true)}>
          Hold to open
        </HoldButton>
        <Button variant="quiet" className="mx-auto" onClick={() => history.back()}>
          Go back
        </Button>
      </Screen>
    );
  }
  return <ParentsPanel />;
}

function ParentsPanel() {
  const progress = useProgress();
  const closures = useClosures();
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  useEffect(() => {
    loadReveals().then(setReveals, () => {});
  }, []);

  const markFound = (id: number) => {
    if (window.confirm(`Mark Mystery #${questNumber(id)} as found?`)) {
      completeQuest(id, "manual", nextUnsolved(id, [...progress.completedQuests, id], closures));
    }
  };

  const reset = () => {
    if (window.confirm("Start over? This clears all progress and found treasures on this phone.")) {
      resetProgress();
      navigate({ name: "start" }, { replace: true });
    }
  };

  return (
    <Screen>
      <Eyebrow>For grown-ups</Eyebrow>
      <Title>Answer key</Title>

      <ol className="flex flex-col gap-3">
        {pack.questIds.map((id) => {
          const quest = questById(id)!;
          const r = reveals?.find((x) => x.id === id);
          const solved = progress.completedQuests.includes(id);
          return (
            <li key={id}>
              <Card className="flex flex-col gap-1">
                <p className="text-sm font-semibold uppercase tracking-widest text-ink-soft">
                  #{questNumber(id)} · Gallery {quest.gallery}
                  {isGalleryClosed(quest.gallery, closures) && " · temporarily closed"}
                  {solved && " · found ✓"}
                </p>
                {r ? (
                  <>
                    <p className="text-lg font-semibold">{r.hiddenObject}</p>
                    <p>
                      <em>{r.artwork}</em> — {r.artist}
                    </p>
                    {r.metObjectUrl && (
                      <a className={linkClass} href={r.metObjectUrl} target="_blank" rel="noopener noreferrer">
                        The Met collection page <ExternalLink aria-hidden size={14} />
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-ink-soft">Loading…</p>
                )}
                {!solved && (
                  <Button variant="quiet" className="-ml-2 self-start" onClick={() => markFound(id)}>
                    Mark as found
                  </Button>
                )}
              </Card>
            </li>
          );
        })}
      </ol>

      {closures.length > 0 && (
        <Card>
          <h2 className="font-serif text-2xl font-bold">Closed galleries</h2>
          <p className="mt-2">
            The Met lists Gallery {closures.map((c) => c.galleryId ?? c.connectionId).join(", ")} as temporarily closed.
            Mysteries in a closed gallery can be skipped without penalty, and the map won’t send anyone through a closed
            room. If no open route is known, the map suggests The Met’s official map or asking a guard.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="font-serif text-2xl font-bold">Photos and privacy</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>Photos are used only to check whether your child found the scavenger-hunt detail.</li>
          <li>
            Each photo is shrunk and stripped of hidden data (like location) on this phone, sent once to our checker, and
            not kept afterward. The checker uses an AI service from Anthropic to look at the photo.
          </li>
          <li>The game never asks for your child’s name, email, or location, and does no facial recognition.</li>
          <li>Please photograph the artwork, not other museum visitors.</li>
          <li>AI checks can be wrong. A grown-up can always confirm a find.</li>
          <li>Progress is saved only on this phone.</li>
        </ul>
      </Card>

      <div className="flex flex-col gap-1">
        <a className={linkClass} href={OFFICIAL_MAP_URL} target="_blank" rel="noopener noreferrer">
          The Met’s official map <ExternalLink aria-hidden size={14} />
        </a>
        <a className={linkClass} href={GALLERY_CLOSURES_URL} target="_blank" rel="noopener noreferrer">
          Today’s gallery closures <ExternalLink aria-hidden size={14} />
        </a>
      </div>

      <Button variant="secondary" onClick={reset}>
        Start over
      </Button>
      <Button onClick={() => navigate({ name: "quest", id: progress.currentQuest })}>Back to the hunt</Button>
    </Screen>
  );
}
