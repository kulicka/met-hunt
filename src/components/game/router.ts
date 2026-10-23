"use client";

import { useSyncExternalStore } from "react";

// The whole game is one page with hash routes, so moving between screens never
// needs the network (museum signal is unreliable).

export type Route =
  | { name: "start" }
  | { name: "how" }
  | { name: "quest"; id: number }
  | { name: "found"; id: number }
  | { name: "next"; from: number }
  | { name: "map"; focus?: number; from?: number }
  | { name: "collection" }
  | { name: "done" }
  | { name: "parents" }
  | { name: "explorer" }
  | { name: "entry"; id: number; fresh?: boolean }
  | { name: "certificate" }
  | { name: "age" };

export function parseRoute(hash: string): Route {
  const [path, query = ""] = hash.replace(/^#\/?/, "").split("?");
  const [name, arg] = path.split("/");
  const params = new URLSearchParams(query);
  const num = (v: string | null | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
  switch (name) {
    case "how":
    case "collection":
    case "done":
    case "parents":
    case "explorer":
    case "age":
    case "certificate":
      return { name };
    case "entry":
      return num(arg) ? { name, id: num(arg)!, fresh: params.get("new") === "1" } : { name: "collection" };
    case "quest":
    case "found":
      return num(arg) ? { name, id: num(arg)! } : { name: "start" };
    case "next":
      return num(arg) ? { name, from: num(arg)! } : { name: "start" };
    case "map":
      return { name, focus: num(params.get("focus")), from: num(params.get("from")) };
    default:
      return { name: "start" };
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case "start":
      return "#/";
    case "quest":
    case "found":
      return `#/${route.name}/${route.id}`;
    case "next":
      return `#/next/${route.from}`;
    case "entry":
      return `#/entry/${route.id}${route.fresh ? "?new=1" : ""}`;
    case "map": {
      const params = new URLSearchParams();
      if (route.focus) params.set("focus", String(route.focus));
      if (route.from) params.set("from", String(route.from));
      const q = params.toString();
      return `#/map${q ? `?${q}` : ""}`;
    }
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route, { replace = false } = {}) {
  const hash = routeHash(route);
  if (replace) history.replaceState(null, "", hash);
  else history.pushState(null, "", hash);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  window.scrollTo(0, 0);
}

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

export function useHash(): string | null {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => null);
}
