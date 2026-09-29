import type { CaseFacts } from "./triage.js";
import {
  ANSWER_GROUNDS,
  CERTIFICATE_OF_SERVICE,
  COUNTERCLAIMS,
  PRAYER_FOR_RELIEF,
  THREE_DAY_NOTICE_LEASES_FROM,
  type AnswerGroundId,
  type CounterclaimId,
} from "./rules/answerForm.js";
import type { SourceId } from "./rules/sources.js";

export interface CaseCaption {
  county: string;
  court?: string; // e.g. "Magistrate"
  caseNumber?: string;
  plaintiff?: string;
  defendant?: string;
}

export interface CounterclaimInput {
  diminishedValuePerMonth?: string;
  diminishedValueMonths?: number;
  repairCosts?: string;
  personalPropertyDamages?: string;
}

export interface SelectedGround {
  id: AnswerGroundId;
  text: string;
  /** Which fact(s) caused this box to be checked. */
  because: string;
  warning?: string;
}

export interface AnswerDraft {
  caption: Required<Pick<CaseCaption, "county">> & CaseCaption;
  grounds: SelectedGround[];
  counterclaims: { id: CounterclaimId; text: string }[];
  prayer: readonly string[];
  certificateOfService: string;
  /** Fields the tenant must still fill by hand before filing. */
  missing: string[];
  reviewNotice: string;
  sources: SourceId[];
}

function fill(template: string, values: Record<string, string | number | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = values[k];
    return v === undefined || v === "" ? "________" : String(v);
  });
}

function groundText(id: AnswerGroundId, values: Record<string, string | undefined> = {}): string {
  const g = ANSWER_GROUNDS.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown answer ground ${id}`);
  return fill(g.formText, values);
}

/**
 * Draft a Georgia dispossessory Answer from confirmed case facts.
 * The draft only checks a box when a specific fact supports it, records that
 * fact, and never files anything: it is for the tenant or legal aid to review.
 */
export function draftAnswer(facts: CaseFacts, caption: CaseCaption, cc: CounterclaimInput = {}): AnswerDraft {
  const grounds: SelectedGround[] = [];
  const add = (id: AnswerGroundId, because: string, values?: Record<string, string | undefined>, warning?: string) =>
    grounds.push({ id, text: groundText(id, values), because, ...(warning ? { warning } : {}) });

  if (facts.threeDayNoticeReceived === false && facts.leaseStartDate && facts.leaseStartDate >= THREE_DAY_NOTICE_LEASES_FROM) {
    add("no-three-day-notice", `No written 3-day notice; lease began ${facts.leaseStartDate} (on/after ${THREE_DAY_NOTICE_LEASES_FROM}).`);
  }
  if (facts.terminationNoticeReceived === false && facts.reason !== "nonpayment") {
    add("improper-termination-notice", "No proper notice of termination / to move before filing.");
  }
  if (facts.plaintiffNotLandlord || facts.namedWrongPerson) {
    add("plaintiff-not-landlord", "Tenant states the filer is not their landlord.");
  }
  if (facts.noMoneyOwed) add("no-money-owed", "Tenant states no money is owed.");
  if (facts.hasSection8Voucher) add("section-8", "Tenant holds a Section 8 voucher.");
  if (facts.livesInForeclosedProperty) add("foreclosure-tenant", "Property was foreclosed on.");
  if (facts.offeredRentOnTimeRefused) add("tender-refused-on-time", "Rent was offered on time and refused.");
  if (facts.landlordRefusedPayment && facts.firstFilingIn12Months) {
    add("tender-with-costs-refused", "Tenant offered rent plus warrant costs within 7 days and it was refused.");
  }
  if (facts.rentClaimedIncorrect) {
    add("rent-amount-incorrect", "Tenant disputes the amount claimed.", { amount: facts.correctRentAmount });
  }
  if (facts.terminatedWithoutValidReason) add("terminated-without-reason", "Lease terminated without a valid reason.");
  if (facts.repairRequestedInWriting && facts.repairIgnored) add("failed-to-repair", "Written repair request was ignored.");

  const counterclaims: { id: CounterclaimId; text: string }[] = [];
  if (cc.diminishedValuePerMonth && cc.diminishedValueMonths) {
    counterclaims.push({
      id: "diminished-value",
      text: fill(COUNTERCLAIMS["diminished-value"], { perMonth: cc.diminishedValuePerMonth, months: cc.diminishedValueMonths }),
    });
  }
  if (cc.repairCosts && facts.keptRepairReceipts) {
    counterclaims.push({ id: "repair-costs", text: fill(COUNTERCLAIMS["repair-costs"], { amount: cc.repairCosts }) });
  }
  if (cc.personalPropertyDamages) {
    counterclaims.push({ id: "damages", text: fill(COUNTERCLAIMS.damages, { amount: cc.personalPropertyDamages }) });
  }

  const missing: string[] = [];
  if (!caption.caseNumber) missing.push("Case number (printed on your papers)");
  if (!caption.plaintiff) missing.push("Plaintiff name (the landlord or company that filed)");
  if (!caption.defendant) missing.push("Defendant name (you, exactly as on the papers)");
  if (facts.rentClaimedIncorrect && !facts.correctRentAmount) missing.push("The correct rent amount");
  if (grounds.length === 0) missing.push("At least one response: review your options with legal aid before filing");
  missing.push("Your signature, phone number, email, and the date");

  return {
    caption: { court: "Magistrate", ...caption },
    grounds,
    counterclaims,
    prayer: PRAYER_FOR_RELIEF,
    certificateOfService: CERTIFICATE_OF_SERVICE,
    missing,
    reviewNotice:
      "This is a draft for you or a legal aid attorney to review. DocketShield does not file for you. File before your deadline, in person at the clerk's office or by e-filing.",
    sources: ["dekalbAnswerForm", "fultonTenantPamphlet"],
  };
}

/** Plain-text rendering that mirrors the paper form's layout. */
export function renderAnswerText(d: AnswerDraft): string {
  const c = d.caption;
  const blank = (v?: string) => v || "____________________";
  const lines = [
    `IN THE ${c.court?.toUpperCase() ?? "________"} COURT OF ${c.county.toUpperCase()} COUNTY`,
    "STATE OF GEORGIA",
    "",
    `${blank(c.plaintiff)}, Plaintiff`,
    `vs.                                   Case No: ${blank(c.caseNumber)}`,
    `${blank(c.defendant)}, Defendant`,
    "",
    "ANSWER",
    "I am the Defendant. I state the following response to the Plaintiff's Claim:",
    ...d.grounds.map((g) => `[X] ${g.text}`),
    ...(d.counterclaims.length
      ? ["", "COUNTERCLAIM", "My landlord owes me money for the following reason(s):", ...d.counterclaims.map((x) => `[X] ${x.text}`)]
      : []),
    "",
    "WHEREFORE, I ask this Court to:",
    ...d.prayer.map((p, i) => `(${String.fromCharCode(97 + i)}) ${p}`),
    "",
    d.certificateOfService,
    "",
    "__________________________   __________________________",
    "Defendant                    Phone Number and Email Address",
  ];
  return lines.join("\n");
}
