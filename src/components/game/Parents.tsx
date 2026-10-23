"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { photoAttempts, trackQuest } from "@/lib/analytics/client";
import { statusFor, useArtworkStatus, withMetData } from "@/lib/artwork-status";
import type { ArtworkStatus } from "@/lib/artworks";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import type { QuestReveal } from "@/data/types";
import { GALLERY_CLOSURES_URL, OFFICIAL_MAP_URL } from "@/lib/links";
import { loadReveals, nextUnsolved, pack, questById, questNumber } from "@/lib/content";
import { completeQuest, useProgress } from "@/lib/progress";
import { AnalyticsConsentCard } from "./AnalyticsConsent";
import { HoldButton } from "./HoldButton";
import { RestartButton } from "./Lifecycle";
import { navigate } from "./router";
import { Button, Card, Eyebrow, Screen, Title } from "./ui";

const linkClass = "inline-flex min-h-11 items-center gap-1 underline underline-offset-4";

function artworkNote(a?: ArtworkStatus) {
  switch (a?.check) {
    case "off_view":
      return "The Met lists this artwork as not on view right now.";
    case "moved":
      return `The Met lists this artwork in Gallery ${a.galleryNumber}, not Gallery ${a.expectedGallery}.`;
    case "not_found":
      return "Couldn’t match this artwork in The Met’s online collection. Check before your visit.";
    default:
      return null;
  }
}

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
  const artworks = useArtworkStatus();
  const [reveals, setReveals] = useState<QuestReveal[] | null>(null);
  useEffect(() => {
    loadReveals().then(setReveals, () => {});
  }, []);

  const markFound = (id: number) => {
    if (window.confirm(`Mark Mystery #${questNumber(id)} as found?`)) {
      trackQuest("quest_parent_override", id, { kind: "answer_key", photo_attempts: photoAttempts(id) });
      completeQuest(id, "manual", nextUnsolved(id, [...progress.completedQuests, id], closures));
    }
  };

  return (
    <Screen>
      <Eyebrow>For grown-ups</Eyebrow>
      <Title>Answer key</Title>

      <ol className="flex flex-col gap-3">
        {pack.questIds.map((id) => {
          const quest = questById(id)!;
          const found = reveals?.find((x) => x.id === id);
          const r = found && withMetData(found, statusFor(artworks, id));
          const note = artworkNote(statusFor(artworks, id));
          const solved = progress.completedQuests.includes(id);
          return (
            <li key={id}>
              <Card className="flex flex-col gap-1">
                <p className="font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
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
                {note && <p className="font-semibold text-burgundy">{note}</p>}
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

      {artworks.checkedAt && (
        <p className="text-sm text-ink-soft">
          Artwork locations checked against The Met’s online collection on{" "}
          {new Date(artworks.checkedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}. Galleries
          change often, so a guard can always help.
        </p>
      )}

      {closures.length > 0 && (
        <Card>
          <h2 className="font-display text-2xl font-semibold">Closed galleries</h2>
          <p className="mt-2">
            The Met lists Gallery {closures.map((c) => c.galleryId ?? c.connectionId).join(", ")} as temporarily closed.
            Mysteries in a closed gallery can be skipped without penalty, and the map won’t send anyone through a closed
            room. If no open route is known, the map suggests The Met’s official map or asking a guard.
          </p>
        </Card>
      )}

      <Card>
        <h2 className="font-display text-2xl font-semibold">Photos and privacy</h2>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5">
          <li>Photos are used only to check whether your child found the scavenger-hunt detail.</li>
          <li>
            Each photo is shrunk and stripped of hidden data (like location) on this phone, sent once to our checker, and
            not kept afterward. The checker uses an AI service from Anthropic to look at the photo.
          </li>
          <li>The game never asks for your child’s name, birthday, email, or location, and does no facial recognition. The explorer your child picks stays on this phone, and so does the age group unless you turn on the optional analytics below (then only a broad group like “8–10” is sent).</li>
          <li>Please photograph the artwork, not other museum visitors.</li>
          <li>AI checks can be wrong. A grown-up can always confirm a find.</li>
          <li>Progress is saved only on this phone.</li>
        </ul>
      </Card>

      <AnalyticsConsentCard />

      <div className="flex flex-col gap-1">
        <a className={linkClass} href={OFFICIAL_MAP_URL} target="_blank" rel="noopener noreferrer">
          The Met’s official map <ExternalLink aria-hidden size={14} />
        </a>
        <a className={linkClass} href={GALLERY_CLOSURES_URL} target="_blank" rel="noopener noreferrer">
          Today’s gallery closures <ExternalLink aria-hidden size={14} />
        </a>
      </div>

      <RestartButton />
      <Button onClick={() => navigate(progress.status === "in_progress" ? { name: "quest", id: progress.currentQuest } : { name: "start" })}>
        Back to the hunt
      </Button>
    </Screen>
  );
}
