import { addDays, assertIsoDate, isWeekend, weekdayName } from "./dates.js";
import { hasVerifiedHolidayCalendar, isGeorgiaStateHoliday } from "./rules/holidays.js";
import { SOURCES, type SourceId } from "./rules/sources.js";

export type ServiceMethod = "personal" | "left-with-adult" | "tack-and-mail" | "unknown";

export interface DeadlineStep {
  date: string;
  note: string;
}

export interface DeadlineResult {
  /** Last calendar day the Answer can be filed. */
  deadline: string;
  deadlineWeekday: string;
  /** Filing cutoff on the deadline day, court local time. */
  cutoff: "5:00 PM";
  /** The raw 7th day before any weekend/holiday rollover. */
  seventhDay: string;
  rolledForward: boolean;
  /** Human-readable reasoning, one entry per day skipped. */
  trace: DeadlineStep[];
  /** Conditions that lower confidence; the UI must surface every one. */
  warnings: string[];
  sources: SourceId[];
}

const ANSWER_WINDOW_DAYS = 7;
const MAX_ROLLOVER_DAYS = 10; // guard against a broken calendar looping forever

function closedReason(date: string): string | null {
  if (isWeekend(date)) return `${weekdayName(date)} (court closed)`;
  if (isGeorgiaStateHoliday(date)) return "Georgia state holiday (court closed)";
  return null;
}

/**
 * Georgia dispossessory Answer deadline.
 *
 * Rule (Fulton County Magistrate Court Tenant Pamphlet, Step 3 & cover):
 *  - The tenant must answer within 7 days of being served.
 *  - The 7 days include weekends and holidays.
 *  - If the 7th day is a Saturday, Sunday or legal holiday, the answer may be
 *    filed on the next day that is not; filing closes at 5:00 PM.
 *  - If no answer is filed, the landlord may seek removal on the 8th day.
 */
export function computeAnswerDeadline(
  serviceDate: string,
  method: ServiceMethod = "unknown",
): DeadlineResult {
  assertIsoDate(serviceDate);
  const warnings: string[] = [];
  const trace: DeadlineStep[] = [];

  const seventhDay = addDays(serviceDate, ANSWER_WINDOW_DAYS);
  trace.push({ date: serviceDate, note: "Served (day 0, not counted)" });
  trace.push({ date: seventhDay, note: "Day 7: weekends and holidays inside the window still count" });

  let deadline = seventhDay;
  for (let i = 0; i < MAX_ROLLOVER_DAYS; i++) {
    const reason = closedReason(deadline);
    if (!reason) break;
    trace.push({ date: deadline, note: `Skipped: ${reason}` });
    deadline = addDays(deadline, 1);
  }
  if (closedReason(deadline)) {
    throw new Error("Deadline rollover did not resolve to an open court day; holiday data is inconsistent");
  }

  for (const y of new Set([Number(seventhDay.slice(0, 4)), Number(deadline.slice(0, 4))])) {
    if (!hasVerifiedHolidayCalendar(y)) {
      warnings.push(
        `No verified Georgia holiday calendar for ${y}; weekends are handled but a holiday could move this deadline. Confirm the date printed on your papers.`,
      );
    }
  }
  if (method === "tack-and-mail") {
    warnings.push(
      "Tack-and-mail service: confirm the service date with the court clerk; the date on the papers controls.",
    );
  }
  if (method === "unknown") {
    warnings.push("Service method unknown: the last day to answer should be written on your eviction papers; if it differs, trust the papers and call the clerk.");
  }

  return {
    deadline,
    deadlineWeekday: weekdayName(deadline),
    cutoff: "5:00 PM",
    seventhDay,
    rolledForward: deadline !== seventhDay,
    trace,
    warnings,
    sources: ["fultonTenantPamphlet", "georgiaStateHolidays2026"],
  };
}

/** Days left to file, counting today; negative means the window has closed. */
export function daysRemaining(deadline: string, today: string): number {
  assertIsoDate(deadline);
  assertIsoDate(today);
  const ms = Date.parse(`${deadline}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

export { SOURCES };
