"use client";

import { useEffect, useSyncExternalStore } from "react";
import { LEGACY_ADVENTURE_ID } from "@/adventures/registry";
import type { QuestReveal } from "@/adventures/types";
import type { ArtworkStatus, ArtworkStatusList } from "./artworks";

// The server's latest artwork check: the last one seen on this phone, then a
// fresh one whenever there is signal. Same pattern as src/lib/closures.ts.

const KEY = "met-hidden-treasures:artworks:v1";
const EMPTY: ArtworkStatusList = { checkedAt: null, artworks: [] };
let current = EMPTY;
let loaded = false;
let fetched = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = JSON.parse(raw) as ArtworkStatusList;
  } catch {
    // ignore
  }
}

async function refresh() {
  if (fetched) return;
  fetched = true;
  try {
    const res = await fetch("/api/artworks", { cache: "no-store" });
    if (!res.ok) return;
    const list = (await res.json()) as ArtworkStatusList;
    if (!list.checkedAt) {
      fetched = false; // the server is still checking; ask again next time
      return;
    }
    current = list;
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
    listeners.forEach((l) => l());
  } catch {
    fetched = false; // offline; try again next time a screen mounts
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const snapshot = () => {
  load();
  return current;
};

export function useArtworkStatus(): ArtworkStatusList {
  const list = useSyncExternalStore(subscribe, snapshot, () => EMPTY);
  useEffect(() => {
    refresh();
  }, []);
  return list;
}

/** Fills the Met link and Open Access image from the live check when the content file has none. */
export function withMetData(reveal: QuestReveal, status?: ArtworkStatus): QuestReveal {
  if (!status) return reveal;
  return {
    ...reveal,
    metObjectId: reveal.metObjectId ?? status.objectId,
    metObjectUrl: reveal.metObjectUrl ?? status.objectUrl,
    ...(!reveal.imageUrl && status.imageUrl ? { imageUrl: status.imageUrl, openAccess: true, imageAttribution: reveal.imageAttribution ?? "The Metropolitan Museum of Art, Open Access" } : {}),
  };
}

export const statusFor = (list: ArtworkStatusList, adventureId: string, questId: number) =>
  list.artworks.find((a) => (a.adventureId ?? LEGACY_ADVENTURE_ID) === adventureId && a.questId === questId);
