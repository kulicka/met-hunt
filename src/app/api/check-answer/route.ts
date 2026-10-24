import { questAnswer, verificationTarget } from "@/adventures/registry.server";
import { checkAnswer } from "@/lib/answer-match";
import { checkAnswerRateLimit } from "@/lib/server/rate-limit";

// "Continue without a photo": checks a typed artwork name or accession number
// against the quest's curated answers. Deterministic and first-party: the text
// goes to no other service, and is never logged or kept. The response says only
// whether it matched, never what the answer is.

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  let body: { adventure?: unknown; quest?: unknown; answer?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const adventureId = typeof body.adventure === "string" ? body.adventure : null;
  const questId = typeof body.quest === "number" ? body.quest : NaN;
  if (typeof body.answer !== "string" || body.answer.length > 200) return json({ error: "bad_request" }, 400);
  if (!verificationTarget(adventureId, questId)) return json({ error: "unknown_quest" }, 400);
  if (!checkAnswerRateLimit(request)) return json({ error: "rate_limited" }, 429);
  return json({ result: checkAnswer(body.answer, questAnswer(adventureId, questId)) });
}
