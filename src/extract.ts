import { computeAnswerDeadline, type ServiceMethod } from "./deadline.js";

/**
 * Document-extraction agent for Georgia dispossessory warrants.
 *
 * Design contract:
 *  - The model returns every field with a confidence score and the exact
 *    text it read (evidence), so a human can verify it at a glance.
 *  - Nothing the model says is trusted blindly: dates are re-validated,
 *    enums are checked, and low-confidence fields are routed to the tenant
 *    for confirmation before any deadline is computed.
 *  - The printed "last day to answer" is cross-checked against the rules
 *    engine; any disagreement is surfaced, never silently resolved.
 */

export interface ExtractedField<T> {
  value: T | null;
  confidence: number; // 0..1
  evidence: string; // verbatim text read from the page
}

export interface WarrantExtraction {
  county: ExtractedField<string>;
  caseNumber: ExtractedField<string>;
  plaintiff: ExtractedField<string>;
  defendant: ExtractedField<string>;
  propertyAddress: ExtractedField<string>;
  serviceDate: ExtractedField<string>;
  serviceMethod: ExtractedField<ServiceMethod>;
  claimReason: ExtractedField<"nonpayment" | "lease-breach" | "holdover" | "other">;
  amountClaimed: ExtractedField<string>;
  printedAnswerDeadline: ExtractedField<string>;
}

export type FieldName = keyof WarrantExtraction;

export interface ExtractionReview {
  fields: WarrantExtraction;
  /** Fields the tenant must confirm or fill before we rely on them. */
  needsConfirmation: FieldName[];
  /** Cross-checks between the paper and the rules engine. */
  checks: { kind: "deadline-match" | "deadline-mismatch" | "no-printed-deadline"; message: string }[];
}

export const CONFIDENCE_THRESHOLD = 0.85;

const FIELD_NAMES: FieldName[] = [
  "county",
  "caseNumber",
  "plaintiff",
  "defendant",
  "propertyAddress",
  "serviceDate",
  "serviceMethod",
  "claimReason",
  "amountClaimed",
  "printedAnswerDeadline",
];
const DATE_FIELDS: FieldName[] = ["serviceDate", "printedAnswerDeadline"];
const ENUMS: Partial<Record<FieldName, readonly string[]>> = {
  serviceMethod: ["personal", "left-with-adult", "tack-and-mail", "unknown"],
  claimReason: ["nonpayment", "lease-breach", "holdover", "other"],
};
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(v: string): boolean {
  if (!ISO.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

function normalizeField(name: FieldName, raw: unknown): ExtractedField<string> {
  const empty = { value: null, confidence: 0, evidence: "" };
  if (!raw || typeof raw !== "object") return empty;
  const r = raw as Record<string, unknown>;
  let value = typeof r.value === "string" && r.value.trim() !== "" ? r.value.trim() : null;
  let confidence = typeof r.confidence === "number" && Number.isFinite(r.confidence) ? Math.min(1, Math.max(0, r.confidence)) : 0;
  const evidence = typeof r.evidence === "string" ? r.evidence.slice(0, 300) : "";

  if (value !== null && DATE_FIELDS.includes(name) && !isRealIsoDate(value)) {
    value = null;
    confidence = 0;
  }
  const allowed = ENUMS[name];
  if (value !== null && allowed && !allowed.includes(value)) {
    value = null;
    confidence = 0;
  }
  // A value with no supporting text on the page is not trusted.
  if (value !== null && evidence.trim() === "") confidence = Math.min(confidence, 0.5);
  return { value, confidence, evidence };
}

/** Validate and cross-check raw model output. Pure: safe to unit test. */
export function reviewExtraction(raw: unknown): ExtractionReview {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const fields = Object.fromEntries(FIELD_NAMES.map((n) => [n, normalizeField(n, obj[n])])) as unknown as WarrantExtraction;

  const needsConfirmation = FIELD_NAMES.filter((n) => fields[n].value === null || fields[n].confidence < CONFIDENCE_THRESHOLD);

  const checks: ExtractionReview["checks"] = [];
  const served = fields.serviceDate.value;
  const printed = fields.printedAnswerDeadline.value;
  if (served) {
    const computed = computeAnswerDeadline(served, (fields.serviceMethod.value as ServiceMethod | null) ?? "unknown").deadline;
    if (!printed) {
      checks.push({ kind: "no-printed-deadline", message: `No deadline was read from the papers. By Georgia's rule it is ${computed} at 5:00 PM; confirm with the clerk.` });
    } else if (printed === computed) {
      checks.push({ kind: "deadline-match", message: `The papers and Georgia's rule agree: answer by ${computed}, 5:00 PM.` });
    } else {
      checks.push({
        kind: "deadline-mismatch",
        message: `The papers say ${printed}, but Georgia's rule from the service date gives ${computed}. Use the EARLIER date and call the clerk today.`,
      });
      if (!needsConfirmation.includes("serviceDate")) needsConfirmation.push("serviceDate");
    }
  }
  return { fields, needsConfirmation, checks };
}

const EXTRACTION_PROMPT = `You are reading a Georgia magistrate court dispossessory warrant / summons served on a tenant.
Extract each field below. For every field return {"value", "confidence", "evidence"}:
- value: the normalized value, or null if it is not clearly present. NEVER guess.
- confidence: 0 to 1, how sure you are the value is exactly right.
- evidence: the exact text you read from the page that supports the value ("" if none).
Normalization rules:
- Dates as YYYY-MM-DD.
- serviceMethod: one of "personal", "left-with-adult", "tack-and-mail", "unknown".
- claimReason: one of "nonpayment", "lease-breach", "holdover", "other".
- county: county name only, e.g. "Fulton".
- printedAnswerDeadline: only if the papers state a last day to answer.
Fields: county, caseNumber, plaintiff, defendant, propertyAddress, serviceDate, serviceMethod, claimReason, amountClaimed, printedAnswerDeadline.
Return one JSON object keyed by field name.`;

const fieldSchema = (enumValues?: readonly string[]) => ({
  type: "OBJECT",
  properties: {
    value: enumValues ? { type: "STRING", nullable: true, enum: [...enumValues] } : { type: "STRING", nullable: true },
    confidence: { type: "NUMBER" },
    evidence: { type: "STRING" },
  },
  required: ["value", "confidence", "evidence"],
});

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: Object.fromEntries(FIELD_NAMES.map((n) => [n, fieldSchema(ENUMS[n])])),
  required: FIELD_NAMES,
};

export interface ExtractOptions {
  apiKey: string;
  models?: string[]; // tried in order; falls through on rate limits / outages
  fetchImpl?: typeof fetch;
}

export async function extractWarrant(
  image: { base64: string; mimeType: string },
  opts: ExtractOptions,
): Promise<ExtractionReview & { model: string }> {
  const models = opts.models ?? ["gemini-flash-latest", "gemini-flash-lite-latest"];
  const f = opts.fetchImpl ?? fetch;
  let lastError = "";
  for (const model of models) {
    const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: EXTRACTION_PROMPT }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA },
      }),
    });
    if (res.status === 429 || res.status >= 500) {
      lastError = `${model}: HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) throw new Error(`Extraction failed (${model}): HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const body = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Extraction returned non-JSON output from ${model}`);
    }
    return { ...reviewExtraction(parsed), model };
  }
  throw new Error(`All extraction models unavailable (${lastError})`);
}
