import { computeAnswerDeadline, daysRemaining, UnverifiedCalendarError, type ServiceMethod } from "../dist/deadline.js";
import { HttpError, handle, json, preflight, readJson } from "./_http.js";

const METHODS: ServiceMethod[] = ["personal", "left-with-adult", "tack-and-mail", "unknown"];

export const OPTIONS = preflight;

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const serviceDate = body.serviceDate;
  if (typeof serviceDate !== "string") throw new HttpError(400, "serviceDate (YYYY-MM-DD) is required");
  const method = (METHODS as unknown[]).includes(body.serviceMethod) ? (body.serviceMethod as ServiceMethod) : "unknown";
  let result;
  try {
    result = computeAnswerDeadline(serviceDate, method);
  } catch (error) {
    if (error instanceof UnverifiedCalendarError) throw new HttpError(422, error.message);
    throw error;
  }
  if (typeof body.printedAnswerDeadline === "string" && body.printedAnswerDeadline !== "" && body.printedAnswerDeadline !== result.deadline) {
    result.warnings.push(`Your papers show ${body.printedAnswerDeadline}, but the calculation gives ${result.deadline}. Contact the clerk today to resolve this conflict; do not wait beyond the earlier date.`);
  }
  const today = typeof body.today === "string" ? body.today : new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return json({ ...result, daysRemaining: daysRemaining(result.deadline, today), today });
});
