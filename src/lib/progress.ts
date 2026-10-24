"use client";

import { useSyncExternalStore } from "react";
import { adventures } from "@/adventures/registry";
import type { Adventure } from "@/adventures/types";
import {
  begin,
  endEarly,
  solveBonus,
  freshAdventure,
  parseAdventure,
  restart,
  solve,
  type AdventureState,
  type VerificationMethod,
} from "./adventure";
import { recheckClosures } from "./closures";
import { activeAdventure, contentFor } from "./content";
import { subscribeProfile } from "./profile";

// Local-only adventure progress, one record per adventure, so switching
// adventures never loses anything. Never holds photos, names, emails, or
// locations. The player profile (age, explorer, chosen adventure) is stored
// separately in profile.ts. Everything below acts on the chosen adventure.

export type { AdventureState, VerificationMethod } from "./adventure";

export const progressKey = (adventureId: string) => `met-hidden-treasures:adventure:v3:${adventureId}`;

/** Shown during server render, before localStorage can be read. */
export const initialProgress: AdventureState = freshAdventure(adventures[0].quests[0].id);

const states = new Map<string, AdventureState>();
const listeners = new Set<() => void>();
const observers = new Set<(adventureId: string, prev: AdventureState, next: AdventureState) => void>();


function write(adventureId: string, state: AdventureState) {
  try {
    window.localStorage.setItem(progressKey(adventureId), JSON.stringify(state));
  } catch {
    // Storage blocked (private mode) or full: progress lasts for this visit only.
  }
}

function parse(a: Adventure, raw: unknown) {
  const c = contentFor(a);
  return parseAdventure(raw, c.questIds, c.extraIds);
}

function load(a: Adventure): AdventureState {
  const known = states.get(a.id);
  if (known) return known;
  let state = freshAdventure(a.quests[0].id);
  if (typeof window === "undefined") return state;
  try {
    const raw = window.localStorage.getItem(progressKey(a.id));
    if (raw) {
      state = parse(a, JSON.parse(raw));
    } else {
      // A hunt saved before adventures were pluggable: copy it over once, and
      // leave the old record where it is so nothing is ever lost.
      const legacy = a.legacyProgressKeys?.map((k) => window.localStorage.getItem(k)).find((v) => v != null);
      if (legacy) {
        state = parse(a, JSON.parse(legacy));
        write(a.id, state);
      }
    }
  } catch {
    // Unreadable: start fresh for this visit.
  }
  states.set(a.id, state);
  return state;
}

/** Progress in the chosen adventure. */
export const getProgress = (): AdventureState => load(activeAdventure().adventure);

/** Progress in any adventure, e.g. for the adventure picker. */
export function getProgressFor(adventureId: string): AdventureState | undefined {
  const a = adventures.find((x) => x.id === adventureId);
  return a && load(a);
}

export function updateProgress(change: (p: AdventureState) => AdventureState) {
  const a = activeAdventure().adventure;
  const prev = load(a);
  const next = change(prev);
  if (next === prev) return;
  states.set(a.id, next);
  write(a.id, next);
  observers.forEach((o) => o(a.id, prev, next));
  listeners.forEach((l) => l());
}

/** Called with the adventure and the old and new state after every change (analytics derives its events from these). */
export function observeProgress(observer: (adventureId: string, prev: AdventureState, next: AdventureState) => void) {
  observers.add(observer);
  return () => observers.delete(observer);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Choosing another adventure changes which progress is current.
  const unsubscribeProfile = subscribeProfile(listener);
  return () => {
    listeners.delete(listener);
    unsubscribeProfile();
  };
}

export function useProgress(): AdventureState {
  return useSyncExternalStore(subscribe, getProgress, () => initialProgress);
}

const firstQuest = () => activeAdventure().questIds[0];

/** Start a new adventure or continue an ended one. */
export const startAdventure = () => {
  recheckClosures();
  updateProgress(begin);
};

/** The player is working on quest `id` (opened it, or picked it on the map). */
export const playQuest = (id: number) =>
  updateProgress((p) => {
    const started = begin(p);
    return started.currentQuest === id ? started : { ...started, currentQuest: id };
  });

export const endAdventure = () => updateProgress(endEarly);

/** Clears this adventure's hunt progress. Age, explorer, and other adventures are kept. */
export const restartAdventure = () => {
  recheckClosures();
  updateProgress(() => restart(firstQuest()));
};

export function completeQuest(id: number, method: VerificationMethod, nextQuest: number | null) {
  const adv = activeAdventure();
  updateProgress((p) => (adv.isBonus(id) ? solveBonus(p, id, method) : solve(p, id, method, nextQuest, adv.questIds)));
}

/** Test hook: forget what was read from storage. */
export const resetProgressCache = () => states.clear();
