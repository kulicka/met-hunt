import { verificationTargets } from "@/data/hidden-treasures/verification.server";
import { stripJpegMetadata } from "@/lib/server/image";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { isVerifierConfigured, verifyPhoto } from "@/lib/server/verify-photo";
import { FEEDBACK, MAX_UPLOAD_BYTES, type VerificationResult, type VerificationStatus } from "@/lib/verification";

// Photos are handled in memory only: never written to disk, logged, or kept
// after the response is sent.

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
    return json(await verifyPhoto(target, jpeg));
  } catch {
    // Deliberately no error details or payload in logs.
    console.error("verify: model call failed for quest", questId);
    return json({ error: "verifier_unavailable" }, 503);
  }
}
