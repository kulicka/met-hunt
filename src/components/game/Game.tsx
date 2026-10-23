"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CertificateScreen } from "./Certificate";
import { FinalScreen } from "./Collection";
import { FoundScreen, NextScreen } from "./FoundScreens";
import { HowToPlay, StartScreen } from "./Intro";
import { GameBar } from "./Lifecycle";
import { MapScreen } from "./MapScreen";
import { EntryScreen, NotebookScreen } from "./Notebook";
import { EditProfile, Onboarding } from "./Onboarding";
import { ParentsScreen } from "./Parents";
import { QuestScreen } from "./QuestScreen";
import { parseRoute, useHash, type Route } from "./router";
import { useProfile } from "@/lib/profile";

// Screens that show the explorer and the menu above them.
const IN_GAME = new Set<Route["name"]>(["quest", "found", "next", "map", "collection", "entry", "how"]);

function screenFor(route: Route) {
  switch (route.name) {
    case "start":
      return <StartScreen />;
    case "how":
      return <HowToPlay />;
    case "quest":
      return <QuestScreen key={route.id} id={route.id} />;
    case "found":
      return <FoundScreen id={route.id} />;
    case "next":
      return <NextScreen from={route.from} />;
    case "map":
      return <MapScreen focus={route.focus} from={route.from} />;
    case "collection":
      return <NotebookScreen />;
    case "done":
      return <FinalScreen />;
    case "parents":
      return <ParentsScreen />;
    case "explorer":
    case "age":
      return <EditProfile field={route.name} />;
    case "entry":
      return <EntryScreen id={route.id} fresh={route.fresh} />;
    case "certificate":
      return <CertificateScreen />;
  }
}

export function Game() {
  const hash = useHash();
  const profile = useProfile();
  const reduce = useReducedMotion();
  if (hash === null || profile === null) return null; // server render: progress lives on the phone only
  const route = parseRoute(hash);
  // First launch (or interrupted onboarding): age and explorer come first. Grown-ups can still open their page.
  if (!profile.onboardingComplete && route.name !== "parents") return <Onboarding />;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={hash}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {IN_GAME.has(route.name) && <GameBar />}
        {screenFor(route)}
      </motion.div>
    </AnimatePresence>
  );
}
