"use client";

import { useSyncExternalStore } from "react";
import { avatarById, avatars } from "@/data/avatars";
import { emptyProfile, parseProfile, type AgeChoice, type PlayerProfile } from "./adventure";

// The player's age choice and explorer, kept on this phone only. There is no
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
    if (raw) current = parseProfile(JSON.parse(raw), avatarIds);
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

const getProfile = () => {
  load();
  return current;
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** null during server render, when there is no localStorage to read yet. */
export function useProfile(): PlayerProfile | null {
  return useSyncExternalStore(subscribe, getProfile, () => null);
}

export const setAge = (age: AgeChoice) => update({ age });
export const setAvatar = (avatarId: string) => update({ avatarId });
export const finishOnboarding = () => update({ onboardingComplete: true });

/** The current explorer, or the first one if none is chosen yet. */
export function useAvatar() {
  const profile = useProfile();
  return avatarById(profile?.avatarId);
}
