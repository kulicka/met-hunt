"use client";

import { useSyncExternalStore } from "react";
import { hiddenTreasuresPack } from "@/data/hidden-treasures/pack";
import {
  begin,
  endEarly,
  freshAdventure,
  parseAdventure,
  restart,
  solve,
  type AdventureState,
  type VerificationMethod,
} from "./adventure";

// Local-only adventure progress. Never holds photos, names, emails, or locations.
// The player profile (age, explorer) is stored separately in profile.ts.

export type { AdventureState, VerificationMethod } from "./adventure";

const KEY = "met-hidden-treasures:adventure:v2";
const LEGACY_KEY = "met-hidden-treasures:progress:v1";
const questIds = hiddenTreasuresPack.questIds;
const firstQuest = questIds[0];

export const initialProgress: AdventureState = freshAdventure(firstQuest);

let current: AdventureState = initialProgress;
let loaded = false;
const listeners = new Set<() => void>();
const observers = new Set<(prev: AdventureState, next: AdventureState) => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (raw) current = parseAdventure(JSON.parse(raw), questIds);
  } catch {
    // Storage blocked (private mode) or unreadable: start fresh for this visit.
  }
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // ignore, see load()
  }
}

export function getProgress(): AdventureState {
  load();
  return current;
}

export function updateProgress(change: (p: AdventureState) => AdventureState) {
  load();
  const next = change(current);
  if (next === current) return;
  const prev = current;
  current = next;
  persist();
  observers.forEach((o) => o(prev, next));
  listeners.forEach((l) => l());
}

/** Called with the old and new state after every change (analytics derives its events from these). */
export function observeProgress(observer: (prev: AdventureState, next: AdventureState) => void) {
  observers.add(observer);
  return () => observers.delete(observer);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress(): AdventureState {
  return useSyncExternalStore(subscribe, getProgress, () => initialProgress);
}

/** Start a new adventure or continue an ended one. */
export const startAdventure = () => updateProgress(begin);

/** The player is working on quest `id` (opened it, or picked it on the map). */
export const playQuest = (id: number) =>
  updateProgress((p) => {
    const started = begin(p);
    return started.currentQuest === id ? started : { ...started, currentQuest: id };
  });

export const endAdventure = () => updateProgress(endEarly);

/** Clears all hunt progress. Age and explorer are kept. */
export const restartAdventure = () => updateProgress(() => restart(firstQuest));

export function completeQuest(id: number, method: VerificationMethod, nextQuest: number | null) {
  updateProgress((p) => solve(p, id, method, nextQuest, questIds));
}
