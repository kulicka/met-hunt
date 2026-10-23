import type { AdventureStatus } from "./adventure";

// What the keepsake certificate says. The top title is only for all ten finds;
// anything else gets truthful partial wording, including at zero.

export interface CertificateText {
  kind: "full" | "explorer";
  title: string;
  statement: string;
  countLine?: string;
  /** ISO time the certificate refers to. */
  date: string;
}

const treasures = (n: number) => (n === 1 ? "1 hidden treasure" : `${n} hidden treasures`);

export function certificateText(
  a: { status: AdventureStatus; completedQuests: number[]; endedAt?: string; completedAt?: string },
  total: number,
  name: string,
  now = new Date().toISOString(),
): CertificateText {
  const n = a.completedQuests.length;
  if (a.status === "completed" && n === total) {
    return {
      kind: "full",
      title: "LEGENDARY ART DETECTIVE",
      statement: `This certifies that ${name} discovered all ${total} hidden treasures at The Met.`,
      countLine: `${total}/${total} treasures discovered`,
      date: a.completedAt ?? now,
    };
  }
  const statement =
    n === 0
      ? `${name} began a museum adventure.`
      : a.status === "ended_early"
        ? `${name} discovered ${treasures(n)} during a museum adventure.`
        : `${name} has discovered ${treasures(n)} so far on a museum adventure.`;
  return {
    kind: "explorer",
    title: "EXPLORER OF HIDDEN TREASURES",
    statement,
    countLine: n > 0 ? `${n} of ${total} treasures discovered` : undefined,
    date: (a.status === "ended_early" && a.endedAt) || now,
  };
}
