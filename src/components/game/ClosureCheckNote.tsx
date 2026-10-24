"use client";

import type { ClosureList } from "@/data/closures";
import { formatCheckedAt } from "@/lib/closures";

// Where the closure list came from and when, in plain words. The server reads The
// Met's closures page on start, every few hours, and when a hunt starts or restarts.
export function ClosureCheckNote({ list, short = false }: { list: ClosureList; short?: boolean }) {
  const when = formatCheckedAt(list.checkedAt);
  if (list.source === "met-page") {
    return short ? (
      <>Checked automatically{when && `, ${when}`}.</>
    ) : (
      <>
        Closures are checked automatically on The Met’s gallery closures page when a hunt starts or restarts, and every
        few hours in between.{when && ` Last checked ${when}.`}
      </>
    );
  }
  // A manual override or the app's saved list: say so, rather than claim a live check.
  return short ? (
    <>From the app’s saved list{when && `, ${when}`}.</>
  ) : (
    <>
      The app checks The Met’s gallery closures page automatically, but couldn’t read it just now, so this is its saved
      list{when && ` from ${when}`}. It updates by itself once the page can be read again.
    </>
  );
}
