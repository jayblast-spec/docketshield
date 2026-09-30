import { extractWarrant } from "../dist/extract.js";
import { HttpError, handle, json, preflight, rateLimit, readJson } from "./_http.js";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/heic", "application/pdf"];

export const OPTIONS = preflight;

export const POST = handle(async (req) => {
  rateLimit(req, 6, 60_000);
  const body = await readJson(req);
  const mimeType = String(body.mimeType ?? "");
  let base64 = String(body.image ?? "");
  if (!ALLOWED.includes(mimeType)) throw new HttpError(415, `Unsupported file type. Use one of: ${ALLOWED.join(", ")}`);
  base64 = base64.replace(/^data:[^;]+;base64,/, "");
  if (base64.length < 100) throw new HttpError(400, "image (base64) is required");

  const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey) throw new HttpError(503, "Document reading is not configured on this deployment");

  // The photo is processed in memory and never stored or logged.
  const result = await extractWarrant({ base64, mimeType }, { apiKey });
  return json(result);
});
