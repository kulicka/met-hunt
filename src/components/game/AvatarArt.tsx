import type { ReactElement } from "react";

// Original explorer illustrations: one badge style (paper medallion, ink
// outline, museum-palette accents) with a detective prop each.

const INK = "#23201c";
const PAPER = "#fbf8f1";
const DEEP = "#ece3cf";
const BURG = "#7a1f2b";
const GOLD = "#a8842c";
const GOLD_SOFT = "#d9c38b";
const FOREST = "#2f4a3a";
const BLUSH = "#e9958a";

const line = { stroke: INK, strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

function Eyes({ y = 56, dx = 9, cx = 60, r = 2.6 }: { y?: number; dx?: number; cx?: number; r?: number }) {
  return (
    <>
      <circle cx={cx - dx} cy={y} r={r} fill={INK} />
      <circle cx={cx + dx} cy={y} r={r} fill={INK} />
    </>
  );
}

function Magnifier({ x, y, r = 9 }: { x: number; y: number; r?: number }) {
  return (
    <g {...line}>
      <line x1={x + r * 0.7} y1={y + r * 0.7} x2={x + r * 1.7} y2={y + r * 1.7} strokeWidth={4} stroke={BURG} />
      <circle cx={x} cy={y} r={r} fill="#e9f1f2" fillOpacity={0.85} stroke={GOLD} strokeWidth={3} />
    </g>
  );
}

function TreasureMap({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x + 13} ${y + 9})`}>
      <path d={`M${x} ${y} L${x + 9} ${y + 2} L${x + 18} ${y} L${x + 27} ${y + 2} L${x + 27} ${y + 18} L${x + 18} ${y + 16} L${x + 9} ${y + 18} L${x} ${y + 16} Z`} fill={PAPER} {...line} strokeWidth={2} />
      <path d={`M${x + 9} ${y + 2} L${x + 9} ${y + 18} M${x + 18} ${y} L${x + 18} ${y + 16}`} stroke={INK} strokeWidth={1} strokeOpacity={0.4} />
      <path d={`M${x + 4} ${y + 13} Q${x + 10} ${y + 4} ${x + 19} ${y + 9}`} fill="none" stroke={BURG} strokeWidth={1.5} strokeDasharray="2 2" />
      <path d={`M${x + 19} ${y + 6} L${x + 24} ${y + 11} M${x + 24} ${y + 6} L${x + 19} ${y + 11}`} stroke={BURG} strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}

const art: Record<string, ReactElement> = {
  scout: (
    <g>
      <path d="M26 112 Q30 84 60 82 Q90 84 94 112 Z" fill={BURG} {...line} />
      <path d="M52 82 L60 94 L68 82" fill={PAPER} {...line} />
      <circle cx={60} cy={58} r={21} fill="#e8b48a" {...line} />
      <path d="M38 52 Q40 30 60 30 Q80 30 82 52 Q72 44 60 44 Q48 44 38 52 Z" fill={GOLD} {...line} />
      <path d="M34 52 Q60 40 86 52" fill="none" {...line} />
      <path d="M58 31 L60 25 L62 31" fill={GOLD} {...line} />
      <Eyes y={60} dx={8} />
      <path d="M53 68 Q60 73 67 68" fill="none" {...line} />
      <Magnifier x={89} y={80} />
    </g>
  ),
  fig: (
    <g>
      <path d="M30 112 Q34 90 60 88 Q86 90 90 112 Z" fill="#c8642a" {...line} />
      <path d="M36 92 Q60 102 84 92 L82 100 Q60 108 38 100 Z" fill={FOREST} {...line} />
      <path d="M30 34 L42 54 L34 58 Z M90 34 L78 54 L86 58 Z" fill="#c8642a" {...line} />
      <path d="M28 54 Q60 30 92 54 Q84 76 60 88 Q36 76 28 54 Z" fill="#c8642a" {...line} />
      <path d="M38 64 Q50 70 60 88 Q70 70 82 64 Q72 80 60 88 Q48 80 38 64 Z" fill={PAPER} {...line} />
      <circle cx={60} cy={86} r={3.5} fill={INK} />
      <Eyes y={58} dx={11} />
    </g>
  ),
  otto: (
    <g>
      <path d="M32 36 L40 48 M88 36 L80 48" {...line} />
      <path d="M34 112 Q28 70 40 48 Q60 34 80 48 Q92 70 86 112 Z" fill="#8a6a4a" {...line} />
      <path d="M46 112 Q42 84 60 78 Q78 84 74 112 Z" fill={GOLD_SOFT} {...line} />
      <circle cx={49} cy={60} r={10} fill={PAPER} stroke={GOLD} strokeWidth={3} />
      <circle cx={71} cy={60} r={10} fill={PAPER} stroke={GOLD} strokeWidth={3} />
      <line x1={59} y1={60} x2={61} y2={60} stroke={GOLD} strokeWidth={3} />
      <Eyes y={60} dx={11} r={3.4} />
      <path d="M56 70 L60 78 L64 70 Z" fill={GOLD} {...line} />
      <rect x={70} y={88} width={20} height={16} rx={2} fill={BURG} {...line} transform="rotate(-12 80 96)" />
    </g>
  ),
  milo: (
    <g>
      <circle cx={36} cy={44} r={15} fill="#9a948c" {...line} />
      <circle cx={84} cy={44} r={15} fill="#9a948c" {...line} />
      <circle cx={36} cy={44} r={8} fill="#e6a9a3" />
      <circle cx={84} cy={44} r={8} fill="#e6a9a3" />
      <path d="M32 112 Q36 88 60 86 Q84 88 88 112 Z" fill="#9a948c" {...line} />
      <path d="M40 88 L84 112" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
      <rect x={70} y={98} width={18} height={13} rx={3} fill={GOLD} {...line} />
      <ellipse cx={60} cy={64} rx={22} ry={20} fill="#b5afa6" {...line} />
      <circle cx={60} cy={74} r={3.5} fill={BURG} />
      <path d="M50 74 L36 70 M50 77 L36 79 M70 74 L84 70 M70 77 L84 79" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <Eyes y={60} dx={8} />
    </g>
  ),
  cleo: (
    <g>
      <path d="M30 112 Q34 88 60 86 Q86 88 90 112 Z" fill="#4a4540" {...line} />
      <circle cx={60} cy={99} r={3} fill={PAPER} {...line} strokeWidth={1.5} />
      <path d="M36 52 L38 28 L54 42 M84 52 L82 28 L66 42" fill="#e0a35a" {...line} />
      <circle cx={60} cy={62} r={24} fill="#e0a35a" {...line} />
      <ellipse cx={54} cy={36} rx={18} ry={7} fill={BURG} {...line} transform="rotate(-10 54 36)" />
      <circle cx={46} cy={32} r={2.5} fill={BURG} {...line} strokeWidth={1.5} />
      <path d="M47 60 Q51 56 55 60 M65 60 Q69 56 73 60" fill="none" {...line} />
      <path d="M57 68 L60 71 L63 68 Z" fill={BURG} {...line} strokeWidth={1.5} />
      <path d="M48 70 L34 68 M48 73 L34 75 M72 70 L86 68 M72 73 L86 75" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M86 96 L98 74" stroke={GOLD} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M97 76 L101 68 L103 71 Z" fill={FOREST} {...line} strokeWidth={1.5} />
    </g>
  ),
  pip: (
    <g transform="rotate(-8 60 64)">
      <path d="M34 108 Q26 74 44 56 Q60 42 76 56 Q94 74 86 108 Z" fill="#3f7f8c" {...line} />
      <path d="M46 108 Q44 84 60 80 Q76 84 74 108 Z" fill={GOLD_SOFT} {...line} />
      <path d="M58 40 Q60 30 66 34 M62 40 Q68 32 72 38" fill="none" {...line} />
      <path d="M80 84 Q96 82 100 96 Q88 96 80 92" fill="#2f6470" {...line} />
      <path d="M42 76 Q60 86 78 76 L76 82 Q60 92 44 82 Z" fill={BURG} {...line} />
      <circle cx={52} cy={60} r={3} fill={INK} />
      <circle cx={53} cy={59} r={1} fill={PAPER} />
      <path d="M62 62 L78 64 L64 70 Z" fill="#e08a2c" {...line} />
    </g>
  ),
  dash: (
    <g>
      <path d="M30 112 Q34 88 60 86 Q86 88 90 112 Z" fill="#b98a5a" {...line} />
      <path d="M38 90 Q60 98 82 90" fill="none" stroke={FOREST} strokeWidth={6} strokeLinecap="round" />
      <circle cx={60} cy={100} r={5} fill={GOLD} {...line} strokeWidth={1.5} />
      <circle cx={60} cy={60} r={24} fill="#d2a874" {...line} />
      <path d="M38 46 Q24 50 28 76 Q36 76 40 62 Z M82 46 Q96 50 92 76 Q84 76 80 62 Z" fill="#7a5532" {...line} />
      <ellipse cx={60} cy={72} rx={13} ry={10} fill={PAPER} {...line} />
      <ellipse cx={60} cy={67} rx={5} ry={3.5} fill={INK} />
      <path d="M60 71 L60 75 Q56 79 53 76 M60 75 Q64 79 67 76" fill="none" {...line} strokeWidth={1.8} />
      <Eyes y={56} dx={9} />
      <path d="M44 36 Q60 26 76 36 L74 42 Q60 36 46 42 Z" fill={BURG} {...line} />
    </g>
  ),
  remy: (
    <g>
      <path d="M86 112 Q104 96 98 70" fill="none" stroke="#7d7a76" strokeWidth={12} strokeLinecap="round" />
      <path d="M95 92 L105 88 M99 80 L108 78" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <path d="M30 112 Q34 88 60 86 Q86 88 90 112 Z" fill="#7d7a76" {...line} />
      <path d="M36 50 L34 32 L50 42 M84 50 L86 32 L70 42" fill="#7d7a76" {...line} />
      <path d="M34 58 Q60 34 86 58 Q84 82 60 86 Q36 82 34 58 Z" fill="#a5a19b" {...line} />
      <path d="M38 58 Q48 50 58 58 Q60 64 62 58 Q72 50 82 58 Q78 68 66 64 Q60 66 54 64 Q42 68 38 58 Z" fill={INK} />
      <circle cx={50} cy={59} r={2.6} fill={PAPER} />
      <circle cx={70} cy={59} r={2.6} fill={PAPER} />
      <path d="M48 72 Q60 84 72 72" fill={PAPER} {...line} />
      <circle cx={60} cy={73} r={3.5} fill={INK} />
      <Magnifier x={32} y={90} r={8} />
    </g>
  ),
  koti: (
    <g>
      <path d="M32 110 Q12 104 14 86 Q16 72 28 74 Q34 76 30 82" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <path d="M38 48 L34 18 L58 36 Z M82 48 L86 18 L62 36 Z" fill="#1d1b19" {...line} />
      <path d="M40 40 L38 25 L50 35 Z M80 40 L82 25 L70 35 Z" fill="#e8a0b4" />
      <path d="M36 62 Q34 36 60 34 Q86 36 84 62 L86 96 L34 96 Z" fill="#e8c14a" {...line} />
      <path d="M28 112 Q32 86 60 84 Q88 86 92 112 Z" fill="#b5dca6" {...line} />
      <path d="M50 85 L60 100 L70 85" fill="none" {...line} />
      <path d="M60 100 L60 112" {...line} strokeWidth={1.5} />
      <circle cx={56} cy={105} r={1.6} fill={INK} />
      <circle cx={60} cy={62} r={20} fill="#f3cfae" {...line} />
      <path d="M40 62 Q37 39 60 38 Q83 39 80 62 Q79 53 74 52 L46 52 Q41 53 40 62 Z" fill="#e8c14a" {...line} />
      <path d="M52 51 L52 45 M60 51 L60 44 M68 51 L68 45" stroke="#c99a2a" strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={52} cy={62} r={3.2} fill="#8cc8ea" />
      <circle cx={68} cy={62} r={3.2} fill="#8cc8ea" />
      <circle cx={52} cy={62} r={1.5} fill={INK} />
      <circle cx={68} cy={62} r={1.5} fill={INK} />
      <circle cx={53.2} cy={60.8} r={0.9} fill={PAPER} />
      <circle cx={69.2} cy={60.8} r={0.9} fill={PAPER} />
      <circle cx={52} cy={62} r={7} fill="none" stroke="#e27aa0" strokeWidth={2.5} />
      <circle cx={68} cy={62} r={7} fill="none" stroke="#e27aa0" strokeWidth={2.5} />
      <path d="M59 61 Q60 59.5 61 61" fill="none" stroke="#e27aa0" strokeWidth={2.5} />
      <circle cx={44} cy={71} r={3} fill={BLUSH} fillOpacity={0.7} />
      <circle cx={76} cy={71} r={3} fill={BLUSH} fillOpacity={0.7} />
      <path d="M55 73 Q60 78 65 73" fill="none" {...line} />
      <TreasureMap x={74} y={90} rot={-10} />
    </g>
  ),
  mustard: (
    <g>
      <path d="M28 112 Q32 88 60 86 Q88 88 92 112 Z" fill="#fbfaf6" {...line} />
      <path d="M42 87 Q60 94 78 87" fill="none" stroke={BURG} strokeWidth={5} strokeLinecap="round" />
      <path d="M78 44 Q98 46 96 76 Q88 82 80 64 Z" fill="#efe4cf" {...line} />
      <circle cx={64} cy={60} r={22} fill="#fbfaf6" {...line} />
      <path d="M50 42 Q38 40 36 60 Q42 64 50 52 Z" fill="#efe4cf" {...line} />
      <ellipse cx={44} cy={70} rx={14} ry={9.5} fill="#fbfaf6" {...line} />
      <path d="M34 75 Q40 80 48 76" fill="none" {...line} strokeWidth={1.8} />
      <ellipse cx={32} cy={66} rx={5} ry={3.8} fill="#d9606e" {...line} strokeWidth={2} />
      <circle cx={52} cy={57} r={3.6} fill="#6b3e1f" />
      <circle cx={67} cy={56} r={3.6} fill="#6b3e1f" />
      <circle cx={51} cy={55.8} r={1.1} fill={PAPER} />
      <circle cx={66} cy={54.8} r={1.1} fill={PAPER} />
      <path d="M47 50 Q51 47 55 49 M63 48 Q67 46 71 48" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
      <circle cx={72} cy={67} r={3.2} fill={BLUSH} fillOpacity={0.6} />
      <TreasureMap x={46} y={92} rot={6} />
      <ellipse cx={47} cy={102} rx={5} ry={4} fill="#fbfaf6" {...line} strokeWidth={2} />
      <ellipse cx={71} cy={102} rx={5} ry={4} fill="#fbfaf6" {...line} strokeWidth={2} />
    </g>
  ),
};

/** The medallion as SVG children on a 120×120 grid, for use inside another SVG (the certificate). */
export function AvatarMedallion({ asset, idPrefix = "av" }: { asset: string; idPrefix?: string }) {
  const clip = `${idPrefix}-clip-${asset}`;
  return (
    <>
      <circle cx={60} cy={60} r={57} fill={DEEP} stroke={GOLD_SOFT} strokeWidth={3} />
      <clipPath id={clip}>
        <circle cx={60} cy={60} r={55} />
      </clipPath>
      <g clipPath={`url(#${clip})`}>{art[asset] ?? art.scout}</g>
    </>
  );
}

export function AvatarArt({ asset, size = 96, className = "" }: { asset: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} aria-hidden focusable="false">
      <AvatarMedallion asset={asset} />
    </svg>
  );
}
