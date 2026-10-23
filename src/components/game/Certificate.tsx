"use client";

import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { certificateText } from "@/lib/certificate";
import { pack } from "@/lib/content";
import { useAvatar } from "@/lib/profile";
import { useProgress } from "@/lib/progress";
import { AvatarMedallion } from "./AvatarArt";
import { navigate } from "./router";
import { Button, Screen } from "./ui";

// A keepsake drawn as one SVG, so the screen, the print, and the saved image
// are identical. Everything happens on the phone: nothing is uploaded, and the
// only name on it is the explorer's built-in name. Original border and seal;
// no Met logos, and it says it isn't an official museum certificate.

const W = 600;
const H = 820;
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const INK = "#23201c";
const SOFT = "#5a5248";
const BURG = "#7a1f2b";
const GOLD = "#a8842c";
const GOLD_SOFT = "#d9c38b";
const IVORY = "#fbf8f1";
export const KEEPSAKE_NOTE = "A Hidden Treasures adventure keepsake — not an official museum certificate.";

/** Greedy word wrap for SVG text, which has no wrapping of its own. */
function wrap(text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && (line + " " + word).length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function Corner({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`} fill="none" stroke={GOLD} strokeWidth={2}>
      <path d="M0 34 Q0 0 34 0" />
      <path d="M8 34 Q8 8 34 8" strokeWidth={1} />
      <circle cx={14} cy={14} r={4} fill={GOLD} />
    </g>
  );
}

function Seal({ x, y }: { x: number; y: number }) {
  const points = Array.from({ length: 24 }, (_, i) => {
    const a = (i * Math.PI) / 12;
    const r = i % 2 ? 38 : 46;
    return `${x + r * Math.cos(a)},${y + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <g>
      <polygon points={points} fill={GOLD_SOFT} stroke={GOLD} strokeWidth={2} />
      <circle cx={x} cy={y} r={30} fill={IVORY} stroke={BURG} strokeWidth={2} />
      <circle cx={x - 4} cy={y - 4} r={11} fill="none" stroke={BURG} strokeWidth={3.5} />
      <line x1={x + 4} y1={y + 4} x2={x + 14} y2={y + 14} stroke={BURG} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
}

export function CertificateArt({ svgRef }: { svgRef?: React.Ref<SVGSVGElement> }) {
  const progress = useProgress();
  const avatar = useAvatar();
  const total = pack.questIds.length;
  const c = certificateText(progress, total, avatar.displayName);
  const statement = wrap(c.statement, 34);
  const date = new Date(c.date).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
  const full = c.kind === "full";
  const title = wrap(c.title, 18);
  const titleY = (i: number) => 362 + i * 44;
  const nameY = titleY(title.length - 1) + 50;
  const lineY = (i: number) => nameY + 50 + i * 34;
  const countY = lineY(statement.length - 1) + 52;

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Certificate: ${c.title}. ${c.statement} ${c.countLine ?? ""} ${KEEPSAKE_NOTE}`}
    >
      <rect width={W} height={H} fill={IVORY} />
      <rect x={18} y={18} width={W - 36} height={H - 36} fill="none" stroke={GOLD} strokeWidth={4} />
      <rect x={30} y={30} width={W - 60} height={H - 60} fill="none" stroke={BURG} strokeWidth={1.5} />
      <Corner x={40} y={40} r={0} />
      <Corner x={W - 40} y={40} r={90} />
      <Corner x={W - 40} y={H - 40} r={180} />
      <Corner x={40} y={H - 40} r={270} />

      <text x={W / 2} y={100} textAnchor="middle" fontFamily={SANS} fontSize={17} letterSpacing={5} fill={SOFT} fontWeight={600}>
        THE MET: HIDDEN TREASURES
      </text>
      <line x1={200} y1={118} x2={400} y2={118} stroke={GOLD} strokeWidth={1.5} />

      <svg x={W / 2 - 80} y={140} width={160} height={160} viewBox="0 0 120 120">
        <AvatarMedallion asset={avatar.imageAsset} idPrefix="cert" />
      </svg>

      {title.map((line, i) => (
        <text key={line} x={W / 2} y={titleY(i)} textAnchor="middle" fontFamily={SERIF} fontSize={38} fontWeight={700} letterSpacing={1} fill={BURG}>
          {line}
        </text>
      ))}
      <text x={W / 2} y={nameY} textAnchor="middle" fontFamily={SERIF} fontSize={30} fontStyle="italic" fill={INK}>
        {avatar.displayName}
      </text>
      {statement.map((line, i) => (
        <text key={line} x={W / 2} y={lineY(i)} textAnchor="middle" fontFamily={SERIF} fontSize={25} fill={INK}>
          {line}
        </text>
      ))}
      {c.countLine && (
        <text x={W / 2} y={countY} textAnchor="middle" fontFamily={SANS} fontSize={20} fontWeight={700} letterSpacing={1} fill={GOLD}>
          {c.countLine.toUpperCase()}
        </text>
      )}

      <Seal x={130} y={692} />
      <text x={W - 130} y={684} textAnchor="middle" fontFamily={SERIF} fontSize={20} fill={INK}>
        {date}
      </text>
      <line x1={W - 210} y1={696} x2={W - 50} y2={696} stroke={SOFT} strokeWidth={1} />
      <text x={W - 130} y={716} textAnchor="middle" fontFamily={SANS} fontSize={13} fill={SOFT}>
        {full ? "Date completed" : "Adventure date"}
      </text>

      <text x={W / 2} y={H - 66} textAnchor="middle" fontFamily={SANS} fontSize={12} fill={SOFT}>
        {KEEPSAKE_NOTE}
      </text>
    </svg>
  );
}

/** Rasterize the certificate SVG to a PNG on the phone. */
async function toPng(svg: SVGSVGElement): Promise<Blob> {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("width", String(W));
  copy.setAttribute("height", String(H));
  const markup = new XMLSerializer().serializeToString(copy);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("render failed"));
      img.src = url;
    });
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = W * scale;
    canvas.height = H * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CertificateScreen() {
  const progress = useProgress();
  const svg = useRef<SVGSVGElement>(null);
  const [saveState, setSaveState] = useState<"idle" | "working" | "failed">("idle");
  const canPrint = typeof window !== "undefined" && typeof window.print === "function";

  const save = async () => {
    if (!svg.current) return;
    setSaveState("working");
    try {
      const blob = await toPng(svg.current);
      const file = new File([blob], "hidden-treasures-certificate.png", { type: "image/png" });
      // Phones: the share sheet offers "Save Image" / Photos. Elsewhere: a download.
      if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ files: [file], title: "Hidden Treasures certificate" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
      }
      setSaveState("idle");
    } catch (e) {
      setSaveState(e instanceof DOMException && e.name === "AbortError" ? "idle" : "failed");
    }
  };

  return (
    <Screen>
      <div id="certificate-print" className="overflow-hidden rounded-xl shadow-[0_10px_30px_-18px_rgb(35_32_28/0.5)] print:shadow-none">
        <CertificateArt svgRef={svg} />
      </div>
      <div className="flex flex-col gap-3 print:hidden">
        <Button onClick={save} disabled={saveState === "working"}>
          <Download aria-hidden size={20} /> {saveState === "working" ? "SAVING…" : "SAVE AS IMAGE"}
        </Button>
        {saveState === "failed" && (
          <p role="status" className="text-center text-ink-soft">
            This browser couldn’t save the image. Try PRINT, or take a screenshot.
          </p>
        )}
        {canPrint && (
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer aria-hidden size={20} /> PRINT
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate({ name: "collection" })}>
          OPEN MY NOTEBOOK
        </Button>
        <Button variant="quiet" className="mx-auto" onClick={() => navigate(progress.status === "in_progress" ? { name: "quest", id: progress.currentQuest } : { name: "done" })}>
          {progress.status === "in_progress" ? "Back to the hunt" : "Back"}
        </Button>
      </div>
    </Screen>
  );
}
