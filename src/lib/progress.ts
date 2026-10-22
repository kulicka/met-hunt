"use client";

import { useSyncExternalStore } from "react";

// Local-only progress. Never holds photos, names, emails, or locations.

export type VerificationMethod = "ai-photo" | "grown-up" | "manual";

export interface GameProgress {
  gameStarted: boolean;
  currentQuest: number;
  completedQuests: number[];
  hintsUsed: Record<number, number>;
  /** Photo checks per quest that came back unsure or failed to connect. */
  attempts: Record<number, number>;
  verificationMethod: Record<number, VerificationMethod>;
}

const KEY = "met-hidden-treasures:progress:v1";

export const initialProgress: GameProgress = {
  gameStarted: false,
  currentQuest: 1,
  completedQuests: [],
  hintsUsed: {},
  attempts: {},
  verificationMethod: {},
};

let current: GameProgress = initialProgress;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = { ...initialProgress, ...JSON.parse(raw) };
  } catch {
    // Storage blocked (private mode): progress lasts for this visit only.
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // ignore, see load()
  }
}

export function getProgress(): GameProgress {
  load();
  return current;
}

export function updateProgress(change: (p: GameProgress) => GameProgress) {
  load();
  current = change(current);
  persist();
  listeners.forEach((l) => l());
}

export function resetProgress() {
  current = initialProgress;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress(): GameProgress {
  return useSyncExternalStore(subscribe, getProgress, () => initialProgress);
}

export function completeQuest(id: number, method: VerificationMethod, nextQuest: number | null) {
  updateProgress((p) => ({
    ...p,
    gameStarted: true,
    completedQuests: p.completedQuests.includes(id) ? p.completedQuests : [...p.completedQuests, id],
    verificationMethod: { ...p.verificationMethod, [id]: method },
    currentQuest: nextQuest ?? p.currentQuest,
  }));
}
