"use client";

import type { ReactNode } from "react";
import { Camera, ChevronRight, FastForward, PenLine } from "lucide-react";
import type { Adventure } from "@/adventures/types";

// The illustrated ("storybook") pieces of the quest screen. All art is hand-built SVG.
// Decoration must never picture an answer: no scarabs, ankhs, birds, cats, lions,
// cobras, eyes, stars, crowns or mirrors for the Egyptian Adventure, and no fans, flowers,
// books, vases, horses, elephants, people, church towers or monocles for European Paintings.

export type Theme = Adventure["theme"];

/** Small four-point sparkle (not for the Egyptian Adventure: stars are an answer there). */
export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24" className={`pointer-events-none absolute text-gold/70 ${className}`} fill="currentColor">
      <path d="M12 1.5 C12.9 8 16 11.1 22.5 12 C16 12.9 12.9 16 12 22.5 C11.1 16 8 12.9 1.5 12 C8 11.1 11.1 8 12 1.5 Z" />
    </svg>
  );
}

/**
 * Three soft glints of light. The Egyptian card uses these instead of sparkles,
 * because stars are an answer there (Gallery 112).
 */
function Glints({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 24" className={`pointer-events-none absolute text-gold/60 ${className}`} fill="currentColor">
      <circle cx="6" cy="16" r="2.4" />
      <circle cx="15" cy="7" r="1.8" />
      <circle cx="19" cy="18" r="1.3" />
    </svg>
  );
}

/** A detective's magnifying glass, tilted. */
function Magnifier({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 64 64" className={`pointer-events-none absolute text-gold ${className}`} fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="26" cy="26" r="17" strokeWidth="4" opacity="0.7" />
      <circle cx="26" cy="26" r="13" fill="#fff" fillOpacity="0.35" stroke="none" />
      <path d="M17 20 C19 16, 23 14, 27 14" strokeWidth="2.5" opacity="0.45" />
      <path d="M38.5 38.5 L 56 56" strokeWidth="7" opacity="0.75" />
    </svg>
  );
}

/** A dotted trail that wanders down the card's right side. */
function Trail({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 40 200" preserveAspectRatio="none" className={`pointer-events-none absolute text-gold/50 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round">
      <path vectorEffect="non-scaling-stroke" d="M28 2 C 40 40, 10 60, 22 100 S 36 160, 12 198" />
    </svg>
  );
}

// Deterministic wobble so the torn papyrus edge looks the same on every visit.
function wobble(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** A torn-edge papyrus outline in a 100 x 100 box, stretched to the card. */
const PAPYRUS = (() => {
  const pts: string[] = [];
  const steps = 24;
  const edge = (i: number) => 0.6 + wobble(i) * 1.4;
  for (let i = 0; i <= steps; i++) pts.push(`${((100 * i) / steps).toFixed(1)},${edge(i).toFixed(2)}`);
  for (let i = 1; i <= steps; i++) pts.push(`${(100 - edge(i + 40)).toFixed(2)},${((100 * i) / steps).toFixed(1)}`);
  for (let i = steps - 1; i >= 0; i--) pts.push(`${((100 * i) / steps).toFixed(1)},${(100 - edge(i + 80)).toFixed(2)}`);
  for (let i = steps - 1; i >= 1; i--) pts.push(`${edge(i + 120).toFixed(2)},${((100 * i) / steps).toFixed(1)}`);
  return `M${pts.join(" L")} Z`;
})();

function PapyrusSheet() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_14px_22px_rgb(43_29_18/0.18)]">
      <path d={PAPYRUS} fill="var(--parchment)" stroke="var(--parchment-edge)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      {/* papyrus fibres */}
      <g stroke="var(--parchment-edge)" strokeWidth="0.8" vectorEffect="non-scaling-stroke" opacity="0.35">
        <path d="M4 22 H 96" vectorEffect="non-scaling-stroke" />
        <path d="M4 48 H 96" vectorEffect="non-scaling-stroke" />
        <path d="M4 74 H 96" vectorEffect="non-scaling-stroke" />
        <path d="M14 4 V 96" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}

/**
 * Hieroglyph-style letters down the papyrus's left margin: sun, water, reed leaf,
 * bread loaf, twisted flax, lotus. Sounds and plants only, never an answer.
 */
function GlyphStrip() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 28 236" className="pointer-events-none absolute left-2 top-6 h-[calc(100%-3rem)] max-h-64 w-6 text-gold/55" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* sun disk */}
      <circle cx="14" cy="14" r="7" />
      <circle cx="14" cy="14" r="2" fill="currentColor" stroke="none" />
      <path d="M2 34 H 26" opacity="0.5" />
      {/* water */}
      <path d="M3 48 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3" />
      <path d="M3 56 l3 -3 l3 3 l3 -3 l3 3 l3 -3 l3 3 l3 -3" />
      <path d="M2 70 H 26" opacity="0.5" />
      {/* reed leaf */}
      <path d="M12 104 C 8 94, 9 84, 16 76 C 18 86, 17 96, 12 104 Z" />
      <path d="M12 104 V 108" />
      <path d="M2 118 H 26" opacity="0.5" />
      {/* bread loaf */}
      <path d="M5 138 C 6 128, 22 128, 23 138 Z" />
      <path d="M2 150 H 26" opacity="0.5" />
      {/* twisted flax */}
      <path d="M14 160 C 6 166, 22 172, 14 178 C 6 184, 22 190, 14 196" />
      <path d="M2 206 H 26" opacity="0.5" />
      {/* lotus */}
      <path d="M14 232 V 222 M14 222 C 10 218, 8 214, 9 210 C 12 212, 14 216, 14 222 C 14 216, 16 212, 19 210 C 20 214, 18 218, 14 222 Z" />
    </svg>
  );
}

/** A painter's palette and brush: tools of the trade, not anything in the paintings. */
function PainterPalette({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 64 64" className={`pointer-events-none absolute ${className}`}>
      <path
        d="M32 8 C 48 8, 60 18, 58 32 C 57 40, 50 40, 46 38 C 41 36, 38 41, 41 46 C 44 52, 38 58, 30 57 C 16 56, 6 46, 7 32 C 8 18, 18 8, 32 8 Z"
        fill="var(--gold-soft)"
        stroke="var(--gold)"
        strokeWidth="2"
        opacity="0.9"
      />
      <circle cx="21" cy="24" r="4.5" fill="#c0392b" opacity="0.75" />
      <circle cx="33" cy="18" r="4.5" fill="#2f6fb3" opacity="0.75" />
      <circle cx="45" cy="24" r="4" fill="#e3b437" opacity="0.85" />
      <circle cx="18" cy="38" r="4.5" fill="#3f8f5a" opacity="0.75" />
      <path d="M26 50 L 54 6" stroke="var(--gold)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M54 6 L 58 1" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/** A gilded rosette for the frame's corners. */
function Rosette({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 20 20" className={`pointer-events-none absolute h-5 w-5 ${className}`}>
      <circle cx="10" cy="10" r="8.5" fill="#e9c766" stroke="#8a6414" strokeWidth="1.2" />
      <circle cx="10" cy="10" r="4" fill="#f7e2a0" stroke="#8a6414" strokeWidth="1" />
    </svg>
  );
}

/** Gold brush-stroke label, like a swipe of paint behind the words. */
export function BrushBadge({ children }: { children: ReactNode }) {
  return (
    <p className="relative inline-flex items-center px-6 py-1.5 font-mono text-[13px] font-bold uppercase tracking-[0.16em] text-ink">
      <svg aria-hidden focusable="false" viewBox="0 0 120 32" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M5 7 C 30 3, 70 5, 116 3 C 119 10, 117 22, 118 28 C 80 30, 40 27, 3 29 C 1 22, 3 12, 5 7 Z" fill="var(--badge)" />
        <path d="M2 10 C 1 9, 3 6, 6 6 M114 27 C 117 28, 119 26, 119 24" stroke="var(--badge)" strokeWidth="2" fill="none" />
      </svg>
      <span className="relative">{children}</span>
    </p>
  );
}

/** The card's backdrop and decoration for each look. Text sits on top, in normal flow. */
export function CardArt({ theme }: { theme: Theme }) {
  if (theme === "egyptian")
    return (
      <>
        <PapyrusSheet />
        <GlyphStrip />
        <Magnifier className="-right-1 -top-2 h-14 w-14 min-[380px]:h-16 min-[380px]:w-16" />
        <Trail className="-bottom-1 right-1.5 h-[28%] w-5" />
        <Glints className="bottom-1.5 right-7 h-6 w-6" />
      </>
    );
  if (theme === "paintings")
    return (
      <>
        {/* a gilded frame: outer moulding, then a thin inner bead */}
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[10px] border-[9px] border-[#c79a3a] shadow-[inset_0_0_0_1px_#8a6414,0_14px_26px_-12px_rgb(30_27_36/0.35)] [border-image:linear-gradient(135deg,#f3d27a,#b9862c_35%,#f0cf73_55%,#9c6e1e)_1]" />
        <span aria-hidden className="pointer-events-none absolute inset-[9px] border border-[#8a6414]/40 shadow-[inset_0_2px_8px_rgb(138_100_20/0.18)]" />
        <Rosette className="left-0.5 top-0.5" />
        <Rosette className="right-0.5 top-0.5" />
        <Rosette className="bottom-0.5 right-0.5" />
        <Rosette className="bottom-0.5 left-0.5" />
        <PainterPalette className="-top-5 right-7 h-14 w-14 min-[380px]:h-16 min-[380px]:w-16" />
        <Sparkle className="bottom-6 right-6 h-5 w-5" />
        <Sparkle className="bottom-12 left-5 h-4 w-4" />
      </>
    );
  return null;
}

/** A little scene at the top right of the quest header, behind the gallery number. */
export function HeaderArt({ theme }: { theme: Theme }) {
  if (theme === "egyptian")
    return (
      <svg aria-hidden focusable="false" viewBox="0 0 160 80" className="pointer-events-none absolute -right-2 -top-2 -z-10 h-24 w-48 opacity-60">
        <path d="M24 74 L 70 22 L 116 74 Z" fill="#ead6a6" />
        <path d="M70 22 L 116 74 L 78 74 Z" fill="#dcc08a" />
        <path d="M98 74 L 118 50 L 138 74 Z" fill="#e6cf9c" />
        <path d="M118 50 L 138 74 L 122 74 Z" fill="#d6b97f" />
        <path d="M0 76 C 40 70, 100 72, 160 74" stroke="#d2b47a" strokeWidth="1.5" fill="none" />
        <g stroke="#b8955a" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M146 74 C 147 62, 146 52, 148 42" />
          <path d="M148 42 C 141 38, 135 39, 131 44 M148 42 C 155 36, 162 38, 165 43 M148 42 C 145 34, 139 32, 134 33 M148 42 C 152 33, 158 31, 162 33" />
        </g>
      </svg>
    );
  if (theme === "paintings")
    return (
      <svg aria-hidden focusable="false" viewBox="0 0 160 80" className="pointer-events-none absolute -right-2 -top-2 -z-10 h-20 w-40 opacity-40">
        {/* empty gilded frames on a gallery wall */}
        <rect x="58" y="10" width="44" height="34" rx="2" fill="#f4ead2" stroke="#c79a3a" strokeWidth="4" />
        <rect x="112" y="18" width="28" height="36" rx="2" fill="#f4ead2" stroke="#c79a3a" strokeWidth="3.5" />
        <rect x="22" y="22" width="26" height="22" rx="2" fill="#f4ead2" stroke="#c79a3a" strokeWidth="3" />
        <path d="M0 74 H 160" stroke="#d8ccb4" strokeWidth="2" />
      </svg>
    );
  return null;
}

/** The gallery pin beside "Gallery 111". */
export function MapPin() {
  return (
    <svg aria-hidden focusable="false" viewBox="0 0 24 32" className="h-[0.8em] w-[0.6em] shrink-0 drop-shadow-[0_2px_2px_rgb(0_0_0/0.15)]">
      <path d="M12 1 C 5.9 1, 1 5.8, 1 11.8 C 1 19.6, 12 31, 12 31 C 12 31, 23 19.6, 23 11.8 C 23 5.8, 18.1 1, 12 1 Z" fill="var(--burgundy)" />
      <circle cx="12" cy="11.5" r="4.2" fill="#fff" opacity="0.92" />
    </svg>
  );
}

/** I FOUND IT!: the big call to action, with a camera that bursts like a flash. */
export function FoundItButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex min-h-[5.5rem] w-full items-center gap-3 rounded-[2rem] bg-action px-4 text-white shadow-[inset_0_2px_0_rgb(255_255_255/0.2),inset_0_-5px_0_rgb(0_0_0/0.18),0_12px_24px_-12px_rgb(13_13_16/0.6)] transition duration-150 hover:bg-action-hover active:scale-[0.98] min-[360px]:px-5"
    >
      <span aria-hidden className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full text-[#ffd76a]" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M4 28 H 1 M28 4 V 1 M10 10 L 7 7 M46 10 L 49 7 M10 46 L 7 49 M46 46 L 49 49 M52 28 H 55" />
        </svg>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink shadow-[0_2px_0_rgb(0_0_0/0.2)]">
          <Camera size={26} strokeWidth={2.4} />
        </span>
      </span>
      <span className="flex flex-1 flex-col items-center leading-none">
        <span className="whitespace-nowrap font-hand text-[1.3rem] font-bold min-[360px]:text-[1.6rem]">I FOUND IT!</span>
        <span className="mt-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.22em] text-white/90">Take a photo</span>
      </span>
      <ChevronRight aria-hidden size={28} strokeWidth={2.5} className="shrink-0 transition group-hover:translate-x-0.5" />
    </button>
  );
}

/** Continue without a photo: as easy to find as the photo, but quieter. */
export function NoPhotoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-[1.75rem] border border-line bg-card/85 px-4 py-2.5 text-left shadow-[0_1px_2px_rgb(13_13_16/0.05)] transition hover:border-ink/40 active:scale-[0.98]"
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-deep text-ink">
        <PenLine size={20} strokeWidth={2.2} />
      </span>
      <span className="flex flex-1 flex-col leading-tight">
        <span className="font-semibold">Continue without a photo</span>
        <span className="text-sm text-ink-soft">Enter the artwork name or number instead</span>
      </span>
      <ChevronRight aria-hidden size={22} className="shrink-0 text-ink-soft" />
    </button>
  );
}

/** Can't find it? A dashed card that skips ahead; nothing is lost. */
export function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto flex min-h-14 items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-ink-soft/40 bg-card/40 px-4 py-2 text-left transition hover:border-ink-soft active:scale-[0.98]"
    >
      <FastForward aria-hidden size={20} strokeWidth={2.4} className="shrink-0 fill-current text-ink" />
      <span className="flex flex-col leading-tight">
        <span className="text-sm text-ink-soft">Can’t find it?</span>
        <span className="font-semibold">Skip this one for now</span>
      </span>
      <ChevronRight aria-hidden size={18} className="shrink-0 text-ink-soft" />
    </button>
  );
}
