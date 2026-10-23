// Shape of POST /api/verify responses, shared by the route and the client.
// Feedback strings are fixed per status so the model's own words (which might
// name the hidden object) never reach the child.

export type VerificationStatus = "verified" | "likely" | "not_found" | "uncertain" | "invalid_image";

export interface VerificationResult {
  status: VerificationStatus;
  artworkMatch: boolean | null;
  detailMatch: boolean | null;
  feedback: string;
  /** The model that served the check, for analytics. Never the model's own words. */
  model?: string;
}

export const FEEDBACK: Record<VerificationStatus, string> = {
  verified: "That’s the one!",
  likely: "You may have the right painting. Can you get a clearer shot of the hidden treasure?",
  not_found: "This doesn’t look like our mystery painting yet.",
  uncertain: "Try another photo — zooming in a little may help.",
  invalid_image: "That photo didn’t come through. Try taking another one.",
};

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
