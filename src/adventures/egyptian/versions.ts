import type { QuestVersion } from "../types";

// Stable content IDs and published versions for analytics (see ../european-paintings/versions.ts for the rules).
// Keys are the spec's stable stop ids. Every stop has a row, including the bonus and
// the reserve, so a stop can be swapped in without a new key.

export const CONTENT_PACK_VERSION = "1.2.0-draft";

const v = (questId: number, key: string, galleryId: number, riddleFingerprint: string, hintsFingerprint: string): QuestVersion => ({
  questId,
  key,
  galleryId,
  artworkId: `art-${questId}`,
  hiddenDetailId: `detail-${questId}`,
  riddleVersion: "r1",
  hintSetVersion: "h1",
  artworkAssignmentVersion: "a1",
  riddleFingerprint,
  hintsFingerprint,
});

export const questVersions: QuestVersion[] = [
  v(105, "egy-105", 105, "387c83f7", "97d764e8"),
  v(107, "egy-107", 107, "f442d62a", "30bccd26"),
  v(108, "egy-108", 108, "f5c1f31d", "9b701e01"),
  v(110, "egy-110", 110, "cd246487", "3d16dc30"),
  v(111, "egy-111", 111, "f07e1e55", "3a81543e"),
  v(112, "egy-112", 112, "fcbd55f1", "72ea6131"),
  v(114, "egy-114", 114, "0814b94c", "a79fa6dc"),
  v(115, "egy-115", 115, "6224adf1", "ce49f392"),
  v(116, "egy-116", 116, "784da9d3", "b696f32b"),
  v(117, "egy-117", 117, "5a2f9c6c", "c2edc8d1"),
  v(122, "egy-122", 122, "a0c63c33", "645c2030"),
  v(123, "egy-123", 123, "75ce5f4b", "1d3864f7"),
  v(124, "egy-124", 124, "c6a64e57", "a5a763fe"),
  v(125, "egy-125", 125, "71b76db3", "3b635dcf"),
  v(1171, "egy-117-bonus-heart", 117, "8a687a48", "5b13c783"),
  v(126, "egy-126", 126, "a0e3f99a", "f001ff18"),
];
