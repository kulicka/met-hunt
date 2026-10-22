"use client";

import { useEffect, useSyncExternalStore } from "react";
import { bundledClosures, type ClosureList, type ClosureOverride } from "@/data/closures";

// Latest closure list: bundled copy, then the last one seen on this phone, then
// a fresh one from the server whenever there is signal.

const KEY = "met-hidden-treasures:closures:v1";
let current: ClosureList = bundledClosures;
let loaded = false;
let fetched = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as ClosureList;
      if (saved.checkedAt >= current.checkedAt) current = saved;
    }
  } catch {
    // ignore
  }
}

async function refresh() {
  if (fetched) return;
  fetched = true;
  try {
    const res = await fetch("/api/closures", { cache: "no-store" });
    if (!res.ok) return;
    current = (await res.json()) as ClosureList;
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

export function useClosures(): ClosureOverride[] {
  const list = useSyncExternalStore(subscribe, snapshot, () => bundledClosures);
  useEffect(() => {
    refresh();
  }, []);
  return list.closures;
}

export const isGalleryClosed = (gallery: string, closures: ClosureOverride[]) =>
  closures.some((c) => c.galleryId === gallery && c.status === "closed");
