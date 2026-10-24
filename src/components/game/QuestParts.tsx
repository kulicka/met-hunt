"use client";

import { useEffect, useRef } from "react";
import { riddleFontSize } from "@/lib/riddle";
import { Button } from "./ui";

// Pieces of the quest screen (QuestScreen.tsx holds the flow and state).

/** Small corner flourish for the parchment card, kept clear of the riddle. */
function Corner({ className }: { className: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24" className={`pointer-events-none absolute h-5 w-5 text-gold/70 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 14 V2 H14" />
      <path d="M6 10 V6 H10" />
    </svg>
  );
}

/** The parchment card: badge, the mystery's name once found, and the exact saved riddle. */
export function MysteryCard({
  badge,
  title,
  riddle,
  decorated,
}: {
  badge: string;
  /** Only after the find: the name gives the answer away. */
  title?: string;
  riddle: string[];
  decorated: boolean;
}) {
  return (
    <section
      aria-label="Your riddle"
      className={`relative rounded-3xl border bg-parchment px-6 pb-7 pt-6 text-center shadow-[0_1px_2px_rgb(43_29_18/0.05),0_18px_40px_-26px_rgb(43_29_18/0.45)] ${decorated ? "border-parchment-edge" : "border-line"}`}
    >
      {decorated && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-1.5 rounded-[1.25rem] border border-parchment-edge/70" />
          <Corner className="left-3 top-3" />
          <Corner className="right-3 top-3 rotate-90" />
          <Corner className="bottom-3 right-3 rotate-180" />
          <Corner className="bottom-3 left-3 -rotate-90" />
        </>
      )}
      <p className="inline-flex items-center rounded-full border border-gold/40 bg-gold-soft/50 px-3 py-1 font-mono text-[12px] font-semibold uppercase tracking-[0.16em] text-gold">
        {badge}
      </p>
      {title && <h2 className="mt-3 font-display text-2xl font-semibold text-burgundy">{title}</h2>}
      <div className="@container mt-4">
        {/* Riddles are editorially locked: lines exactly as saved, with their own line breaks. */}
        <blockquote className="font-display font-semibold leading-[1.45] text-balance text-ink" style={{ fontSize: riddleFontSize(riddle) }}>
          {riddle.map((line, i) => (
            <p key={i}>
              {i === 0 && "“"}
              {line}
              {i === riddle.length - 1 && "”"}
            </p>
          ))}
        </blockquote>
      </div>
    </section>
  );
}

export type TextCheck = "idle" | "checking" | "blank" | "no_match" | "unchecked" | "error";

const MESSAGES: Partial<Record<TextCheck, string>> = {
  blank: "Type the artwork’s name or number first.",
  no_match: "Not quite! Check the artwork label and try again.",
  unchecked: "We can’t check typed answers for this mystery yet. Take a photo, or ask a grown-up to confirm.",
  error: "Couldn’t check right now. Try again or ask a grown-up.",
};

/**
 * "Continue without a photo": the player types the artwork's name or accession
 * number from its label. Checked on submit only; the text stays after a miss.
 */
export function TextArtworkVerificationForm({
  gallery,
  draft,
  onDraft,
  status,
  onCheck,
  onBack,
  onGrownUp,
}: {
  gallery: string;
  draft: string;
  onDraft: (v: string) => void;
  status: TextCheck;
  onCheck: () => void;
  onBack: () => void;
  onGrownUp: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const result = useRef<HTMLParagraphElement>(null);
  const message = MESSAGES[status];

  useEffect(() => input.current?.focus(), []);
  // Move focus to the result so it is read out and visible above the keyboard.
  useEffect(() => {
    if (message) result.current?.focus();
  }, [status, message]);

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (status !== "checking") onCheck();
      }}
    >
      <p className="inline-flex items-center gap-2 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-burgundy" />
        Gallery {gallery}
      </p>
      <h1 className="font-display text-[2rem] font-semibold leading-[1.1]">Found it? Tell us what you found!</h1>
      <p id="text-answer-help" className="text-lg text-ink-soft">
        Enter the artwork’s name or its museum accession number. You can find the number on the artwork label.
      </p>
      <label htmlFor="text-answer" className="font-semibold">
        Artwork name or number
      </label>
      {/* No example answer: any example could be (or point to) a real answer. */}
      <input
        ref={input}
        id="text-answer"
        type="text"
        value={draft}
        onChange={(e) => onDraft(e.target.value)}
        aria-describedby="text-answer-help text-answer-result"
        aria-invalid={status === "no_match" || status === "blank" ? true : undefined}
        placeholder="Name or number from the label"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="go"
        maxLength={120}
        className="min-h-14 w-full rounded-2xl border-2 border-line bg-card px-4 text-lg text-ink placeholder:text-ink-soft/70 focus:border-ink focus:outline-none"
      />
      <p
        id="text-answer-result"
        ref={result}
        tabIndex={-1}
        role="status"
        className={message ? `rounded-2xl px-4 py-3 text-lg focus:outline-none ${status === "error" || status === "unchecked" ? "bg-paper-deep" : "bg-gold-soft/60"}` : "sr-only"}
      >
        {status === "checking" ? "Checking your answer…" : (message ?? "")}
      </p>
      <Button type="submit" disabled={status === "checking"} className="disabled:opacity-60">
        {status === "checking" ? "Checking…" : "Check answer"}
      </Button>
      <Button variant="secondary" onClick={onBack}>
        Back
      </Button>
      {/* A separate, clearly labelled path: a grown-up confirms instead of the label. */}
      <Button variant="quiet" className="mx-auto" onClick={onGrownUp}>
        Ask a grown-up to confirm instead
      </Button>
    </form>
  );
}
