"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { pack } from "@/lib/content";

type Variant = "primary" | "secondary" | "quiet";

const variants: Record<Variant, string> = {
  primary:
    "bg-burgundy text-white shadow-[0_2px_0_var(--burgundy-deep)] hover:bg-burgundy-deep active:translate-y-px",
  secondary: "border-2 border-ink bg-card text-ink hover:bg-paper-deep",
  quiet: "text-ink-soft underline underline-offset-4 decoration-line hover:text-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const size = variant === "quiet" ? "min-h-11 px-2 text-base" : "min-h-14 w-full px-5 text-base font-semibold tracking-wide";
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition ${size} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <main className={`mx-auto flex w-full max-w-md flex-col gap-5 px-5 pb-10 pt-6 ${className}`}>{children}</main>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-soft">{children}</p>;
}

export function Title({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-serif text-4xl font-bold leading-tight text-ink ${className}`}>{children}</h1>;
}

/** Ten-position progress indicator. State is shown by shape and text, not color alone. */
export function ProgressDots({ completed, current }: { completed: number[]; current?: number }) {
  const solved = completed.length;
  return (
    <div className="flex flex-col gap-1">
      <ol className="flex gap-1.5" aria-label={`${solved} of ${pack.questIds.length} mysteries solved`}>
        {pack.questIds.map((id, i) => {
          const state = completed.includes(id) ? "found" : id === current ? "current" : "upcoming";
          const label = { found: "solved", current: "current mystery", upcoming: "not yet solved" }[state];
          return (
            <li key={id} aria-label={`Mystery ${i + 1}: ${label}`} className="flex h-6 w-6 items-center justify-center">
              {state === "found" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">✓</span>
              )}
              {state === "current" && <span className="h-4 w-4 rounded-full bg-burgundy ring-2 ring-burgundy/30 ring-offset-2 ring-offset-paper" />}
              {state === "upcoming" && <span className="h-3.5 w-3.5 rounded-full border-2 border-ink-soft" />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-5 shadow-[0_1px_0_var(--line),0_10px_30px_-18px_rgb(35_32_28/0.35)] ${className}`}>
      {children}
    </div>
  );
}
