import { describe, expect, it } from "vitest";
import { CONFIDENCE_THRESHOLD, extractWarrant, reviewExtraction } from "../src/extract.js";

const f = (value: string | null, confidence = 0.97, evidence = "text on page") => ({ value, confidence, evidence });

const good = {
  county: f("Fulton"),
  caseNumber: f("26ED123456"),
  plaintiff: f("Example Properties LLC"),
  defendant: f("Jane Doe"),
  propertyAddress: f("100 Sample St, Atlanta, GA 30303"),
  serviceDate: f("2026-10-03"),
  serviceMethod: f("personal"),
  claimReason: f("nonpayment"),
  amountClaimed: f("$1,450.00"),
  printedAnswerDeadline: f("2026-10-13"),
};

describe("reviewExtraction: never trusts the model blindly", () => {
  it("accepts a clean, confident extraction and confirms the printed deadline against the rules", () => {
    const r = reviewExtraction(good);
    expect(r.needsConfirmation).toEqual([]);
    expect(r.checks[0]?.kind).toBe("deadline-match");
  });

  it("flags a printed deadline that disagrees with Georgia's rule and tells the tenant to use the earlier date", () => {
    const r = reviewExtraction({ ...good, printedAnswerDeadline: f("2026-10-15") });
    expect(r.checks[0]?.kind).toBe("deadline-mismatch");
    expect(r.checks[0]?.message).toMatch(/EARLIER/);
    expect(r.needsConfirmation).toContain("serviceDate");
  });

  it("routes low-confidence and missing fields to the tenant", () => {
    const r = reviewExtraction({ ...good, caseNumber: f("26ED12345?", CONFIDENCE_THRESHOLD - 0.1), plaintiff: f(null, 0, "") });
    expect(r.needsConfirmation).toEqual(expect.arrayContaining(["caseNumber", "plaintiff"]));
  });

  it("rejects impossible dates and out-of-schema enums", () => {
    const r = reviewExtraction({ ...good, serviceDate: f("2026-02-31"), serviceMethod: f("carrier-pigeon") });
    expect(r.fields.serviceDate.value).toBeNull();
    expect(r.fields.serviceMethod.value).toBeNull();
    expect(r.needsConfirmation).toEqual(expect.arrayContaining(["serviceDate", "serviceMethod"]));
  });

  it("caps confidence when the model cites no evidence from the page", () => {
    const r = reviewExtraction({ ...good, amountClaimed: f("$9,999", 0.99, "") });
    expect(r.fields.amountClaimed.confidence).toBeLessThanOrEqual(0.5);
    expect(r.needsConfirmation).toContain("amountClaimed");
  });

  it("survives garbage input without throwing", () => {
    expect(reviewExtraction(null).needsConfirmation).toHaveLength(10);
    expect(reviewExtraction("not an object").fields.county.value).toBeNull();
  });
});

describe("extractWarrant: model fallback", () => {
  it("falls through a rate-limited model to the next one", async () => {
    const calls: string[] = [];
    const fakeFetch = (async (url: string) => {
      calls.push(url);
      if (url.includes("first-model")) return new Response("rate limited", { status: 429 });
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(good) }] } }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const r = await extractWarrant({ base64: "AA==", mimeType: "image/png" }, { apiKey: "test", models: ["first-model", "second-model"], fetchImpl: fakeFetch });
    expect(r.model).toBe("second-model");
    expect(calls).toHaveLength(2);
    expect(r.checks[0]?.kind).toBe("deadline-match");
  });
});
