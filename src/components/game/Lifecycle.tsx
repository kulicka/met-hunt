"use client";

import { useState } from "react";
import { BookOpen, Menu } from "lucide-react";
import { restartConfirmed } from "@/lib/analytics/client";
import { useAdventure } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { endAdventure, restartAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { ConfirmDialog, Dialog } from "./Dialog";
import { navigate } from "./router";
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
        navigate({ name: "start" }, { replace: true });
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

/** Thin bar above in-game screens: the explorer (small) and the menu. */
export function GameBar() {
  const avatar = useAvatar();
  const progress = useProgress();
  const [sheet, setSheet] = useState<Sheet>(null);
  const close = () => setSheet(null);
  const go = (route: Parameters<typeof navigate>[0]) => {
    close();
    navigate(route);
  };

  const item = "flex min-h-11 w-full items-center rounded-2xl px-3 text-left text-lg hover:bg-paper";
  return (
    <>
      <div className="mx-auto w-full max-w-md px-4 pt-3">
      <div className="flex items-center justify-between rounded-full border border-line bg-card/80 py-1 pl-1.5 pr-1 shadow-[0_1px_2px_rgb(13_13_16/0.04)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-ink">
          <AvatarArt asset={avatar.imageAsset} size={34} />
          <span className="text-sm font-semibold">{avatar.displayName}</span>
        </div>
        <div className="flex items-center">
        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-ink-soft hover:bg-paper hover:text-ink"
          aria-label={`Detective Notebook, ${progress.completedQuests.length} treasures`}
          onClick={() => navigate({ name: "collection" })}
        >
          <BookOpen aria-hidden size={20} />
          <span className="ml-1 text-sm font-semibold">{progress.completedQuests.length}</span>
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-[#25252b]"
          aria-haspopup="dialog"
          onClick={() => setSheet("menu")}
        >
          <Menu aria-hidden size={18} /> Menu
        </button>
        </div>
      </div>
      </div>

      <Dialog open={sheet === "menu"} onClose={close} labelledBy="game-menu-title">
        <h2 id="game-menu-title" className="font-display text-3xl font-semibold">
          Menu
        </h2>
        <nav className="-mx-3 flex flex-col">
          <button type="button" className={item} onClick={() => go({ name: "collection" })}>Detective Notebook</button>
          {progress.status !== "not_started" && (
            <button type="button" className={item} onClick={() => go({ name: "certificate" })}>My Certificate</button>
          )}
          <button type="button" className={item} onClick={() => go({ name: "map" })}>Treasure Map</button>
          <button type="button" className={item} onClick={() => go({ name: "how" })}>How to Play</button>
          <button type="button" className={item} onClick={() => go({ name: "adventures" })}>Switch Adventure</button>
          <button type="button" className={item} onClick={() => go({ name: "explorer" })}>Change Explorer</button>
          <button type="button" className={item} onClick={() => go({ name: "age" })}>Edit Age</button>
          <button type="button" className={item} onClick={() => go({ name: "parents" })}>For grown-ups</button>
          <hr className="my-2 border-line" />
          {progress.status === "in_progress" && (
            <button type="button" className={item} onClick={() => setSheet("end")}>End Adventure</button>
          )}
          {progress.status !== "not_started" && (
            <button type="button" className={`${item} text-burgundy`} onClick={() => setSheet("restart")}>Restart Adventure</button>
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
