// Original notebook stamps for the Egyptian Adventure, one per stop (bonus and
// reserve included). Loaded with a dynamic import and only drawn for found
// treasures, since each one pictures an answer.

const INK = "#23201c";
const BURG = "#7a1f2b";
const GOLD = "#a8842c";
const LAPIS = "#2f5d8a";
const s = { stroke: INK, strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

const beetle = (
  <g {...s}>
    <ellipse cx={50} cy={54} rx={14} ry={18} fill={GOLD} fillOpacity={0.6} />
    <path d="M50 36 L50 72 M42 40 Q50 32 58 40" />
    <path d="M36 48 L28 42 M36 56 L26 56 M36 64 L28 70 M64 48 L72 42 M64 56 L74 56 M64 64 L72 70" />
  </g>
);

const cat = (spots: boolean) => (
  <g {...s}>
    <path d="M40 74 Q36 54 42 44 L40 30 L47 38 L53 38 L60 30 L58 44 Q64 54 60 74 Z" fill={GOLD} fillOpacity={0.45} />
    <path d="M60 72 Q72 70 70 58" />
    {spots && [[46, 56], [54, 60], [48, 66], [55, 50]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2} fill={INK} stroke="none" />)}
  </g>
);

const emblems: Record<number, React.ReactElement> = {
  // scarab ring
  111: (
    <g>
      <circle cx={50} cy={58} r={16} fill="none" stroke={GOLD} strokeWidth={4} />
      <ellipse cx={50} cy={40} rx={10} ry={12} fill={LAPIS} stroke={INK} strokeWidth={2.5} />
      <path d="M50 30 L50 52" stroke={BURG} strokeWidth={2.5} />
    </g>
  ),
  // chest with eyes and stars
  112: (
    <g {...s}>
      <rect x={28} y={40} width={44} height={32} fill={GOLD} fillOpacity={0.3} />
      <path d="M26 40 L50 30 L74 40" />
      <path d="M36 54 Q42 48 48 54 Q42 60 36 54 Z M52 54 Q58 48 64 54 Q58 60 52 54 Z" fill={GOLD} />
      <path d="M50 64 l2 4 l-4 0 Z" fill={INK} />
    </g>
  ),
  // vulture with spread wings
  114: (
    <g {...s}>
      <path d="M50 46 Q34 36 20 46 Q32 48 36 56 Q44 52 50 56 Q56 52 64 56 Q68 48 80 46 Q66 36 50 46 Z" fill={GOLD} fillOpacity={0.5} />
      <circle cx={50} cy={42} r={4} fill={INK} stroke="none" />
      <path d="M46 58 L50 70 L54 58" />
    </g>
  ),
  // double crown
  115: (
    <g {...s}>
      <path d="M36 72 L36 44 Q44 40 46 50 L46 30 Q58 26 58 34 L58 50 Q64 44 66 46 L64 72 Z" fill={BURG} fillOpacity={0.25} />
      <path d="M46 30 Q50 22 54 30" fill="#fbf8f1" />
    </g>
  ),
  // mirror with Hathor handle
  116: (
    <g {...s}>
      <ellipse cx={50} cy={38} rx={16} ry={14} fill="#e9f1f2" stroke={GOLD} strokeWidth={4} />
      <path d="M50 52 L50 62 M42 62 Q50 58 58 62 Q58 70 50 72 Q42 70 42 62 Z M50 72 L50 80" />
      <path d="M40 60 Q36 56 38 52 M60 60 Q64 56 62 52" />
    </g>
  ),
  // cosmetic spoon with a cat
  117: (
    <g>
      <g {...s}>
        <ellipse cx={50} cy={66} rx={12} ry={9} fill={GOLD} fillOpacity={0.45} />
        <path d="M50 57 L50 44" />
      </g>
      <g transform="translate(25 2) scale(0.5)">{cat(false)}</g>
    </g>
  ),
  // two ankhs
  122: (
    <g {...s} stroke={GOLD} strokeWidth={4}>
      <path d="M38 76 L38 48 M30 50 L46 50 M38 48 Q30 40 38 30 Q46 40 38 48" />
      <path d="M62 76 L62 48 M54 50 L70 50 M62 48 Q54 40 62 30 Q70 40 62 48" />
    </g>
  ),
  // row of cobras
  123: (
    <g {...s}>
      <path d="M24 70 L76 70" strokeWidth={4} />
      {[30, 42, 54, 66].map((x) => (
        <path key={x} d={`M${x} 70 L${x} 52 Q${x - 4} 44 ${x} 40 Q${x + 4} 44 ${x} 52`} fill={GOLD} fillOpacity={0.5} />
      ))}
    </g>
  ),
  // lion on a limestone flake
  124: (
    <g {...s}>
      <path d="M26 46 Q34 28 60 32 Q78 38 74 60 Q70 76 46 74 Q24 70 26 46 Z" fill="#efe6d2" />
      <circle cx={42} cy={50} r={7} fill={GOLD} fillOpacity={0.6} />
      <path d="M48 52 L64 52 L66 62 M52 52 L52 62 M60 52 L60 62 M64 52 Q70 48 68 42" />
    </g>
  ),
  // spotted cat amulet
  125: cat(true),
  // tiny heart amulet (bonus)
  1171: (
    <g {...s}>
      <path d="M50 72 Q30 58 34 44 Q38 34 50 42 Q62 34 66 44 Q70 58 50 72 Z" fill={LAPIS} fillOpacity={0.55} />
      <path d="M44 36 L56 36" />
    </g>
  ),
  // beetle on a coffin's head (reserve)
  126: (
    <g>
      <path d="M36 80 L36 44 Q36 24 50 24 Q64 24 64 44 L64 80" fill={GOLD} fillOpacity={0.25} stroke={INK} strokeWidth={2.5} />
      <g transform="translate(25 -12) scale(0.5)">{beetle}</g>
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
