"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { questRating, rateQuest, useAnalyticsOn, type QuestRating, type RatingAnswer, type RatingQuestion } from "@/lib/analytics/client";

// "Detective's report": a quick, optional rating after a mystery is found or skipped.
// Kids tap a picture; there is nothing to type. Shown only when a grown-up has turned
// analytics on, because that's the only place the answers go. The pictures are faces
// and magnifying glasses, never anything from a riddle or artwork.

type Option = { answer: RatingAnswer; label: string; art: ReactNode };

/** A round face drawn in the storybook line style: flat, smiling, or grinning. */
function Face({ mood }: { mood: RatingAnswer }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 40 40" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="16.5" />
      <circle cx="14" cy="16.5" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="26" cy="16.5" r="1.9" fill="currentColor" stroke="none" />
      {mood === 1 && <path d="M13.5 26.5 H 26.5" />}
      {mood === 2 && <path d="M13 24.5 C 16 28.5, 24 28.5, 27 24.5" />}
      {mood === 3 && <path d="M11.5 23 C 12.5 31, 27.5 31, 28.5 23 Z" fill="currentColor" fillOpacity="0.2" />}
    </svg>
  );
}

/** One, two or three magnifying glasses: how much searching it took. */
function Glasses({ n }: { n: RatingAnswer }) {
  return (
    <span aria-hidden className="flex h-9 items-center justify-center">
      {Array.from({ length: n }, (_, i) => (
        <Search key={i} size={n === 3 ? 20 : 24} strokeWidth={2.6} />
      ))}
    </span>
  );
}

const QUESTIONS: { question: RatingQuestion; prompt: string; options: Option[] }[] = [
  {
    question: "fun",
    prompt: "How fun was this mystery?",
    options: [
      { answer: 1, label: "Meh", art: <Face mood={1} /> },
      { answer: 2, label: "Fun", art: <Face mood={2} /> },
      { answer: 3, label: "Super fun!", art: <Face mood={3} /> },
    ],
  },
  {
    question: "difficulty",
    prompt: "How hard was it to find?",
    options: [
      { answer: 1, label: "Easy", art: <Glasses n={1} /> },
      { answer: 2, label: "Just right", art: <Glasses n={2} /> },
      { answer: 3, label: "Super hard", art: <Glasses n={3} /> },
    ],
  },
];

export function RatePuzzle({ questId, after }: { questId: number; after: "found" | "skipped" }) {
  const on = useAnalyticsOn();
  const [picked, setPicked] = useState<QuestRating>(() => questRating(questId));
  if (!on) return null;
  const done = QUESTIONS.every((q) => picked[q.question]);

  const pick = (question: RatingQuestion, answer: RatingAnswer) => {
    rateQuest(questId, question, answer, after);
    setPicked((p) => ({ ...p, [question]: answer }));
  };

  return (
    <section aria-labelledby={`rate-${questId}`} className="rounded-3xl border-[1.5px] border-dashed border-ink-soft/40 bg-card/70 px-4 pb-4 pt-3 text-left">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id={`rate-${questId}`} className="whitespace-nowrap font-hand text-lg font-bold min-[360px]:text-xl">
          Detective’s report
        </h2>
        <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Optional</span>
      </div>
      {QUESTIONS.map(({ question, prompt, options }) => (
        <fieldset key={question} className="mt-3">
          <legend className="font-semibold">{prompt}</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {options.map((o) => {
              const selected = picked[question] === o.answer;
              return (
                <button
                  key={o.answer}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => pick(question, o.answer)}
                  className={`flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-sm font-semibold leading-tight transition active:scale-[0.97] ${
                    selected
                      ? "border-action bg-action text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)]"
                      : "border-line bg-card text-ink hover:border-ink/40"
                  }`}
                >
                  {o.art}
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <p className="mt-3 min-h-6 text-ink-soft" role="status">
        {done ? "Thanks, detective! Your report helps us make better mysteries." : "Tap a picture, or carry on."}
      </p>
    </section>
  );
}
