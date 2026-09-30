import { draftAnswer, renderAnswerText, type CaseCaption, type CounterclaimInput } from "../dist/answer.js";
import type { CaseFacts } from "../dist/triage.js";
import { HttpError, handle, json, preflight, readJson } from "./_http.js";

export const OPTIONS = preflight;

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const caption = body.caption as CaseCaption | undefined;
  if (!caption || typeof caption.county !== "string" || caption.county.trim() === "") {
    throw new HttpError(400, "caption.county is required");
  }
  const facts = (body.facts ?? {}) as CaseFacts;
  const cc = (body.counterclaims ?? {}) as CounterclaimInput;
  const draft = draftAnswer(facts, caption, cc);
  return json({ draft, text: renderAnswerText(draft) });
});
