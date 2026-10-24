// Riddle text is locked, so long riddles get smaller type instead of new line
// breaks. A riddle of three or more lines is sized so its longest line fits the
// card on one row; a short one or two-line riddle stays big and may wrap.

/** Average width of one character of the display font (semibold), in ems, measured on device. */
const CHAR_EM = 0.46;
export const RIDDLE_MAX_REM = 1.75;
export const RIDDLE_MIN_REM = 1;

/** CSS font-size for a riddle, relative to its container's width (cqi). */
export function riddleFontSize(lines: string[]): string {
  // The opening and closing quote marks sit on the first and last lines.
  const longest = Math.max(1, ...lines.map((l, i) => l.length + (i === 0 ? 1 : 0) + (i === lines.length - 1 ? 1 : 0)));
  const rowsPerLine = lines.length <= 2 ? 2 : 1;
  const fit = `${((100 * rowsPerLine) / (longest * CHAR_EM)).toFixed(2)}cqi`;
  return `clamp(${RIDDLE_MIN_REM}rem, ${fit}, ${RIDDLE_MAX_REM}rem)`;
}
