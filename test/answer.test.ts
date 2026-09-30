import { describe, expect, it } from "vitest";
import { draftAnswer, renderAnswerText } from "../src/answer.js";
import { triage } from "../src/triage.js";

const caption = { county: "Fulton", caseNumber: "26ED123456", plaintiff: "Example Properties LLC", defendant: "Jane Doe" };

describe("draftAnswer: mirrors Georgia's official dispossessory Answer form", () => {
  it("checks the Safe-at-Home 3-day-notice box only for leases on/after 2024-07-01", () => {
    const covered = draftAnswer({ threeDayNoticeReceived: false, leaseStartDate: "2025-03-01" }, caption);
    expect(covered.grounds.map((g) => g.id)).toContain("no-three-day-notice");
    const older = draftAnswer({ threeDayNoticeReceived: false, leaseStartDate: "2023-05-01" }, caption);
    expect(older.grounds.map((g) => g.id)).not.toContain("no-three-day-notice");
  });

  it("records the fact that justifies every checked box", () => {
    const d = draftAnswer({ offeredRentOnTimeRefused: true, hasSection8Voucher: true }, caption);
    expect(d.grounds).toHaveLength(2);
    for (const g of d.grounds) expect(g.because.length).toBeGreaterThan(10);
  });

  it("fills the correct rent amount, or leaves a visible blank and flags it as missing", () => {
    const filled = draftAnswer({ rentClaimedIncorrect: true, correctRentAmount: "$1,150.00" }, caption);
    expect(filled.grounds[0]?.text).toContain("$1,150.00");
    const blank = draftAnswer({ rentClaimedIncorrect: true }, caption);
    expect(blank.grounds[0]?.text).toContain("________");
    expect(blank.missing.join(" ")).toMatch(/correct rent amount/);
  });

  it("only claims repair costs when receipts were kept", () => {
    const facts = { repairRequestedInWriting: true, repairIgnored: true };
    expect(draftAnswer({ ...facts, keptRepairReceipts: false }, caption, { repairCosts: "$400" }).counterclaims).toHaveLength(0);
    expect(draftAnswer({ ...facts, keptRepairReceipts: true }, caption, { repairCosts: "$400" }).counterclaims[0]?.id).toBe("repair-costs");
  });

  it("never checks the bare 'no money' box, which is not a defense on its own", () => {
    const d = draftAnswer({ reason: "nonpayment" }, caption);
    expect(d.grounds.map((g) => g.id)).not.toContain("no-money");
    expect(d.missing.join(" ")).toMatch(/legal aid/);
  });

  it("lists caption fields the tenant still has to supply", () => {
    const d = draftAnswer({ noMoneyOwed: true }, { county: "DeKalb" });
    expect(d.missing.join(" ")).toMatch(/Case number/);
    expect(d.missing.join(" ")).toMatch(/Plaintiff name/);
  });

  it("renders a paper-form layout with caption, checked boxes, prayer and certificate", () => {
    const text = renderAnswerText(draftAnswer({ noMoneyOwed: true }, caption));
    expect(text).toMatch(/IN THE MAGISTRATE COURT OF FULTON COUNTY/);
    expect(text).toMatch(/\[X\] I do not owe money to my landlord\./);
    expect(text).toMatch(/\(a\) Dismiss Plaintiff's lawsuit/);
    expect(text).toMatch(/United States Mail/);
  });
});

describe("triage: Safe-at-Home 3-day notice", () => {
  it("is a defense for covered leases and a check when the lease date is unknown", () => {
    expect(triage({ threeDayNoticeReceived: false, leaseStartDate: "2025-01-15" }).options.find((o) => o.id === "no-three-day-notice")?.kind).toBe("defense");
    expect(triage({ threeDayNoticeReceived: false }).options.find((o) => o.id === "no-three-day-notice")?.kind).toBe("check");
    expect(triage({ threeDayNoticeReceived: false, leaseStartDate: "2022-01-01" }).options.find((o) => o.id === "no-three-day-notice")).toBeUndefined();
  });
});

describe("draftAnswer: illegal self-help eviction", () => {
  it("adds the form's 'not entitled to evict' line listing each self-help act", () => {
    const d = draftAnswer({ lockedOut: true, utilitiesShutOff: true }, caption);
    const g = d.grounds.find((x) => x.id === "not-entitled-other");
    expect(g?.text).toMatch(/not entitled to evict me/);
    expect(g?.text).toMatch(/changed the locks/);
    expect(g?.text).toMatch(/shut off my utilities/);
  });

  it("renders a signature block that survives narrow screens", () => {
    const text = renderAnswerText(draftAnswer({ noMoneyOwed: true }, caption));
    // Sentences wrap naturally; unbreakable runs (long underscores, no spaces) are what overflow a phone.
    for (const run of text.split(/\s+/)) expect(run.length).toBeLessThanOrEqual(28);
    expect(text).toMatch(/Defendant signature:/);
  });
});
