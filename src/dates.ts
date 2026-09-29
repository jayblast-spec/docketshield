/**
 * Calendar-date arithmetic on plain ISO dates (YYYY-MM-DD).
 * Court deadlines are calendar days in the court's local zone, so we never
 * touch wall-clock time or the host machine's timezone here.
 */
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function assertIsoDate(value: string): void {
  const m = ISO.exec(value);
  if (!m) throw new Error(`Expected a date as YYYY-MM-DD, got "${value}"`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    throw new Error(`"${value}" is not a real calendar date`);
  }
}

export function addDays(isoDate: string, days: number): string {
  assertIsoDate(isoDate);
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(isoDate: string): number {
  assertIsoDate(isoDate);
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(isoDate: string): boolean {
  const dow = dayOfWeek(isoDate);
  return dow === 0 || dow === 6;
}

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function weekdayName(isoDate: string): string {
  return WEEKDAY_NAMES[dayOfWeek(isoDate)]!;
}
