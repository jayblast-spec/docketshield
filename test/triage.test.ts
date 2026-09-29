import { describe, expect, it } from "vitest";
import { triage } from "../src/triage.js";

const ids = (facts: Parameters<typeof triage>[0]) => triage(facts).options.map((o) => o.id);

describe("triage: options grounded in the Fulton County Tenant Pamphlet", () => {
  it("offers pay-and-stay only for a first filing in 12 months with full payment available", () => {
    expect(ids({ reason: "nonpayment", firstFilingIn12Months: true, canPayAllOwedPlusCosts: true })).toContain("pay-and-stay");
    expect(ids({ reason: "nonpayment", firstFilingIn12Months: false, canPayAllOwedPlusCosts: true })).not.toContain("pay-and-stay");
    expect(ids({ reason: "nonpayment", firstFilingIn12Months: true, canPayAllOwedPlusCosts: false })).not.toContain("pay-and-stay");
  });

  it("tells the tenant to plead a refused tender when the landlord refused payment", () => {
    const opt = triage({ reason: "nonpayment", firstFilingIn12Months: true, canPayAllOwedPlusCosts: true, landlordRefusedPayment: true })
      .options.find((o) => o.id === "pay-and-stay");
    expect(opt?.action).toMatch(/offered but refused/);
  });

  it("flags illegal self-help eviction as a counterclaim", () => {
    expect(ids({ lockedOut: true })).toContain("self-help-counterclaim");
    expect(ids({ utilitiesShutOff: true })).toContain("self-help-counterclaim");
  });

  it("requires a written, ignored repair request for repair-and-deduct", () => {
    expect(ids({ repairRequestedInWriting: true, repairIgnored: true })).toContain("repair-and-deduct");
    expect(ids({ repairRequestedInWriting: false, repairIgnored: true })).not.toContain("repair-and-deduct");
  });

  it("states plainly that hardship is not a defense for nonpayment", () => {
    expect(triage({ reason: "nonpayment" }).cautions.join(" ")).toMatch(/not accept inability to pay/);
  });

  it("never invents options from unknown facts", () => {
    expect(triage({}).options).toHaveLength(0);
  });

  it("always carries the legal-information disclaimer and free-help routes", () => {
    const d = triage({}).disclaimer;
    expect(d).toMatch(/not legal advice/);
    expect(d).toMatch(/Housing Court Assistance Center/);
  });
});
