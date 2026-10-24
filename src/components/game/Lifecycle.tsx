"use client";

import { useState } from "react";
import { BookOpen, Map as MapIcon, Menu } from "lucide-react";
import { restartConfirmed } from "@/lib/analytics/client";
import { useAdventure } from "@/lib/content";
import { useAvatar, useProfile } from "@/lib/profile";
import { endAdventure, restartAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { ConfirmDialog, Dialog } from "./Dialog";
import { navigate, parseRoute, useHash } from "./router";
import { Button } from "./ui";

// End early (reversible) and restart (destructive), plus the in-game menu that offers them.

export function EndAdventureDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const progress = useProgress();
  const { questIds } = useAdventure();
  const count = progress.completedQuests.length;
  return (
    <ConfirmDialog
      open={open}
      title="End your adventure?"
      body={`You’ve found ${count} of ${questIds.length} treasures. You can end the hunt here and keep everything you’ve discovered.`}
      safeLabel="KEEP EXPLORING"
      actionLabel="END ADVENTURE"
      onCancel={onClose}
      onConfirm={() => {
        onClose();
        endAdventure();
        navigate({ name: "done" }, { replace: true });
      }}
    />
  );
}

export function RestartDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const progress = useProgress();
  const count = progress.completedQuests.length;
  return (
    <ConfirmDialog
      open={open}
      destructive
      title="Start over from the beginning?"
      body={`This will erase your current hunt progress, including your ${count} discovered ${count === 1 ? "treasure" : "treasures"}. You can’t undo this.`}
      safeLabel="CANCEL"
      actionLabel="YES, START OVER"
      onCancel={onClose}
      onConfirm={() => {
        onClose();
        restartConfirmed(progress);
        restartAdventure();
        // A fresh hunt: choose the adventure again (nothing preselected), then the map.
        navigate({ name: "adventures", start: true }, { replace: true });
      }}
    />
  );
}

/** A secondary button that asks before restarting. */
export function RestartButton({ label = "RESTART ADVENTURE", variant = "secondary" as const }: { label?: string; variant?: "secondary" | "quiet" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} className={variant === "quiet" ? "mx-auto" : ""} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <RestartDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

type Sheet = null | "menu" | "end" | "restart";

/**
 * Thin bar above every screen: the explorer (small) and the menu. `setup` while
 * onboarding or choosing an adventure, when there is no hunt yet: the menu then
 * offers only what works before one begins.
 */
export function GameBar({ setup = false }: { setup?: boolean }) {
  const avatar = useAvatar();
  const profile = useProfile();
  const progress = useProgress();
  const { hasRoutes } = useAdventure();
  const route = parseRoute(useHash() ?? "");
  // The map belongs to the adventure being played. Until one is picked and begun
  // (a new hunt, or after a restart, the picker comes first), there is no map to show.
  const mapReady = !setup && progress.status !== "not_started" && !(route.name === "adventures" && route.start);
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);
  const go = (route: Parameters<typeof navigate>[0]) => {
    close();
    navigate(route);
  };

  const item = "flex min-h-11 w-full items-center rounded-2xl px-3 text-left text-lg hover:bg-paper";
  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 pt-3 print:hidden">
      <div className="flex items-center justify-between rounded-full border border-line bg-card/80 py-1 pl-1.5 pr-1 shadow-[0_1px_2px_rgb(13_13_16/0.04)] backdrop-blur-md">
        {profile?.avatarId && profile.onboardingComplete ? (
          // Tapping the explorer opens the explorer picker; DONE there comes back here, progress untouched.
          <button
            type="button"
            className="flex min-h-11 min-w-0 items-center gap-2 rounded-full pr-3 text-left text-ink hover:bg-paper aria-[current=page]:bg-paper"
            aria-label={`Explorer: ${avatar.displayName}. Change explorer`}
            aria-current={route.name === "explorer" ? "page" : undefined}
            onClick={() => {
              if (route.name !== "explorer") navigate({ name: "explorer" });
            }}
          >
            <AvatarArt asset={avatar.imageAsset} size={34} />
            <span className="truncate text-sm font-semibold">{avatar.displayName}</span>
          </button>
        ) : profile?.avatarId ? (
          <div className="flex min-w-0 items-center gap-2 text-ink">
            <AvatarArt asset={avatar.imageAsset} size={34} />
            <span className="truncate text-sm font-semibold">{avatar.displayName}</span>
          </div>
        ) : (
          <span className="pl-3 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">Hidden Treasures</span>
        )}
        <div className="flex shrink-0 items-center">
        {!setup && <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-2.5 text-ink-soft hover:bg-paper hover:text-ink aria-[current=page]:bg-paper aria-[current=page]:text-ink"
          aria-label={`Detective Notebook, ${progress.completedQuests.length} treasures`}
          aria-current={route.name === "collection" ? "page" : undefined}
          onClick={() => navigate({ name: "collection" })}
        >
          <BookOpen aria-hidden size={20} />
          <span className="ml-1 text-sm font-semibold">{progress.completedQuests.length}</span>
        </button>}
        {/* Always one tap away. The map only reads progress, so the mystery in play stays the same. */}
        {mapReady && <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink aria-[current=page]:bg-paper aria-[current=page]:text-ink"
          aria-label={hasRoutes ? "Treasure Map" : "Gallery list"}
          aria-current={route.name === "map" ? "page" : undefined}
          onClick={() => {
            if (route.name !== "map") navigate({ name: "map", focus: route.name === "quest" ? route.id : undefined });
          }}
        >
          <MapIcon aria-hidden size={20} />
        </button>}
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-sm max-[359px]:px-3 font-semibold text-white hover:bg-ink/85"
          aria-haspopup="dialog"
          onClick={() => setSheet("menu")}
        >
          <Menu aria-hidden size={18} /> <span className="max-[359px]:sr-only">Menu</span>
        </button>
        </div>
      </div>
      </div>

      <Dialog open={sheet === "menu"} onClose={close} labelledBy="game-menu-title">
        <h2 id="game-menu-title" className="font-display text-3xl font-semibold">
          Menu
        </h2>
        <nav className="-mx-3 flex flex-col">
          {setup ? (
            <>
              {/* Before a hunt: explorer and age once onboarding is done, and always the grown-ups' page. */}
              {profile?.onboardingComplete && (
                <>
                  <button type="button" className={item} onClick={() => go({ name: "explorer" })}>Change Explorer</button>
                  <button type="button" className={item} onClick={() => go({ name: "age" })}>Edit Age</button>
                </>
              )}
              <button type="button" className={item} onClick={() => go({ name: "parents" })}>For grown-ups</button>
            </>
          ) : (
            <>
              <button type="button" className={item} onClick={() => go({ name: "start" })}>Home</button>
              {progress.status === "in_progress" && (
                <button type="button" className={item} onClick={() => go({ name: "quest", id: progress.currentQuest })}>My Mystery</button>
              )}
              <button type="button" className={item} onClick={() => go({ name: "collection" })}>Detective Notebook</button>
              {progress.status !== "not_started" && (
                <button type="button" className={item} onClick={() => go({ name: "certificate" })}>My Certificate</button>
              )}
              {mapReady && (
                <button type="button" className={item} onClick={() => go({ name: "map" })}>Treasure Map</button>
              )}
              <button type="button" className={item} onClick={() => go({ name: "how" })}>How to Play</button>
              <button type="button" className={item} onClick={() => go({ name: "adventures" })}>Switch Adventure</button>
              <button type="button" className={item} onClick={() => go({ name: "explorer" })}>Change Explorer</button>
              <button type="button" className={item} onClick={() => go({ name: "age" })}>Edit Age</button>
              <button type="button" className={item} onClick={() => go({ name: "parents" })}>For grown-ups</button>
              {progress.status !== "not_started" && <hr className="my-2 border-line" />}
              {progress.status === "in_progress" && (
                <button type="button" className={item} onClick={() => setSheet("end")}>End Adventure</button>
              )}
              {progress.status !== "not_started" && (
                <button type="button" className={`${item} text-burgundy`} onClick={() => setSheet("restart")}>Restart Adventure</button>
              )}
            </>
          )}
        </nav>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      </Dialog>
      <EndAdventureDialog open={sheet === "end"} onClose={close} />
      <RestartDialog open={sheet === "restart"} onClose={close} />
    </>
  );
}
