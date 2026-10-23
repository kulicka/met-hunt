// Active engagement time (analytics spec, section 6). Time counts only while the
// page is visible, and only up to IDLE_MS after the last touch, key press or
// scroll: a phone left on a bench, or a locked screen, adds nothing. The first
// 90 seconds of stillness do count, because a child studying a painting is
// engaged without touching the phone.

export const IDLE_MS = 90_000;

export interface ClockState {
  activeMs: number;
  /** Last time active time was added up to. */
  lastTick: number;
  lastActivity: number;
  visible: boolean;
}

export const startClock = (now: number, activeMs = 0, visible = true): ClockState => ({
  activeMs,
  lastTick: now,
  lastActivity: now,
  visible,
});

/** Adds the active time since the last tick. */
export function tick(c: ClockState, now: number): ClockState {
  if (!c.visible) return { ...c, lastTick: now };
  const end = Math.min(now, c.lastActivity + IDLE_MS);
  return { ...c, activeMs: c.activeMs + Math.max(0, end - c.lastTick), lastTick: now };
}

export const activity = (c: ClockState, now: number): ClockState => ({ ...tick(c, now), lastActivity: now });

export function setVisible(c: ClockState, visible: boolean, now: number): ClockState {
  const ticked = tick(c, now);
  return visible ? { ...ticked, visible, lastActivity: now } : { ...ticked, visible };
}
