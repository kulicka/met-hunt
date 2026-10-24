"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronRight, Lightbulb } from "lucide-react";

// Two progressive hints per quest behind a magnifying glass. Revealed hints are
// saved (hintsUsed), stay readable on every visit, and never affect rewards.

export function MagnifierHints({ hints, used, onReveal }: { hints: [string, string]; used: number; onReveal: () => void }) {
  const reduce = useReducedMotion();
  const total = hints.length;
  const shown = Math.min(Math.max(used, 0), total);
  // After both are out the button only shows or hides them; until then they stay in view.
  const [open, setOpen] = useState(shown < total);
  const [fresh, setFresh] = useState<number | null>(null);
  const done = shown >= total;
  const panelId = "magnifier-hints";

  const press = () => {
    if (done) return setOpen((o) => !o);
    setFresh(shown);
    setOpen(true);
    onReveal();
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={press}
        aria-controls={panelId}
        aria-expanded={done ? open : undefined}
        className="flex min-h-16 w-full items-center gap-3 rounded-[1.75rem] border border-gold/50 bg-card/85 px-4 py-2 text-left text-base font-semibold tracking-[0.01em] text-ink shadow-[0_1px_2px_rgb(13_13_16/0.05)] hover:border-gold active:scale-[0.98] transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
      >
        <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--badge)] text-ink">
          <Lightbulb size={22} strokeWidth={2.2} />
        </span>
        {done ? <span className="flex-1">{open ? "Hide my clues" : "See my clues again"}</span> : (
          <span className="flex flex-1 flex-col items-start leading-tight">
            <span>Need a clue?</span>
            <span className="text-sm font-normal text-ink-soft">Hint {shown + 1} of {total}</span>
          </span>
        )}
        {done && open ? <ChevronDown aria-hidden size={22} className="shrink-0 text-ink-soft" /> : <ChevronRight aria-hidden size={22} className="shrink-0 text-ink-soft" />}
      </button>

      <div id={panelId} aria-live="polite" hidden={!open || shown === 0}>
        <ol className="flex flex-col gap-2">
          {hints.slice(0, shown).map((h, i) => (
            <motion.li
              key={i}
              className="rounded-3xl border border-dashed border-gold/50 bg-[#fff8e6] p-5 text-lg"
              initial={!reduce && fresh === i ? { clipPath: "circle(0% at 12% 50%)", opacity: 0.4 } : false}
              animate={{ clipPath: "circle(150% at 12% 50%)", opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <span className="block font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-gold">Hint {i + 1} of {total}</span>
              {h}
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
