// Player profile and adventure state: types, validation of what comes back from
// localStorage, and the state transitions from the onboarding/adventure spec.
// Pure functions only; the stores that persist them are in profile.ts and progress.ts.

export type AdventureStatus = "not_started" | "in_progress" | "ended_early" | "completed";
export type AgeChoice = 5 | 6 | 7 | 8 | 9 | 10 | 11 | "12+";
export type VerificationMethod = "ai-photo" | "grown-up" | "manual";

export const AGE_CHOICES: AgeChoice[] = [5, 6, 7, 8, 9, 10, 11, "12+"];

export interface PlayerProfile {
  age?: AgeChoice;
  avatarId?: string;
  /** The adventure being played; unset until the player chooses. Each adventure keeps its own progress. */
  adventureId?: string;
  /** False while onboarding is interrupted part-way (age picked, no explorer yet). */
  onboardingComplete: boolean;
}

export interface AdventureState {
  status: AdventureStatus;
  startedAt?: string;
  endedAt?: string;
  completedAt?: string;
  currentQuest: number;
  completedQuests: number[];
  hintsUsed: Record<number, number>;
  /** Photo checks per quest that came back unsure or failed to connect. */
  attempts: Record<number, number>;
  verificationMethod: Record<number, VerificationMethod>;
  /** Optional bonus mysteries found. They never count toward completion. Absent when none. */
  bonusFound?: number[];
  /**
   * Finds in stops that are no longer in the adventure's lineup (switched off,
   * or swapped for a reserve). Kept so they come back if the stop returns.
   * Absent when none.
   */
  retiredFinds?: number[];
}

/** Quest ids an adventure state may hold besides its required lineup. */
export interface ExtraQuestIds {
  bonus?: number[];
  /** Reserve or switched-off stops: finds there are kept, but not counted. */
  other?: number[];
}

export const emptyProfile: PlayerProfile = { onboardingComplete: false };

export const freshAdventure = (firstQuest: number): AdventureState => ({
  status: "not_started",
  currentQuest: firstQuest,
  completedQuests: [],
  hintsUsed: {},
  attempts: {},
  verificationMethod: {},
});

const STATUSES: AdventureStatus[] = ["not_started", "in_progress", "ended_early", "completed"];
const METHODS: VerificationMethod[] = ["ai-photo", "grown-up", "manual"];

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isTime = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

/** Keeps only entries whose key is a known quest and whose value passes `ok`. */
function record<T>(v: unknown, questIds: number[], ok: (x: unknown) => x is T): Record<number, T> {
  const out: Record<number, T> = {};
  if (!isObject(v)) return out;
  for (const [k, x] of Object.entries(v)) {
    if (questIds.includes(Number(k)) && ok(x)) out[Number(k)] = x;
  }
  return out;
}

const isCount = (x: unknown): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0 && x < 1000;
const isHintCount = (x: unknown): x is number => x === 0 || x === 1 || x === 2;
const isMethod = (x: unknown): x is VerificationMethod => METHODS.includes(x as VerificationMethod);

export function parseProfile(raw: unknown, avatarIds: string[], adventureIds: string[]): PlayerProfile {
  if (!isObject(raw)) return emptyProfile;
  const age = AGE_CHOICES.includes(raw.age as AgeChoice) ? (raw.age as AgeChoice) : undefined;
  const avatarId = typeof raw.avatarId === "string" && avatarIds.includes(raw.avatarId) ? raw.avatarId : undefined;
  // Never assumed: until the player picks one (or picks again after one was taken
  // down), the game asks right after START THE HUNT.
  const adventureId = typeof raw.adventureId === "string" && adventureIds.includes(raw.adventureId) ? raw.adventureId : undefined;
  // Onboarding (age and explorer) is only complete when both choices survived validation.
  return { age, avatarId, adventureId, onboardingComplete: raw.onboardingComplete === true && !!age && !!avatarId };
}

const ids = (v: unknown): number[] => (Array.isArray(v) ? v.filter((q): q is number => Number.isInteger(q)) : []);

export function parseAdventure(raw: unknown, questIds: number[], extra: ExtraQuestIds = {}): AdventureState {
  const fresh = freshAdventure(questIds[0]);
  if (!isObject(raw)) return fresh;
  const bonusIds = extra.bonus ?? [];
  const otherIds = extra.other ?? [];
  const everything = [...questIds, ...bonusIds, ...otherIds];
  // A stop can move in or out of the lineup between visits, so finds are sorted
  // by the lineup as it is now, never dropped.
  const finds = [...new Set([...ids(raw.completedQuests), ...ids(raw.retiredFinds)])];
  const completedQuests = finds.filter((q) => questIds.includes(q));
  const retiredFinds = finds.filter((q) => otherIds.includes(q));
  const bonusFound = [...new Set(ids(raw.bonusFound).filter((q) => bonusIds.includes(q)))];
  let status: AdventureStatus = STATUSES.includes(raw.status as AdventureStatus)
    ? (raw.status as AdventureStatus)
    : // progress:v1 had only a gameStarted flag
      raw.gameStarted === true || completedQuests.length
      ? "in_progress"
      : "not_started";
  if (status === "completed" && completedQuests.length < questIds.length) status = "in_progress";
  if (status !== "completed" && completedQuests.length === questIds.length) status = "completed";
  return {
    status,
    startedAt: isTime(raw.startedAt) ? raw.startedAt : undefined,
    endedAt: isTime(raw.endedAt) ? raw.endedAt : undefined,
    completedAt: isTime(raw.completedAt) ? raw.completedAt : undefined,
    currentQuest: questIds.includes(raw.currentQuest as number) ? (raw.currentQuest as number) : fresh.currentQuest,
    completedQuests,
    hintsUsed: record(raw.hintsUsed, everything, isHintCount),
    attempts: record(raw.attempts, everything, isCount),
    verificationMethod: record(raw.verificationMethod, everything, isMethod),
    ...(bonusFound.length ? { bonusFound } : {}),
    ...(retiredFinds.length ? { retiredFinds } : {}),
  };
}

/** A bonus mystery was found. Never changes the current quest or completion. */
export function solveBonus(a: AdventureState, id: number, method: VerificationMethod): AdventureState {
  if (a.bonusFound?.includes(id)) return a;
  return { ...begin(a), bonusFound: [...(a.bonusFound ?? []), id], verificationMethod: { ...a.verificationMethod, [id]: method } };
}

const now = () => new Date().toISOString();

/** not_started / ended_early -> in_progress. Anything else is left as is. */
export function begin(a: AdventureState): AdventureState {
  if (a.status === "not_started") return { ...a, status: "in_progress", startedAt: now() };
  if (a.status === "ended_early") return { ...a, status: "in_progress", endedAt: undefined };
  return a;
}

/** in_progress -> ended_early, keeping everything found so far. */
export const endEarly = (a: AdventureState): AdventureState =>
  a.status === "in_progress" ? { ...a, status: "ended_early", endedAt: now() } : a;

/** Any state -> not_started with no progress. The profile is kept separately. */
export const restart = (firstQuest: number): AdventureState => freshAdventure(firstQuest);

export function solve(
  a: AdventureState,
  id: number,
  method: VerificationMethod,
  nextQuest: number | null,
  questIds: number[],
): AdventureState {
  const completedQuests = a.completedQuests.includes(id) ? a.completedQuests : [...a.completedQuests, id];
  const all = questIds.every((q) => completedQuests.includes(q));
  const started = begin(a);
  return {
    ...started,
    completedQuests,
    verificationMethod: { ...a.verificationMethod, [id]: method },
    currentQuest: nextQuest ?? a.currentQuest,
    ...(all ? { status: "completed" as const, completedAt: a.completedAt ?? now() } : {}),
  };
}
