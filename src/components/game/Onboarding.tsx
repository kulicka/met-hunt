"use client";

import { useState } from "react";
import { avatarById, avatars } from "@/data/avatars";
import { AGE_CHOICES, type AgeChoice } from "@/lib/adventure";
import { finishOnboarding, setAge, setAvatar, useProfile } from "@/lib/profile";
import { playQuest, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { goBack, navigate } from "./router";
import { Button, Eyebrow, Screen, Title } from "./ui";

// First launch: age, then explorer, then ready. The adventure is chosen right
// after START THE HUNT (see AdventurePicker.tsx); none is assumed. No name, birthday, email, or
// account is ever asked for. Choices are saved as they are made, so a closed
// tab resumes where it stopped.

const tile =
  "flex items-center justify-center rounded-3xl border bg-card font-semibold shadow-[0_1px_2px_rgb(13_13_16/0.04)] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy";
const tileState = (selected: boolean) => (selected ? "border-ink bg-card ring-2 ring-ink" : "border-line hover:border-ink/40");

export function AgePicker({ value, onPick }: { value?: AgeChoice; onPick: (age: AgeChoice) => void }) {
  return (
    <fieldset>
      <legend className="mb-3 font-display text-2xl font-semibold">How old are you?</legend>
      <div className="grid grid-cols-4 gap-3">
        {AGE_CHOICES.map((age) => (
          <label key={age} className={`${tile} ${tileState(value === age)} min-h-16 cursor-pointer text-2xl has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-burgundy`}>
            <input type="radio" name="age" className="sr-only" checked={value === age} onChange={() => onPick(age)} />
            {age}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ExplorerPicker({ value, onPick }: { value?: string; onPick: (id: string) => void }) {
  const option = (a: (typeof avatars)[number]) => (
    <label
      key={a.id}
      className={`${tile} ${tileState(value === a.id)} cursor-pointer flex-col justify-start gap-1 p-3 text-center has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-burgundy ${a.featured ? "relative bg-gradient-to-b from-gold-soft/30 to-card pt-4" : ""}`}
    >
      <input type="radio" name="explorer" className="sr-only" checked={value === a.id} onChange={() => onPick(a.id)} />
      {a.featured && (
        <span className="absolute right-3 top-3 rounded-full bg-ink px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-paper">New</span>
      )}
      <AvatarArt asset={a.imageAsset} size={a.featured ? 120 : 88} className="h-auto max-w-full" />
      <span className={`font-display font-semibold ${a.featured ? "text-3xl" : "text-2xl"}`}>{a.displayName}</span>
      <span className="text-sm font-normal leading-snug text-ink-soft">{a.description}</span>
    </label>
  );
  // Featured explorers lead the list in bigger cards; the rest keep their order.
  return (
    <fieldset>
      <legend className="sr-only">Choose your explorer</legend>
      <div className="grid grid-cols-2 gap-3">
        {avatars.filter((a) => a.featured).map(option)}
        {avatars.filter((a) => !a.featured).map(option)}
      </div>
    </fieldset>
  );
}

type Step = "age" | "explorer" | "ready";

const firstStep = (p: { age?: unknown; avatarId?: string } | null): Step => (!p?.age ? "age" : !p.avatarId ? "explorer" : "ready");

export function Onboarding() {
  const profile = useProfile();
  const progress = useProgress();
  const [step, setStep] = useState<Step>(firstStep(profile));
  if (!profile) return null;
  const avatar = avatarById(profile.avatarId);
  // Only once an adventure is chosen is there a hunt to resume.
  const chosen = !!profile.adventureId;
  const resuming = chosen && progress.status !== "not_started";

  if (step === "age") {
    return (
      <Screen className="min-h-dvh justify-center">
        <div className="text-center">
          <div aria-hidden className="text-5xl">🔎</div>
          <Eyebrow>The Met · Hidden Treasures</Eyebrow>
          <Title className="mt-2">WELCOME, DETECTIVE!</Title>
          <p className="mt-3 text-lg">Before we enter the museum, let’s get your explorer identity ready.</p>
        </div>
        <AgePicker value={profile.age} onPick={setAge} />
        <Button disabled={!profile.age} className="disabled:opacity-40" onClick={() => setStep("explorer")}>
          CONTINUE
        </Button>
      </Screen>
    );
  }

  if (step === "explorer") {
    return (
      <Screen>
        <Title className="text-center">CHOOSE YOUR EXPLORER</Title>
        <ExplorerPicker value={profile.avatarId} onPick={setAvatar} />
        <div className="sticky bottom-0 -mx-5 flex flex-col gap-2 border-t border-line bg-paper/85 px-5 pb-4 pt-3 backdrop-blur-md">
          <Button disabled={!profile.avatarId} className="disabled:opacity-40" onClick={() => setStep("ready")}>
            CONTINUE
          </Button>
          <Button variant="quiet" className="mx-auto" onClick={() => setStep("age")}>
            Back to age
          </Button>
        </div>
      </Screen>
    );
  }

  const start = () => {
    finishOnboarding();
    // New players choose their adventure next.
    if (!chosen) return navigate({ name: "adventures" }, { replace: true });
    if (progress.status === "completed") return navigate({ name: "start" }, { replace: true });
    playQuest(progress.currentQuest);
    navigate({ name: "quest", id: progress.currentQuest }, { replace: true });
  };

  return (
    <Screen className="min-h-dvh justify-center text-center">
      <AvatarArt asset={avatar.imageAsset} size={160} className="mx-auto" />
      <Title>Great choice, {avatar.displayName}!</Title>
      <p className="text-xl">{resuming ? "Your mystery is waiting where you left it." : "Your first mystery is waiting."}</p>
      <Button onClick={start}>{resuming ? "CONTINUE ADVENTURE" : chosen ? "START MY ADVENTURE" : "START THE HUNT"}</Button>
      <Button variant="quiet" className="mx-auto" onClick={() => setStep("explorer")}>
        Back
      </Button>
    </Screen>
  );
}

/** Settings: change explorer or age without touching hunt progress. */
export function EditProfile({ field }: { field: "explorer" | "age" }) {
  const profile = useProfile();
  if (!profile) return null;
  return (
    <Screen>
      <Title>{field === "explorer" ? "Change Explorer" : "Edit Age"}</Title>
      <p className="text-ink-soft">Your treasures and progress stay just as they are.</p>
      {field === "explorer" ? <ExplorerPicker value={profile.avatarId} onPick={setAvatar} /> : <AgePicker value={profile.age} onPick={setAge} />}
      <Button onClick={goBack}>DONE</Button>
    </Screen>
  );
}
