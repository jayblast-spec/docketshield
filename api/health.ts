import { json } from "./_http.js";

export function GET(): Response {
  return json({
    ok: true,
    service: "docketshield-api",
    endpoints: ["POST /api/extract", "POST /api/deadline", "POST /api/triage", "POST /api/draft"],
    extractionConfigured: Boolean(process.env.GOOGLE_AI_STUDIO_API_KEY),
  });
}
