import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { VerificationTarget } from "@/data/types";
import { FEEDBACK, type VerificationResult, type VerificationStatus } from "@/lib/verification";

const MODEL = "claude-opus-5-5";
const TIMEOUT_MS = 25_000;

const SYSTEM = `You check photos for a children's scavenger hunt at The Metropolitan Museum of Art.
A child has photographed a painting with a phone to show they found a small hidden detail.

Judge only the artwork. Museum photos are often tilted, blurry, glare-streaked, partly cropped,
or include frames, wall labels, or other visitors. People in the photo are irrelevant: never
identify, describe, or comment on any person who is physically present.

Do not require perfect framing. Accept either:
- the whole artwork, if the hidden detail can reasonably be seen in it; or
- a close-up of the hidden detail with enough surrounding context to tie it to the intended artwork.

Be generous when the evidence is reasonable; a child should not fail on a fair photo.
Answer only with the requested JSON.`;

const ModelVerdict = z.object({
  image_usable: z.boolean(),
  artwork_visible: z.enum(["yes", "no", "unclear"]),
  detail_visible: z.enum(["yes", "no", "unclear"]),
  confidence: z.number(),
});
type ModelVerdict = z.infer<typeof ModelVerdict>;

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    image_usable: { type: "boolean", description: "False if the photo is black, blank, or too blurry to judge anything." },
    artwork_visible: { type: "string", enum: ["yes", "no", "unclear"], description: "Is the intended artwork in the photo?" },
    detail_visible: { type: "string", enum: ["yes", "no", "unclear"], description: "Is the intended hidden detail visible?" },
    confidence: { type: "number", description: "0 to 1: how sure you are about artwork_visible and detail_visible together." },
  },
  required: ["image_usable", "artwork_visible", "detail_visible", "confidence"],
  additionalProperties: false,
} as const;

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 1 }));

export function isVerifierConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function verifyPhoto(target: VerificationTarget, jpeg: Uint8Array): Promise<VerificationResult> {
  const response = await getClient().beta.messages.create({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: { type: "json_schema", schema: VERDICT_SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(jpeg).toString("base64") } },
          {
            type: "text",
            text: [
              `Intended artwork: “${target.artwork}” by ${target.artist}.`,
              `Hidden detail: ${target.hiddenObject}.`,
              `What to check: ${target.verificationDescription}`,
            ].join("\n"),
          },
        ],
      },
    ],
  });

  // Only the stop reason and served model are logged, never the model's text.
  const unclear = (why: string) => {
    console.warn(`verify: ${why} (stop_reason ${response.stop_reason}, model ${response.model})`);
    return result("uncertain", null, null);
  };
  if (response.stop_reason === "refusal") return unclear("refusal");
  const text = response.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") return unclear("no text in reply");

  let parsed: ModelVerdict;
  try {
    parsed = ModelVerdict.parse(JSON.parse(text.text));
  } catch {
    return unclear("reply did not match the verdict schema");
  }
  return normalize(parsed);
}

/** Map the model's raw judgement to a game outcome. Exported for tests. */
export function normalize(v: ModelVerdict): VerificationResult {
  const confidence = Math.min(Math.max(v.confidence, 0), 1);
  const artwork = v.artwork_visible === "yes" ? true : v.artwork_visible === "no" ? false : null;
  const detail = v.detail_visible === "yes" ? true : v.detail_visible === "no" ? false : null;

  if (!v.image_usable) return result("invalid_image", artwork, detail);
  if (artwork && detail && confidence >= 0.5) return result("verified", true, true);
  if (artwork && detail) return result("uncertain", true, true);
  if (artwork) return result("likely", true, detail);
  if (artwork === false && confidence >= 0.7) return result("not_found", false, detail);
  return result("uncertain", artwork, detail);
}

function result(status: VerificationStatus, artworkMatch: boolean | null, detailMatch: boolean | null): VerificationResult {
  return { status, artworkMatch, detailMatch, feedback: FEEDBACK[status] };
}
