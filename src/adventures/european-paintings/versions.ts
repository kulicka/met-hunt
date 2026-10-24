import type { QuestVersion } from "../types";

// Stable content IDs and published versions, for analytics (analytics spec, section 7).
// Results are compared by these versions, never by display titles or gallery numbers alone.
//
// RULES:
// - IDs never change or get reused. A new artwork in a quest gets a new artworkId.
// - Changing a riddle or hint text means bumping riddleVersion / hintSetVersion,
//   updating its fingerprint, bumping CONTENT_PACK_VERSION, and adding a line to
//   docs/content-versions.md. A test fails if the text changes without that.
// - The ten approved riddles stay as they are until the owner approves an edit.
// - IDs are opaque on purpose: they ship to the browser and must not give away answers.

export const CONTENT_PACK_VERSION = "2026.10.22-1";

const v = (questId: number, galleryId: number, riddleFingerprint: string, hintsFingerprint: string): QuestVersion => {
  const n = String(questId).padStart(2, "0");
  return {
    questId,
    key: `q${n}`,
    galleryId,
    artworkId: `art-${n}`,
    hiddenDetailId: `detail-${n}`,
    riddleVersion: "r1",
    hintSetVersion: "h1",
    artworkAssignmentVersion: "a1",
    riddleFingerprint,
    hintsFingerprint,
  };
};

export const questVersions: QuestVersion[] = [
  v(1, 810, "31101e5f", "e9bb955f"),
  v(2, 815, "c6326a71", "3a91783f"),
  v(3, 816, "5c8383a2", "eb8f2c19"),
  v(4, 817, "16d4ae0b", "d99505c6"),
  v(5, 818, "53dc6b1b", "71557edf"),
  v(6, 819, "4cb53335", "c3e3c135"),
  v(7, 821, "d850b510", "3adeffbb"),
  v(8, 822, "16443823", "ff838119"),
  v(9, 824, "065e9599", "ce005f65"),
  v(10, 825, "82bcfa91", "cdbbf734"),
];

export const questVersion = (questId: number) => questVersions.find((q) => q.questId === questId);
