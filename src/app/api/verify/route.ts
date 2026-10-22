import Anthropic from "@anthropic-ai/sdk";
import { verificationTargets } from "@/data/hidden-treasures/verification.server";
import { stripJpegMetadata } from "@/lib/server/image";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { isVerifierConfigured, verifyPhoto } from "@/lib/server/verify-photo";
import { FEEDBACK, MAX_UPLOAD_BYTES, type VerificationResult, type VerificationStatus } from "@/lib/verification";

// Photos are handled in memory only: never written to disk, logged, or kept
// after the response is sent.

function describeError(err: unknown) {
  if (err instanceof Anthropic.APIError) {
    // The API's own message (e.g. "credit balance too low") never contains request content.
    const body = (err.error as { error?: { type?: string; message?: string } } | undefined)?.error;
    return { name: err.name, status: err.status, type: body?.type, message: body?.message?.slice(0, 200), requestId: err.requestID };
  }
  return { name: err instanceof Error ? err.name : typeof err };
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

const outcome = (status: VerificationStatus): VerificationResult => ({
  status,
  artworkMatch: null,
  detailMatch: null,
  feedback: FEEDBACK[status],
});

export async function POST(request: Request) {
  const questId = Number(new URL(request.url).searchParams.get("quest"));
  const target = verificationTargets.find((t) => t.questId === questId);
  if (!target) return json({ error: "unknown_quest" }, 400);

  if (request.headers.get("content-type") !== "image/jpeg") return json({ error: "unsupported_type" }, 415);
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES) return json({ error: "too_large" }, 413);

  if (!checkRateLimit(request)) return json({ error: "rate_limited" }, 429);

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.length > MAX_UPLOAD_BYTES) return json({ error: "too_large" }, 413);
  const jpeg = stripJpegMetadata(body);
  if (!jpeg) return json(outcome("invalid_image"));

  const mock = process.env.NODE_ENV !== "production" ? process.env.VERIFY_MOCK_STATUS : undefined;
  if (mock && mock in FEEDBACK) return json(outcome(mock as VerificationStatus));

  if (!isVerifierConfigured()) return json({ error: "verifier_unavailable" }, 503);

  try {
    const verdict = await verifyPhoto(target, jpeg);
    console.log("verify: quest", questId, "->", verdict.status);
    return json(verdict);
  } catch (err) {
    // Never log the photo or the request body. The error's class, HTTP status,
    // API error type and request id are enough to debug and say nothing about the child.
    console.error("verify: model call failed for quest", questId, describeError(err));
    return json({ error: "verifier_unavailable" }, 503);
  }
}
