"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CollectionScreen, FinalScreen } from "./Collection";
import { FoundScreen, NextScreen } from "./FoundScreens";
import { HowToPlay, StartScreen } from "./Intro";
import { MapScreen } from "./MapScreen";
import { ParentsScreen } from "./Parents";
import { QuestScreen } from "./QuestScreen";
import { parseRoute, useHash, type Route } from "./router";

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
      return <CollectionScreen />;
    case "done":
      return <FinalScreen />;
    case "parents":
      return <ParentsScreen />;
  }
}

export function Game() {
  const hash = useHash();
  const reduce = useReducedMotion();
  if (hash === null) return null; // server render: progress lives on the phone only
  const route = parseRoute(hash);
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={hash}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {screenFor(route)}
      </motion.div>
    </AnimatePresence>
  );
}
