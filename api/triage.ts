import { triage, type CaseFacts } from "../dist/triage.js";
import { handle, json, preflight, readJson } from "./_http.js";

export const OPTIONS = preflight;

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const facts = (body.facts && typeof body.facts === "object" ? body.facts : {}) as CaseFacts;
  return json(triage(facts));
});
