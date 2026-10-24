// Typed answers for "Continue without a photo": the artwork's name or its museum
// accession number, as printed on the label. Pure and deterministic, so the same
// rules run in tests and on the server (POST /api/check-answer). Answer lists
// live in each adventure's answers.server.ts and never reach the browser.

/** One quest's curated answer set. */
export interface QuestArtworkAnswer {
  questId: number;
  /** The id in The Met's collection URL (…/search/545530). Never accepted as an answer: it is not on the label. */
  metCollectionId: string;
  /** Accession numbers exactly as The Met prints them, e.g. "16.1.24" or "14.10.2a, b". Only from The Met's own data. */
  accessionNumbers: string[];
  /** The Met's official title. */
  canonicalTitle: string;
  /** Other names that count, e.g. the adventure's shorter name for the object. */
  acceptedTitles: string[];
  /**
   * False when another object on view nearby has the same title (three "Heart amulet"s
   * in Gallery 117), or the title is too generic to count ("Mirror"). Then only the
   * accession number and acceptedTitles match.
   */
  titleUnique: boolean;
  /** Titles of look-alike objects in the same gallery. A typo must never land on one of these. */
  nearbyTitles?: string[];
  /** Still open for a curator. Shown in the grown-ups area's notes, never to players. */
  curatorReview?: string;
}

export type AnswerCheck = "match" | "no_match" | "unchecked";

const MAX_ANSWER = 120;

/** Lowercase, no accents, typographic quotes and dashes made plain, punctuation to spaces. */
export function normalizeTitle(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[‘’ʼ`´']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/^(the|a|an) /, "");
}

interface Accession {
  /** Number groups as printed, leading zeros kept ("05.4.256" → ["05", "4", "256"]). */
  groups: string[];
  /** Part letters, e.g. "a, b" → ["a", "b"], "a–c" → ["a", "b", "c"]. Empty for a single-part object. */
  parts: string[];
}

function letters(s: string): string[] | null {
  const out: string[] = [];
  // "a, b", "a-c", "a–c", "ab", "a and b", "a & b"
  const tokens = s.replace(/\band\b|&/g, ",").replace(/[–—]/g, "-").replace(/\s+/g, "").split(",").filter(Boolean);
  for (const t of tokens) {
    const range = /^([a-z])-([a-z])$/.exec(t);
    if (range) {
      const [from, to] = [range[1].charCodeAt(0), range[2].charCodeAt(0)];
      if (to < from) return null;
      for (let c = from; c <= to; c++) out.push(String.fromCharCode(c));
    } else if (/^[a-z]+$/.test(t)) {
      out.push(...t);
    } else {
      return null;
    }
  }
  return out;
}

/** Reads an accession number the way labels and people write it. Null when it doesn't look like one. */
export function parseAccession(raw: string): Accession | null {
  const s = raw.normalize("NFKC").toLowerCase().trim().replace(/^(no\.?|acc\.?|accession)\s*/, "");
  // Number groups separated by dots (or spaces, dashes, slashes when typed), then optional part letters.
  const m = /^(\d+(?:\s*[.\-/ ]\s*\d+)+)\s*([a-z][a-z\s,&–—-]*)?$/.exec(s);
  if (!m) return null;
  const groups = m[1].split(/\s*[.\-/ ]\s*/);
  const parts = m[2] ? letters(m[2].trim()) : [];
  if (!parts) return null;
  return { groups, parts };
}

function accessionMatches(input: Accession, official: Accession): boolean {
  if (input.groups.length !== official.groups.length) return false;
  if (input.groups.some((g, i) => g !== official.groups[i])) return false;
  // "14.10.2" names the whole object; "14.10.2a" one of its parts. A letter the object hasn't got is wrong.
  return input.parts.every((p) => official.parts.includes(p));
}

/** Edit distance with adjacent swaps (optimal string alignment). */
function distance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Typos allowed for a title of this length: none for short names, so "cat" never becomes "car". */
const slack = (title: string) => (title.length >= 20 ? 2 : title.length >= 10 ? 1 : 0);

function titleMatches(input: string, answer: QuestArtworkAnswer): boolean {
  const titles = [...(answer.titleUnique ? [answer.canonicalTitle] : []), ...answer.acceptedTitles].map(normalizeTitle).filter(Boolean);
  const best = Math.min(...titles.map((t) => (distance(input, t) <= slack(t) ? distance(input, t) : Infinity)));
  if (best === Infinity) return false;
  // Unambiguous only: an answer at least as close to a look-alike's title doesn't count.
  const nearby = [...(answer.nearbyTitles ?? []), ...(answer.titleUnique ? [] : [answer.canonicalTitle])].map(normalizeTitle);
  return !nearby.some((t) => distance(input, t) <= best);
}

export function checkAnswer(raw: string, answer: QuestArtworkAnswer | undefined): AnswerCheck {
  if (!answer || (!answer.accessionNumbers.length && !answer.acceptedTitles.length && !answer.titleUnique)) return "unchecked";
  const text = raw.slice(0, MAX_ANSWER).trim();
  if (!text) return "no_match";
  const acc = parseAccession(text);
  if (acc) {
    const official = answer.accessionNumbers.map(parseAccession).filter((a): a is Accession => a !== null);
    return official.some((o) => accessionMatches(acc, o)) ? "match" : "no_match";
  }
  const title = normalizeTitle(text);
  return title.length >= 3 && titleMatches(title, answer) ? "match" : "no_match";
}
