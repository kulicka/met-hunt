"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Press-and-hold control that keeps young players from opening grown-up areas by accident. */
export function HoldButton({ seconds = 3, onComplete, children }: { seconds?: number; onComplete: () => void; children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const start = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  const stop = () => {
    start.current = null;
    if (frame.current) cancelAnimationFrame(frame.current);
    setProgress(0);
  };

  const tick = (now: number) => {
    if (start.current == null) return;
    const p = Math.min((now - start.current) / (seconds * 1000), 1);
    setProgress(p);
    if (p >= 1) {
      stop();
      onComplete();
    } else {
      frame.current = requestAnimationFrame(tick);
    }
  };

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  const begin = () => {
    start.current = performance.now();
    frame.current = requestAnimationFrame(tick);
  };

  return (
    <button
      type="button"
      className="relative min-h-14 w-full overflow-hidden rounded-xl border-2 border-ink bg-card px-5 font-semibold"
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      // Keyboard users: holding Space/Enter works the same way.
      onKeyDown={(e) => {
        if ((e.key === " " || e.key === "Enter") && start.current == null) {
          e.preventDefault();
          begin();
        }
      }}
      onKeyUp={stop}
      aria-label={`${typeof children === "string" ? children : "Hold"} (hold for ${seconds} seconds)`}
    >
      <span className="absolute inset-y-0 left-0 bg-gold-soft/60" style={{ width: `${progress * 100}%` }} aria-hidden />
      <span className="relative">{children}</span>
    </button>
  );
}
