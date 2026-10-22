"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Lightbulb, Map as MapIcon } from "lucide-react";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import { loadReveals, nextUnsolved, pack, questById, questNumber } from "@/lib/content";
import { preparePhoto } from "@/lib/photo";
import { completeQuest, updateProgress, useProgress, type VerificationMethod } from "@/lib/progress";
import { type VerificationResult, type VerificationStatus } from "@/lib/verification";
import { GrownUpCheck } from "./GrownUpCheck";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen } from "./ui";

const GROWN_UP_AFTER = 2;
const REQUEST_TIMEOUT_MS = 35_000;

type Phase =
  | { kind: "clue" }
  | { kind: "preview" }
  | { kind: "checking" }
  | { kind: "result"; status: Exclude<VerificationStatus, "verified"> }
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "grownup" };

export function QuestScreen({ id }: { id: number }) {
  const quest = questById(id);
  const progress = useProgress();
  const closures = useClosures();
  const [phase, setPhase] = useState<Phase>({ kind: "clue" });
  const photo = useRef<{ blob: Blob; url: string } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Warm the answers chunk so a grown-up check still works if signal drops later.
    loadReveals().catch(() => {});
    if (quest) updateProgress((p) => (p.currentQuest === id && p.gameStarted ? p : { ...p, gameStarted: true, currentQuest: id }));
    return () => discardPhoto();
  }, [id, quest]);

  if (!quest) return null;
  const n = questNumber(id);
  const hintsUsed = progress.hintsUsed[id] ?? 0;
  const attempts = progress.attempts[id] ?? 0;
  const solved = progress.completedQuests.includes(id);
  const closed = isGalleryClosed(quest.gallery, closures);

  function discardPhoto() {
    if (photo.current) URL.revokeObjectURL(photo.current.url);
    photo.current = null;
  }

  const pick = (input: HTMLInputElement | null) => {
    if (!input) return;
    input.value = "";
    input.click();
  };

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    discardPhoto();
    try {
      const blob = await preparePhoto(file);
      photo.current = { blob, url: URL.createObjectURL(blob) };
      setPhase({ kind: "preview" });
    } catch {
      setPhase({ kind: "result", status: "invalid_image" });
    }
  }

  const countAttempt = () => updateProgress((p) => ({ ...p, attempts: { ...p.attempts, [id]: (p.attempts[id] ?? 0) + 1 } }));

  function finish(method: VerificationMethod) {
    discardPhoto();
    completeQuest(id, method, nextUnsolved(id, [...progress.completedQuests, id], closures));
    navigate({ name: "found", id }, { replace: true });
  }

  async function verify() {
    if (!photo.current) return;
    setPhase({ kind: "checking" });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`/api/verify?quest=${id}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: photo.current.blob,
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      // Keep the photo: it never reached the server, so TRY AGAIN can resend it.
      countAttempt();
      setPhase(controller.signal.aborted || navigator.onLine ? { kind: "unavailable" } : { kind: "offline" });
      return;
    }
    clearTimeout(timer);
    if (!response.ok) {
      countAttempt();
      setPhase({ kind: "unavailable" });
      return;
    }
    const result = (await response.json()) as VerificationResult;
    discardPhoto(); // the server has checked it; nothing of it is kept here either
    if (result.status === "verified") return finish("ai-photo");
    if (result.status !== "not_found") countAttempt();
    setPhase({ kind: "result", status: result.status });
  }

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} tabIndex={-1} aria-hidden />
      <input ref={library} type="file" accept="image/*" className="hidden" onChange={onFile} tabIndex={-1} aria-hidden />
    </>
  );

  const grownUpOffer = attempts >= GROWN_UP_AFTER && (
    <Button variant="secondary" onClick={() => setPhase({ kind: "grownup" })}>
      ASK A GROWN-UP
    </Button>
  );

  if (phase.kind === "grownup") {
    return (
      <GrownUpCheck
        questId={id}
        onConfirm={() => finish(attempts > 0 ? "grown-up" : "manual")}
        onCancel={() => setPhase({ kind: "clue" })}
      />
    );
  }

  if (phase.kind === "preview" && photo.current) {
    return (
      <Screen>
        {inputs}
        <h1 className="text-center font-serif text-3xl font-bold">Is this your treasure?</h1>
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, never uploaded anywhere else */}
        <img src={photo.current.url} alt="Your photo" className="max-h-[55dvh] w-full rounded-2xl border border-line object-contain" />
        <Button onClick={verify}>USE THIS PHOTO</Button>
        <Button variant="secondary" onClick={() => pick(camera.current)}>
          RETAKE
        </Button>
      </Screen>
    );
  }

  if (phase.kind === "checking") {
    return (
      <Screen className="min-h-[70dvh] justify-center text-center" >
        <div aria-hidden className="text-6xl motion-safe:animate-bounce">🔍</div>
        <p role="status" className="font-serif text-3xl font-bold">Checking your treasure…</p>
        <p className="text-lg text-ink-soft">Take another look at the painting while you wait.</p>
      </Screen>
    );
  }

  if (phase.kind === "result" || phase.kind === "offline" || phase.kind === "unavailable") {
    const tryAgain = (
      <Button onClick={() => pick(camera.current)}>
        <Camera aria-hidden size={20} /> TRY AGAIN
      </Button>
    );
    let body;
    if (phase.kind === "offline") {
      body = (
        <>
          <h1 className="font-serif text-4xl font-bold">No signal? No problem.</h1>
          <p className="text-lg">A grown-up can check your discovery.</p>
          <Button onClick={verify}>TRY AGAIN</Button>
          <Button variant="secondary" onClick={() => setPhase({ kind: "grownup" })}>
            GROWN-UP CHECK ✓
          </Button>
        </>
      );
    } else if (phase.kind === "unavailable") {
      body = (
        <>
          <h1 className="font-serif text-4xl font-bold">Hmm… the treasure checker is taking a break.</h1>
          <p className="text-lg">Try again in a moment, or ask a grown-up to check.</p>
          {photo.current ? <Button onClick={verify}>TRY AGAIN</Button> : tryAgain}
          <Button variant="secondary" onClick={() => setPhase({ kind: "grownup" })}>
            GROWN-UP CHECK ✓
          </Button>
        </>
      );
    } else if (phase.status === "likely") {
      body = (
        <>
          <h1 className="font-serif text-4xl font-bold">SO CLOSE! 👀</h1>
          <p className="text-lg">You may have the right painting. Can you get a clearer shot of the hidden treasure?</p>
          <p className="text-ink-soft">Zoom with your camera if the treasure is tiny.</p>
          {tryAgain}
          {grownUpOffer}
        </>
      );
    } else if (phase.status === "not_found") {
      body = (
        <>
          <h1 className="font-serif text-4xl font-bold">KEEP HUNTING 🔎</h1>
          <p className="text-lg">This doesn’t look like our mystery painting yet.</p>
          <Button onClick={() => setPhase({ kind: "clue" })}>BACK TO THE GALLERY</Button>
          {grownUpOffer}
        </>
      );
    } else {
      body = (
        <>
          <h1 className="font-serif text-4xl font-bold">Hmm… I can’t quite see it.</h1>
          <p className="text-lg">Try another photo — zooming in a little may help.</p>
          {tryAgain}
          <Button variant="secondary" onClick={() => setPhase({ kind: "grownup" })}>
            I’M SURE I FOUND IT
          </Button>
          {attempts >= GROWN_UP_AFTER && (
            <p className="text-center text-ink-soft">Still stuck? A grown-up can confirm your find.</p>
          )}
        </>
      );
    }
    return (
      <Screen className="text-center">
        {inputs}
        <Eyebrow>Gallery {quest.gallery}</Eyebrow>
        {body}
      </Screen>
    );
  }

  // Clue
  return (
    <Screen>
      {inputs}
      <header className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <Eyebrow>
            Quest {n} of {pack.questIds.length}
          </Eyebrow>
          <button type="button" className="min-h-11 text-sm text-ink-soft underline underline-offset-4" onClick={() => navigate({ name: "collection" })}>
            My treasures
          </button>
        </div>
        <p className="font-serif text-5xl font-bold tracking-wide" aria-label={`Gallery ${quest.gallery}`}>
          <span aria-hidden>📍 </span>Gallery {quest.gallery}
        </p>
        <ProgressDots completed={progress.completedQuests} current={id} />
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 self-start text-base font-semibold text-forest underline underline-offset-4"
          onClick={() => navigate({ name: "map", focus: id })}
        >
          <MapIcon aria-hidden size={20} /> Show on Treasure Map
        </button>
      </header>

      {closed && !solved && (
        <Card className="border-burgundy/40">
          <p className="font-semibold">This gallery is temporarily closed.</p>
          <p className="mt-1 text-ink-soft">Please don’t go in. You can skip this mystery without losing anything and try it another visit.</p>
          {nextUnsolved(id, progress.completedQuests, closures) ? (
            <Button className="mt-3" onClick={() => navigate({ name: "quest", id: nextUnsolved(id, progress.completedQuests, closures)! })}>
              SKIP TO THE NEXT MYSTERY
            </Button>
          ) : (
            <Button className="mt-3" onClick={() => navigate({ name: "done" })}>
              FINISH THE HUNT
            </Button>
          )}
        </Card>
      )}

      <Card className="relative text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Mystery #{n}</p>
        <blockquote className="mt-3 font-serif text-[1.75rem] font-semibold leading-snug">
          <p>“{quest.riddle[0]}</p>
          <p>{quest.riddle[1]}”</p>
        </blockquote>
        {hintsUsed > 0 && (
          <ol className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-left text-lg">
            {quest.hints.slice(0, hintsUsed).map((h, i) => (
              <li key={h}>
                <span className="font-semibold">Hint {i + 1}:</span> {h}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {solved ? (
        <Button onClick={() => navigate({ name: "found", id })}>SEE MY TREASURE</Button>
      ) : (
        <>
          <Button onClick={() => pick(camera.current)}>
            <Camera aria-hidden size={22} /> I FOUND IT — TAKE A PHOTO
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => pick(library.current)}>
              <ImageUp aria-hidden size={20} /> Choose a photo
            </Button>
            <Button
              variant="secondary"
              disabled={hintsUsed >= 2}
              className="disabled:opacity-50"
              onClick={() => updateProgress((p) => ({ ...p, hintsUsed: { ...p.hintsUsed, [id]: Math.min(hintsUsed + 1, 2) } }))}
            >
              <Lightbulb aria-hidden size={20} /> {hintsUsed >= 2 ? "No more hints" : "HINT"}
            </Button>
          </div>
          <p className="text-center text-sm text-ink-soft">
            Photograph the artwork — not other visitors. 📷 Zoom with your camera if the treasure is tiny.
          </p>
          <Button variant="quiet" className="mx-auto" onClick={() => setPhase({ kind: "grownup" })}>
            Continue without a photo
          </Button>
        </>
      )}
    </Screen>
  );
}
