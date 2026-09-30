import { computeAnswerDeadline, daysRemaining, type ServiceMethod } from "../dist/deadline.js";
import { HttpError, handle, json, preflight, readJson } from "./_http.js";

const METHODS: ServiceMethod[] = ["personal", "left-with-adult", "tack-and-mail", "unknown"];

export const OPTIONS = preflight;

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const serviceDate = body.serviceDate;
  if (typeof serviceDate !== "string") throw new HttpError(400, "serviceDate (YYYY-MM-DD) is required");
  const method = (METHODS as unknown[]).includes(body.serviceMethod) ? (body.serviceMethod as ServiceMethod) : "unknown";
  const result = computeAnswerDeadline(serviceDate, method);
  const today = typeof body.today === "string" ? body.today : new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  return json({ ...result, daysRemaining: daysRemaining(result.deadline, today), today });
});
