/**
 * Georgia state holidays, as published by Georgia.gov.
 * Magistrate courts close on state holidays, which moves a deadline that
 * lands on one to the next business day.
 *
 * Only years with an official, verified list are included. For any other
 * year the engine refuses to guess and reports that the holiday calendar
 * is unverified (fail closed, never silently wrong).
 */
export const GEORGIA_STATE_HOLIDAYS: Readonly<Record<number, readonly string[]>> = {
  2026: [
    "2026-01-01", // New Year's Day
    "2026-01-19", // Martin Luther King, Jr.'s Birthday
    "2026-04-03", // State Holiday (observed Good Friday)
    "2026-05-25", // Memorial Day
    "2026-06-19", // Juneteenth
    "2026-07-03", // Independence Day (observed)
    "2026-09-07", // Labor Day
    "2026-10-12", // Columbus Day
    "2026-11-11", // Veterans Day
    "2026-11-26", // Thanksgiving Day
    "2026-11-27", // State Holiday
    "2026-12-24", // Washington's Birthday (observed)
    "2026-12-25", // Christmas Day
  ],
};

export function hasVerifiedHolidayCalendar(year: number): boolean {
  return year in GEORGIA_STATE_HOLIDAYS;
}

const HOLIDAY_NAMES: Readonly<Record<string, string>> = {
  "2026-01-01": "New Year's Day",
  "2026-01-19": "Martin Luther King, Jr.'s Birthday",
  "2026-04-03": "State Holiday (Good Friday)",
  "2026-05-25": "Memorial Day",
  "2026-06-19": "Juneteenth",
  "2026-07-03": "Independence Day (observed)",
  "2026-09-07": "Labor Day",
  "2026-10-12": "Columbus Day",
  "2026-11-11": "Veterans Day",
  "2026-11-26": "Thanksgiving Day",
  "2026-11-27": "State Holiday (day after Thanksgiving)",
  "2026-12-24": "Washington's Birthday (observed)",
  "2026-12-25": "Christmas Day",
};

export function georgiaHolidayName(isoDate: string): string | null {
  return isGeorgiaStateHoliday(isoDate) ? HOLIDAY_NAMES[isoDate] ?? "Georgia state holiday" : null;
}

export function isGeorgiaStateHoliday(isoDate: string): boolean {
  const year = Number(isoDate.slice(0, 4));
  return GEORGIA_STATE_HOLIDAYS[year]?.includes(isoDate) ?? false;
}
