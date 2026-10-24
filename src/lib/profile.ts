"use client";

import { useSyncExternalStore } from "react";
import { adventureIds } from "@/adventures/registry";
import { avatarById, avatars } from "@/data/avatars";
import { emptyProfile, parseProfile, type AgeChoice, type PlayerProfile } from "./adventure";

// The player's age choice, explorer and current adventure, kept on this phone only. There is no
// name field anywhere: the explorer's name comes from the built-in avatar list.

const KEY = "met-hidden-treasures:profile:v1";
const avatarIds = avatars.map((a) => a.id);

let current: PlayerProfile = emptyProfile;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) current = parseProfile(JSON.parse(raw), avatarIds, adventureIds);
  } catch {
    // Storage blocked or unreadable: onboarding shows again.
  }
}

function update(change: Partial<PlayerProfile>) {
  load();
  current = { ...current, ...change };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // ignore, see load()
  }
  listeners.forEach((l) => l());
}

export const getProfile = () => {
  load();
  return current;
};

export function subscribeProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** null during server render, when there is no localStorage to read yet. */
export function useProfile(): PlayerProfile | null {
  return useSyncExternalStore(subscribeProfile, getProfile, () => null);
}

export const setAge = (age: AgeChoice) => update({ age });
export const setAvatar = (avatarId: string) => update({ avatarId });
/** Switch adventures. Each one keeps its own progress, so nothing is lost. */
export const setAdventure = (adventureId: string) => update({ adventureId });
export const finishOnboarding = () => update({ onboardingComplete: true });

/** The current explorer, or the first one if none is chosen yet. */
export function useAvatar() {
  const profile = useProfile();
  return avatarById(profile?.avatarId);
}
