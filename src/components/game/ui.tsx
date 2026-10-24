"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useAdventure } from "@/lib/content";

type Variant = "primary" | "secondary" | "quiet";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_8px_20px_-10px_rgb(13_13_16/0.6)] hover:bg-[#25252b] active:scale-[0.98]",
  secondary: "border border-line bg-card text-ink shadow-[0_1px_2px_rgb(13_13_16/0.05)] hover:border-ink/40 active:scale-[0.98]",
  quiet: "text-ink-soft underline underline-offset-4 decoration-ink/20 hover:text-ink hover:decoration-ink/60",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const size = variant === "quiet" ? "min-h-11 px-2 text-base" : "min-h-14 w-full px-6 text-base font-semibold tracking-[0.01em]";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full transition duration-150 ${size} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-10 pt-6 ${className}`}>{children}</main>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-[13px] font-medium uppercase tracking-[0.14em] text-ink-soft">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-burgundy" />
      {children}
    </p>
  );
}

export function Title({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-display text-4xl font-semibold leading-[1.05] text-ink ${className}`}>{children}</h1>;
}

/** One position per mystery. State is shown by shape and text, not color alone. */
export function ProgressDots({ completed, current }: { completed: number[]; current?: number }) {
  const { questIds } = useAdventure();
  const solved = completed.length;
  return (
    <div className="flex flex-col gap-1">
      <ol className="flex flex-wrap gap-1.5" aria-label={`${solved} of ${questIds.length} mysteries solved`}>
        {questIds.map((id, i) => {
          const state = completed.includes(id) ? "found" : id === current ? "current" : "upcoming";
          const label = { found: "solved", current: "current mystery", upcoming: "not yet solved" }[state];
          return (
            <li key={id} aria-label={`Mystery ${i + 1}: ${label}`} className="flex h-6 w-6 items-center justify-center">
              {state === "found" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">✓</span>
              )}
              {state === "current" && <span className="h-4 w-4 rounded-full bg-burgundy ring-4 ring-burgundy/20" />}
              {state === "upcoming" && <span className="h-3 w-3 rounded-full border-[1.5px] border-ink-soft/70" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-line bg-card p-6 shadow-[0_1px_2px_rgb(13_13_16/0.04),0_16px_40px_-24px_rgb(13_13_16/0.25)] ${className}`}>
      {children}
    </div>
  );
}
