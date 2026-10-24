"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "./ui";

// Modal built on <dialog>: showModal() makes the rest of the page inert so focus
// stays inside, Escape fires "cancel", and focus goes back to whatever opened it.

export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement;
      d.showModal();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const restore = () => {
      if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
    };
    const cancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("close", restore);
    d.addEventListener("cancel", cancel);
    return () => {
      d.removeEventListener("close", restore);
      d.removeEventListener("cancel", cancel);
    };
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-line bg-card p-0 text-ink shadow-[0_30px_80px_-20px_rgb(13_13_16/0.45)] backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // tap on the backdrop
      }}
    >
      {open && <div className="flex flex-col gap-4 p-6">{children}</div>}
    </dialog>
  );
}

/** Two-choice confirmation. The safe choice is first, has focus, and is what Escape does. */
export function ConfirmDialog({
  open,
  title,
  body,
  safeLabel,
  actionLabel,
  onCancel,
  onConfirm,
  destructive = false,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  safeLabel: string;
  actionLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  /** Destructive actions get the quieter style; the safe choice stays visually primary. */
  destructive?: boolean;
}) {
  const id = `dlg-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Dialog open={open} onClose={onCancel} labelledBy={id}>
      <h2 id={id} className="font-display text-3xl font-semibold leading-[1.05]">
        {title}
      </h2>
      <div className="text-lg">{body}</div>
      <div className="flex flex-col gap-3">
        <Button autoFocus onClick={onCancel}>
          {safeLabel}
        </Button>
        <Button variant="secondary" className={destructive ? "border-burgundy/50 text-burgundy hover:border-burgundy" : ""} onClick={onConfirm}>
          {actionLabel}
        </Button>
      </div>
    </Dialog>
  );
}
