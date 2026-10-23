"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { pack } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { endAdventure, restartAdventure, useProgress } from "@/lib/progress";
import { AvatarArt } from "./AvatarArt";
import { ConfirmDialog, Dialog } from "./Dialog";
import { navigate } from "./router";
import { Button } from "./ui";

// End early (reversible) and restart (destructive), plus the in-game menu that offers them.

export function EndAdventureDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const progress = useProgress();
  const count = progress.completedQuests.length;
  return (
    <ConfirmDialog
      open={open}
      title="End your adventure?"
      body={`You’ve found ${count} of ${pack.questIds.length} treasures. You can end the hunt here and keep everything you’ve discovered.`}
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

  const item = "flex min-h-12 w-full items-center rounded-xl px-3 text-left text-lg hover:bg-paper-deep";
  return (
    <>
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <div className="flex items-center gap-2 text-ink-soft">
          <AvatarArt asset={avatar.imageAsset} size={34} />
          <span className="text-sm font-semibold">{avatar.displayName}</span>
        </div>
        <button
          type="button"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-ink-soft hover:bg-paper-deep"
          aria-haspopup="dialog"
          onClick={() => setSheet("menu")}
        >
          <Menu aria-hidden size={20} /> Menu
        </button>
      </div>

      <Dialog open={sheet === "menu"} onClose={close} labelledBy="game-menu-title">
        <h2 id="game-menu-title" className="font-serif text-3xl font-bold">
          Menu
        </h2>
        <nav className="-mx-3 flex flex-col">
          <button type="button" className={item} onClick={() => go({ name: "collection" })}>My Treasures</button>
          <button type="button" className={item} onClick={() => go({ name: "map" })}>Treasure Map</button>
          <button type="button" className={item} onClick={() => go({ name: "how" })}>How to Play</button>
          <button type="button" className={item} onClick={() => go({ name: "explorer" })}>Change Explorer</button>
          <button type="button" className={item} onClick={() => go({ name: "age" })}>Edit Age</button>
          <button type="button" className={item} onClick={() => go({ name: "parents" })}>For grown-ups</button>
          <hr className="my-2 border-line" />
          {progress.status === "in_progress" && (
            <button type="button" className={item} onClick={() => setSheet("end")}>End Adventure</button>
          )}
          <button type="button" className={`${item} text-burgundy`} onClick={() => setSheet("restart")}>Restart Adventure</button>
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
