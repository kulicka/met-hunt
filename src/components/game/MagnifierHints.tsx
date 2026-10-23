"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";

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
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border-2 border-gold bg-card px-4 text-base font-semibold tracking-wide text-ink hover:bg-paper-deep focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
      >
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-gold">
          <Search size={22} strokeWidth={2.5} />
        </span>
        {done ? (open ? "HIDE HINTS" : "REVIEW HINTS") : (
          <span className="flex flex-col items-start leading-tight">
            <span>MAGNIFYING GLASS — GET A HINT</span>
            <span className="text-sm font-normal text-ink-soft">Hint {shown + 1} of {total}</span>
          </span>
        )}
      </button>

      <div id={panelId} aria-live="polite" hidden={!open || shown === 0}>
        <ol className="flex flex-col gap-2">
          {hints.slice(0, shown).map((h, i) => (
            <motion.li
              key={i}
              className="rounded-xl border border-dashed border-gold/70 bg-gold/5 p-4 text-lg"
              initial={!reduce && fresh === i ? { clipPath: "circle(0% at 12% 50%)", opacity: 0.4 } : false}
              animate={{ clipPath: "circle(150% at 12% 50%)", opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            >
              <span className="block text-sm font-semibold uppercase tracking-widest text-gold">Hint {i + 1} of {total}</span>
              {h}
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}
