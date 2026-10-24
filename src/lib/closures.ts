"use client";

import { useEffect, useSyncExternalStore } from "react";
import { bundledClosures, type ClosureList, type ClosureOverride } from "@/data/closures";

// Latest closure list: bundled copy, then the last one seen on this phone, then
// a fresh one from the server whenever there is signal. Starting or restarting a
// hunt asks again (recheckClosures), so the server rereads The Met's page if its
// copy is more than a few minutes old.

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

async function refresh(fresh = false) {
  if (fetched && !fresh) return;
  fetched = true;
  try {
    const res = await fetch(fresh ? "/api/closures?fresh=1" : "/api/closures", { cache: "no-store" });
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

/** Asks the server for a new check of The Met's closures page; called when a hunt starts or restarts. */
let lastRecheck = 0;
export const recheckClosures = () => {
  // Restart then the picker both ask; one request covers both.
  if (Date.now() - lastRecheck < 30_000) return;
  lastRecheck = Date.now();
  refresh(true);
};

export function useClosureList(): ClosureList {
  const list = useSyncExternalStore(subscribe, snapshot, () => bundledClosures);
  useEffect(() => {
    refresh();
  }, []);
  return list;
}

export const useClosures = (): ClosureOverride[] => useClosureList().closures;

/** "Oct 24, 2026, 3:40 PM" for a full timestamp, "Oct 23, 2026" for a date-only one. */
export function formatCheckedAt(checkedAt: string): string | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(checkedAt);
  const d = new Date(dateOnly ? `${checkedAt}T12:00:00` : checkedAt);
  if (Number.isNaN(d.getTime())) return null;
  return dateOnly ? d.toLocaleDateString([], { dateStyle: "medium" }) : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

/** Which closure list is in use, as a short token for analytics (its checkedAt date). */
export const closureVersion = () => {
  load();
  return current.checkedAt.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 40) || "unknown";
};

export const isGalleryClosed = (gallery: string, closures: ClosureOverride[]) =>
  closures.some((c) => c.galleryId === gallery && c.status === "closed");
