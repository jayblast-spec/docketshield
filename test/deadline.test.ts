import { describe, expect, it } from "vitest";
import { computeAnswerDeadline, daysRemaining } from "../src/deadline.js";

describe("computeAnswerDeadline: Georgia 7-day dispossessory Answer rule", () => {
  it("lands on day 7 when day 7 is an open weekday", () => {
    // Wed Sep 30 2026 + 7 = Wed Oct 7 2026
    const r = computeAnswerDeadline("2026-09-30", "personal");
    expect(r.deadline).toBe("2026-10-07");
    expect(r.deadlineWeekday).toBe("Wednesday");
    expect(r.rolledForward).toBe(false);
    expect(r.cutoff).toBe("5:00 PM");
  });

  it("counts weekends that fall inside the 7-day window", () => {
    // Fri Sep 25 -> window spans Sat/Sun -> day 7 is Fri Oct 2
    expect(computeAnswerDeadline("2026-09-25", "personal").deadline).toBe("2026-10-02");
  });

  it("rolls past a weekend and a state holiday stacked together", () => {
    // Sat Oct 3 + 7 = Sat Oct 10 -> Sun Oct 11 -> Mon Oct 12 (Columbus Day) -> Tue Oct 13
    const r = computeAnswerDeadline("2026-10-03", "personal");
    expect(r.seventhDay).toBe("2026-10-10");
    expect(r.deadline).toBe("2026-10-13");
    expect(r.rolledForward).toBe(true);
    expect(r.trace.filter((s) => s.note.startsWith("Skipped"))).toHaveLength(3);
  });

  it("rolls through the Thanksgiving double holiday and the weekend after it", () => {
    // Thu Nov 19 + 7 = Thu Nov 26 (Thanksgiving) -> Fri Nov 27 (state holiday) -> Sat -> Sun -> Mon Nov 30
    expect(computeAnswerDeadline("2026-11-19", "personal").deadline).toBe("2026-11-30");
  });

  it("rolls through Georgia's Dec 24 + Dec 25 closures", () => {
    // Thu Dec 17 + 7 = Thu Dec 24 (Washington's Birthday observed) -> Fri Dec 25 -> Sat -> Sun -> Mon Dec 28
    expect(computeAnswerDeadline("2026-12-17", "personal").deadline).toBe("2026-12-28");
  });

  it("fails closed with a warning when the holiday calendar for a year is unverified", () => {
    const r = computeAnswerDeadline("2026-12-28", "personal"); // day 7 = Mon Jan 4 2027
    expect(r.deadline).toBe("2027-01-04");
    expect(r.warnings.some((w) => w.includes("2027"))).toBe(true);
  });

  it("warns on tack-and-mail and unknown service methods", () => {
    expect(computeAnswerDeadline("2026-09-30", "tack-and-mail").warnings.join(" ")).toMatch(/clerk/);
    expect(computeAnswerDeadline("2026-09-30").warnings.join(" ")).toMatch(/papers/);
    expect(computeAnswerDeadline("2026-09-30", "personal").warnings).toHaveLength(0);
  });

  it("rejects malformed and impossible dates instead of guessing", () => {
    expect(() => computeAnswerDeadline("09/30/2026")).toThrow();
    expect(() => computeAnswerDeadline("2026-02-30")).toThrow();
  });

  it("cites its primary sources", () => {
    expect(computeAnswerDeadline("2026-09-30").sources).toContain("fultonTenantPamphlet");
  });
});

describe("daysRemaining", () => {
  it("counts calendar days and goes negative after the deadline", () => {
    expect(daysRemaining("2026-10-07", "2026-09-30")).toBe(7);
    expect(daysRemaining("2026-10-07", "2026-10-07")).toBe(0);
    expect(daysRemaining("2026-10-07", "2026-10-09")).toBe(-2);
  });
});

describe("trace: readable, typed timeline", () => {
  it("names the holiday, types every step, and ends on the deadline", () => {
    const r = computeAnswerDeadline("2026-10-03", "personal");
    expect(r.trace.map((s) => s.kind)).toEqual(["served", "window", "skipped", "skipped", "skipped", "deadline"]);
    expect(r.trace.find((s) => s.date === "2026-10-12")?.note).toMatch(/Columbus Day/);
    expect(r.trace.at(-1)).toMatchObject({ date: "2026-10-13", kind: "deadline" });
  });
});
