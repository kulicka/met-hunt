// Original notebook stamps, one per treasure. Loaded with a dynamic import (see
// Notebook.tsx) and only drawn for found treasures, since each one pictures an answer.

const INK = "#23201c";
const BURG = "#7a1f2b";
const GOLD = "#a8842c";
const s = { stroke: INK, strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

const emblems: Record<number, React.ReactElement> = {
  // monocle
  1: (
    <g {...s}>
      <circle cx={46} cy={46} r={15} fill="#e9f1f2" stroke={GOLD} strokeWidth={4} />
      <path d="M58 56 Q66 66 62 74 Q58 80 64 84" strokeDasharray="1 5" strokeWidth={3.5} />
    </g>
  ),
  // small horse sculpture
  2: (
    <g {...s} fill={GOLD}>
      <path d="M34 72 L36 54 Q38 46 48 46 L58 46 L62 36 L66 34 L72 40 L70 46 L66 46 L64 56 L66 72 M40 72 L42 60 M60 72 L58 60" />
      <path d="M30 76 L74 76" fill="none" strokeWidth={4} />
    </g>
  ),
  // folding fan
  3: (
    <g {...s}>
      <path d="M50 74 L24 46 Q50 22 76 46 Z" fill={GOLD} fillOpacity={0.35} />
      {[-36, -18, 0, 18, 36].map((a) => (
        <line key={a} x1={50} y1={74} x2={50 + 30 * Math.sin((a * Math.PI) / 180)} y2={74 - 34 * Math.cos((a * Math.PI) / 180)} />
      ))}
      <circle cx={50} cy={74} r={3} fill={INK} />
    </g>
  ),
  // tiny elephant
  4: (
    <g {...s} fill={GOLD} fillOpacity={0.4}>
      <path d="M30 70 L30 54 Q30 40 48 40 Q64 40 66 52 Q72 54 72 62 Q72 72 68 74 M30 70 L36 70 L36 62 M52 70 L58 70 L58 60 M66 52 Q66 60 60 62" />
      <circle cx={58} cy={48} r={1.8} fill={INK} />
    </g>
  ),
  // church tower
  5: (
    <g {...s}>
      <path d="M42 76 L42 44 L50 26 L58 44 L58 76 Z" fill={GOLD} fillOpacity={0.35} />
      <path d="M50 18 L50 26 M47 21 L53 21 M46 56 Q50 50 54 56 L54 62 L46 62 Z M36 76 L64 76" />
    </g>
  ),
  // two tiny people on the shore
  6: (
    <g {...s}>
      <circle cx={40} cy={40} r={4} fill={INK} />
      <path d="M40 46 L40 62 M40 50 L34 56 M40 50 L46 56 M40 62 L36 72 M40 62 L44 72" />
      <circle cx={60} cy={44} r={4} fill={INK} />
      <path d="M60 50 L60 64 M60 54 L54 60 M60 54 L66 60 M60 64 L56 72 M60 64 L64 72" />
      <path d="M24 76 Q36 72 50 76 Q64 80 76 76" stroke={GOLD} />
    </g>
  ),
  // flower
  7: (
    <g {...s}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={50} cy={36} rx={7} ry={11} fill={BURG} fillOpacity={0.55} transform={`rotate(${a} 50 48)`} />
      ))}
      <circle cx={50} cy={48} r={5} fill={GOLD} />
      <path d="M50 60 Q48 70 52 78 M50 70 Q42 64 38 68" />
    </g>
  ),
  // small figure
  8: (
    <g {...s}>
      <circle cx={50} cy={32} r={7} fill={GOLD} fillOpacity={0.5} />
      <path d="M50 40 L40 74 L60 74 Z" fill={GOLD} fillOpacity={0.35} />
      <path d="M44 52 L36 60 M56 52 L64 60" />
    </g>
  ),
  // vase with elephant-head handles
  9: (
    <g {...s}>
      <path d="M42 28 L58 28 L56 36 Q70 46 64 64 Q60 76 50 76 Q40 76 36 64 Q30 46 44 36 Z" fill={GOLD} fillOpacity={0.35} />
      <path d="M38 44 Q28 44 28 54 Q28 60 32 60 M62 44 Q72 44 72 54 Q72 60 68 60" />
      <circle cx={33} cy={46} r={1.6} fill={INK} />
      <circle cx={67} cy={46} r={1.6} fill={INK} />
    </g>
  ),
  // yellow book
  10: (
    <g {...s}>
      <path d="M28 40 L50 46 L72 40 L72 70 L50 76 L28 70 Z" fill={GOLD} fillOpacity={0.55} />
      <path d="M50 46 L50 76 M34 48 L44 51 M34 55 L44 58 M56 51 L66 48 M56 58 L66 55" />
    </g>
  ),
};

export default function Stamp({ questId, size = 88 }: { questId: number; size?: number }) {
  const tilt = ((questId * 37) % 17) - 8; // a slightly different angle per stamp
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden focusable="false">
      <g transform={`rotate(${tilt} 50 50)`}>
        <circle cx={50} cy={50} r={46} fill="#fbf8f1" stroke={BURG} strokeWidth={3} />
        <circle cx={50} cy={50} r={40} fill="none" stroke={BURG} strokeWidth={1.5} strokeDasharray="3 3" />
        {emblems[questId]}
      </g>
    </svg>
  );
}
