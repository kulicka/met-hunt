"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, PenLine } from "lucide-react";
import { photoAttempts, photoSubmitted, questViewed, trackQuest } from "@/lib/analytics/client";
import { latencyBucket, type ERROR_KINDS } from "@/lib/analytics/schema";
import { isGalleryClosed, useClosures } from "@/lib/closures";
import { useAdventure } from "@/lib/content";
import { preparePhoto } from "@/lib/photo";
import { completeQuest, getProgress, playQuest, updateProgress, useProgress, type VerificationMethod } from "@/lib/progress";
import { type VerificationResult, type VerificationStatus } from "@/lib/verification";
import { GrownUpCheck } from "./GrownUpCheck";
import { MagnifierHints } from "./MagnifierHints";
import { warmStamps } from "./Notebook";
import { MysteryCard, TextArtworkVerificationForm, type TextCheck } from "./QuestParts";
import { navigate } from "./router";
import { Button, Card, Eyebrow, ProgressDots, Screen } from "./ui";

const GROWN_UP_AFTER = 2;
const REQUEST_TIMEOUT_MS = 35_000;
const ANSWER_TIMEOUT_MS = 15_000;
const MODEL_TOKEN = /^[A-Za-z0-9._-]{1,40}$/;

type Phase =
  | { kind: "clue" }
  /** I FOUND IT!: take a photo or choose one. */
  | { kind: "photo" }
  /** Continue without a photo: type the artwork's name or number. */
  | { kind: "text" }
  | { kind: "preview" }
  | { kind: "checking" }
  | { kind: "result"; status: Exclude<VerificationStatus, "verified"> }
  | { kind: "offline" }
  | { kind: "unavailable" }
  | { kind: "grownup" };

export function QuestScreen({ id }: { id: number }) {
  const { adventure, questById, questNumber, questIds, nextUnsolved, loadReveals, isBonus, bonusAt, chapterOf } = useAdventure();
  const quest = questById(id);
  const bonus = isBonus(id);
  const progress = useProgress();
  const closures = useClosures();
  const [phase, setPhase] = useState<Phase>({ kind: "clue" });
  // Kept while this mystery is open, so Back and a miss never lose what was typed.
  const [draft, setDraft] = useState("");
  const [textCheck, setTextCheck] = useState<TextCheck>("idle");
  const photo = useRef<{ blob: Blob; url: string; source: "camera" | "library" } | null>(null);
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Warm the answers chunk so a grown-up check still works if signal drops later.
    loadReveals().catch(() => {});
    warmStamps(adventure);
    if (!quest) {
      // Not in this adventure (an old link, or the lineup changed).
      navigate({ name: "start" }, { replace: true });
    } else {
      // A bonus never becomes the current mystery: the hunt carries on where it was.
      if (!bonus) playQuest(id);
      questViewed(id, getProgress());
    }
    return () => discardPhoto();
  }, [id, quest, bonus, adventure, loadReveals]);

  if (!quest) return null;
  const n = questNumber(id);
  const hintsUsed = progress.hintsUsed[id] ?? 0;
  const attempts = progress.attempts[id] ?? 0;
  const solved = bonus ? !!progress.bonusFound?.includes(id) : progress.completedQuests.includes(id);
  const chapter = chapterOf(id);
  const extras = bonusAt(id).filter((b) => !progress.bonusFound?.includes(b.id));
  const closed = isGalleryClosed(quest.gallery, closures);
  // Stuck on an open mystery: move on to the next one and come back to this later.
  const skipTo = !bonus && !closed && !solved ? nextUnsolved(id, progress.completedQuests, closures) : null;

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
    const source = e.target === library.current ? "library" : "camera";
    e.target.value = "";
    if (!file) return;
    discardPhoto();
    try {
      const blob = await preparePhoto(file);
      photo.current = { blob, url: URL.createObjectURL(blob), source };
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
    // Analytics records only that a photo was sent and what came back, never the photo.
    const attempt = photoSubmitted(id, photo.current.source);
    const sentAt = Date.now();
    const report = (result: VerificationStatus | "error", errorKind: (typeof ERROR_KINDS)[number] = "none", model?: string) =>
      attempt > 0 &&
      trackQuest("quest_verification_result", id, {
        attempt_number: attempt,
        result,
        error_kind: errorKind,
        model_version: model && MODEL_TOKEN.test(model) ? model : null,
        latency_bucket: latencyBucket(Date.now() - sentAt),
      });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`/api/verify?adventure=${encodeURIComponent(adventure.id)}&quest=${id}`, {
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: photo.current.blob,
        signal: controller.signal,
      });
    } catch {
      clearTimeout(timer);
      // Keep the photo: it never reached the server, so TRY AGAIN can resend it.
      countAttempt();
      const offline = !controller.signal.aborted && !navigator.onLine;
      report("error", controller.signal.aborted ? "timeout" : offline ? "offline" : "unavailable");
      setPhase(offline ? { kind: "offline" } : { kind: "unavailable" });
      return;
    }
    clearTimeout(timer);
    if (!response.ok) {
      report("error", response.status === 429 ? "rate_limited" : response.status >= 500 ? "unavailable" : "rejected");
      countAttempt();
      setPhase({ kind: "unavailable" });
      return;
    }
    const result = (await response.json()) as VerificationResult;
    discardPhoto(); // the server has checked it; nothing of it is kept here either
    report(result.status, "none", result.model);
    if (result.status === "verified") return finish("ai-photo");
    if (result.status !== "not_found") countAttempt();
    setPhase({ kind: "result", status: result.status });
  }

  // Same credit as a photo once the server says the name or number matches.
  async function checkText() {
    const answer = draft.trim();
    if (!answer) return setTextCheck("blank");
    setTextCheck("checking");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANSWER_TIMEOUT_MS);
    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adventure: adventure.id, quest: id, answer }),
        signal: controller.signal,
      });
      if (!response.ok) return setTextCheck("error");
      const { result } = (await response.json()) as { result?: string };
      if (result === "match") return finish("text");
      setTextCheck(result === "unchecked" ? "unchecked" : result === "no_match" ? "no_match" : "error");
    } catch {
      // Offline or timed out: nothing is counted, and the answer stays in the box.
      setTextCheck("error");
    } finally {
      clearTimeout(timer);
    }
  }

  const inputs = (
    <>
      <input ref={camera} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} tabIndex={-1} aria-hidden />
      <input ref={library} type="file" accept="image/*" className="hidden" onChange={onFile} tabIndex={-1} aria-hidden />
    </>
  );

  const backToClue = (
    <Button
      variant="quiet"
      className="mx-auto"
      onClick={() => {
        discardPhoto();
        setPhase({ kind: "clue" });
      }}
    >
      Back to my clue
    </Button>
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
        onConfirm={() => {
          trackQuest("quest_parent_override", id, { kind: attempts > 0 ? "after_attempts" : "without_photo", photo_attempts: photoAttempts(id) });
          finish(attempts > 0 ? "grown-up" : "manual");
        }}
        onCancel={() => setPhase({ kind: "clue" })}
      />
    );
  }

  if (phase.kind === "text") {
    return (
      <Screen>
        <TextArtworkVerificationForm
          gallery={quest.gallery}
          draft={draft}
          onDraft={(v) => {
            setDraft(v);
            if (textCheck !== "checking" && textCheck !== "idle") setTextCheck("idle");
          }}
          status={textCheck}
          onCheck={checkText}
          onBack={() => setPhase({ kind: "clue" })}
          onGrownUp={() => setPhase({ kind: "grownup" })}
        />
      </Screen>
    );
  }

  if (phase.kind === "photo") {
    return (
      <Screen>
        {inputs}
        <Eyebrow>Gallery {quest.gallery}</Eyebrow>
        <h1 className="font-display text-[2rem] font-semibold leading-[1.1]">Show us your discovery!</h1>
        <p className="text-lg text-ink-soft">Photograph the artwork, not other visitors. Zoom with your camera if the treasure is tiny.</p>
        <Button onClick={() => pick(camera.current)}>
          <Camera aria-hidden size={22} /> Take a photo
        </Button>
        <Button variant="secondary" onClick={() => pick(library.current)}>
          <ImageUp aria-hidden size={20} /> Choose from library
        </Button>
        <Button variant="secondary" onClick={() => setPhase({ kind: "text" })}>
          <PenLine aria-hidden size={20} /> Type the name or number
        </Button>
        {backToClue}
      </Screen>
    );
  }

  if (phase.kind === "preview" && photo.current) {
    return (
      <Screen>
        {inputs}
        <h1 className="text-center font-display text-3xl font-semibold">Is this your treasure?</h1>
        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, never uploaded anywhere else */}
        <img src={photo.current.url} alt="Your photo" className="max-h-[55dvh] w-full rounded-2xl border border-line object-contain" />
        <Button onClick={verify}>Check my discovery</Button>
        <Button variant="secondary" onClick={() => pick(photo.current?.source === "library" ? library.current : camera.current)}>
          {photo.current.source === "library" ? "CHOOSE ANOTHER" : "RETAKE"}
        </Button>
        {backToClue}
      </Screen>
    );
  }

  if (phase.kind === "checking") {
    return (
      <Screen className="min-h-[70dvh] justify-center text-center" >
        <div aria-hidden className="text-6xl motion-safe:animate-bounce">🔍</div>
        <p role="status" className="font-display text-3xl font-semibold">Checking your treasure…</p>
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
          <h1 className="font-display text-4xl font-semibold">No signal? No problem.</h1>
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
          <h1 className="font-display text-4xl font-semibold">Hmm… the treasure checker is taking a break.</h1>
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
          <h1 className="font-display text-4xl font-semibold">SO CLOSE! 👀</h1>
          <p className="text-lg">You may have the right painting. Can you get a clearer shot of the hidden treasure?</p>
          <p className="text-ink-soft">Zoom with your camera if the treasure is tiny.</p>
          {tryAgain}
          {grownUpOffer}
        </>
      );
    } else if (phase.status === "not_found") {
      body = (
        <>
          <h1 className="font-display text-4xl font-semibold">KEEP HUNTING 🔎</h1>
          <p className="text-lg">This doesn’t look like our mystery painting yet.</p>
          <Button onClick={() => setPhase({ kind: "clue" })}>BACK TO THE GALLERY</Button>
          {grownUpOffer}
        </>
      );
    } else if (phase.status === "invalid_image") {
      body = (
        <>
          <h1 className="font-display text-4xl font-semibold">That photo didn’t come through.</h1>
          <p className="text-lg">Let’s try taking another one.</p>
          {tryAgain}
          {grownUpOffer}
        </>
      );
    } else {
      body = (
        <>
          <h1 className="font-display text-4xl font-semibold">Hmm… I can’t quite see it.</h1>
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
        {phase.kind === "result" && phase.status === "not_found" ? null : backToClue}
      </Screen>
    );
  }

  // Clue
  const egyptian = adventure.theme === "egyptian";
  const eyebrow = bonus
    ? "Bonus mystery · doesn’t count toward the hunt"
    : [adventure.title, chapter?.title].filter(Boolean).join(" · ");
  return (
    <Screen className="gap-4">
      {inputs}
      <header className="flex flex-col gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="whitespace-nowrap font-display text-[2.6rem] font-semibold leading-tight min-[360px]:text-5xl">
          <span aria-hidden className="text-burgundy">📍 </span>Gallery {quest.gallery}
        </h1>
        {!bonus && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="font-semibold">
              Quest {n} of {questIds.length}
            </p>
            <ProgressDots completed={progress.completedQuests} current={id} />
          </div>
        )}
      </header>

      {closed && !solved && !bonus && (
        <Card className="border-burgundy/40">
          <p className="font-semibold">This gallery is temporarily closed.</p>
          <p className="mt-1 text-ink-soft">Please don’t go in. You can skip this mystery without losing anything and try it another visit.</p>
          {nextUnsolved(id, progress.completedQuests, closures) ? (
            <Button
              className="mt-3"
              onClick={() => {
                trackQuest("quest_skipped", id, { reason: "closed" });
                navigate({ name: "quest", id: nextUnsolved(id, progress.completedQuests, closures)! });
              }}
            >
              SKIP TO THE NEXT MYSTERY
            </Button>
          ) : (
            <Button
              className="mt-3"
              onClick={() => {
                trackQuest("quest_skipped", id, { reason: "closed" });
                navigate({ name: "done" });
              }}
            >
              FINISH THE HUNT
            </Button>
          )}
        </Card>
      )}

      <MysteryCard
        badge={bonus ? "Bonus mystery ★" : `Mystery #${n}`}
        // The mystery's name gives the answer away, so it stays hidden until the find.
        title={solved ? quest.title : undefined}
        riddle={quest.riddle}
        decorated={egyptian}
      />

      <MagnifierHints
        hints={quest.hints}
        used={hintsUsed}
        onReveal={() => updateProgress((p) => ({ ...p, hintsUsed: { ...p.hintsUsed, [id]: Math.min((p.hintsUsed[id] ?? 0) + 1, 2) } }))}
      />

      {bonus && !solved && (
        <Button variant="quiet" className="mx-auto" onClick={() => navigate({ name: "quest", id: progress.currentQuest })}>
          Skip the bonus — back to my mystery
        </Button>
      )}

      {solved ? (
        <Button onClick={() => navigate({ name: "found", id })}>SEE MY TREASURE</Button>
      ) : (
        <>
          <Button className="min-h-16 text-lg tracking-[0.04em] min-[360px]:text-lg" onClick={() => setPhase({ kind: "photo" })}>
            <Camera aria-hidden size={24} /> I FOUND IT!
          </Button>
          {/* As easy to find as the photo, but quieter: typing the label's name or number earns the same credit. */}
          <Button variant="secondary" className="!min-h-16 flex-col !gap-0 py-2 leading-tight" onClick={() => setPhase({ kind: "text" })}>
            <span className="inline-flex items-center gap-2">
              <PenLine aria-hidden size={20} /> Continue without a photo
            </span>
            <span className="text-sm font-normal text-ink-soft">Enter the artwork name or number instead</span>
          </Button>
          {skipTo != null && (
            <Button
              variant="quiet"
              className="mx-auto"
              onClick={() => {
                // Nothing is lost: the mystery stays unsolved and comes round again after the others.
                trackQuest("quest_skipped", id, { reason: "user_switched" });
                playQuest(skipTo);
                navigate({ name: "next", from: id });
              }}
            >
              Can’t find it? Skip for now
            </Button>
          )}
        </>
      )}
      {extras.map((b) => (
        <Card key={b.id} className="border-gold/50">
          <p className="font-semibold">★ A bonus mystery hides in this gallery too!</p>
          <p className="mt-1 text-ink-soft">It’s extra: you don’t need it to finish the hunt.</p>
          <Button variant="secondary" className="mt-3" onClick={() => navigate({ name: "quest", id: b.id })}>
            TRY THE BONUS MYSTERY
          </Button>
        </Card>
      ))}
    </Screen>
  );
}
