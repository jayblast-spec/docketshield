export { computeAnswerDeadline, daysRemaining } from "./deadline.js";
export type { DeadlineResult, ServiceMethod } from "./deadline.js";
export { triage } from "./triage.js";
export type { CaseFacts, TriageOption, TriageResult } from "./triage.js";
export { draftAnswer, renderAnswerText } from "./answer.js";
export type { AnswerDraft, CaseCaption, CounterclaimInput } from "./answer.js";
export { extractWarrant, reviewExtraction, CONFIDENCE_THRESHOLD } from "./extract.js";
export type { ExtractionReview, WarrantExtraction } from "./extract.js";
export { SOURCES } from "./rules/sources.js";
