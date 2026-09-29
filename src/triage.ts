import type { SourceId } from "./rules/sources.js";
import { THREE_DAY_NOTICE_LEASES_FROM } from "./rules/answerForm.js";

/**
 * Facts a tenant (or the document-extraction agent) can supply.
 * Every field is optional: unknown facts never trigger an option.
 */
export interface CaseFacts {
  reason?: "nonpayment" | "lease-breach" | "holdover" | "other";
  firstFilingIn12Months?: boolean;
  canPayAllOwedPlusCosts?: boolean;
  landlordRefusedPayment?: boolean;
  repairRequestedInWriting?: boolean;
  repairIgnored?: boolean;
  keptRepairReceipts?: boolean;
  lockedOut?: boolean;
  utilitiesShutOff?: boolean;
  threatened?: boolean;
  namedWrongPerson?: boolean;
  filedByAgentNotOwner?: boolean;
  /** ISO date the current lease was entered into. */
  leaseStartDate?: string;
  /** Did the landlord give a written notice to pay in full or move within 3 days before filing? */
  threeDayNoticeReceived?: boolean;
  /** Was the tenant told in writing that the tenancy was terminated / to move before filing? */
  terminationNoticeReceived?: boolean;
  plaintiffNotLandlord?: boolean;
  noMoneyOwed?: boolean;
  hasSection8Voucher?: boolean;
  livesInForeclosedProperty?: boolean;
  offeredRentOnTimeRefused?: boolean;
  rentClaimedIncorrect?: boolean;
  correctRentAmount?: string;
  terminatedWithoutValidReason?: boolean;
}

export interface TriageOption {
  id: string;
  title: string;
  /** Plain-language explanation, written for a stressed reader. */
  explanation: string;
  /** What to do before the deadline. */
  action: string;
  kind: "cure" | "defense" | "counterclaim" | "check";
  sources: SourceId[];
}

export interface TriageResult {
  options: TriageOption[];
  /** Hard truths the tenant needs to hear, stated once and plainly. */
  cautions: string[];
  disclaimer: string;
}

const DISCLAIMER =
  "DocketShield gives legal information, not legal advice. Free help filing your Answer: the Housing Court Assistance Center (Fulton County Magistrate Court Clerk's Office, TG-100), Atlanta Legal Aid Society, Georgia Legal Services Program, Atlanta Volunteer Lawyers Foundation.";

export function triage(facts: CaseFacts): TriageResult {
  const options: TriageOption[] = [];
  const cautions: string[] = [
    "Missing the deadline is the most common way tenants lose: if no Answer is filed, the landlord may seek removal on the 8th day.",
  ];
  const src: SourceId[] = ["fultonTenantPamphlet"];

  if (facts.reason === "nonpayment") {
    cautions.push(
      "Georgia courts do not accept inability to pay (illness, job loss, hardship) as a defense to eviction. Focus on the options below.",
    );
  }

  if (facts.reason === "nonpayment" && facts.firstFilingIn12Months && facts.canPayAllOwedPlusCosts) {
    options.push({
      id: "pay-and-stay",
      title: "Pay everything owed and stay",
      explanation:
        "If this is the first eviction filed against you in 12 months, you can stop it by paying all money owed plus the cost of the dispossessory warrant within 7 days of service.",
      action: facts.landlordRefusedPayment
        ? "File an Answer stating the money was offered but refused. A court that finds a proper offer was refused can order the landlord to accept payment and let you stay."
        : "Offer full payment in a way you can prove, then file an Answer stating the money was offered and accepted (or refused).",
      kind: "cure",
      sources: src,
    });
  }

  if (facts.threeDayNoticeReceived === false) {
    const covered =
      facts.leaseStartDate !== undefined && facts.leaseStartDate >= THREE_DAY_NOTICE_LEASES_FROM;
    const unknownLease = facts.leaseStartDate === undefined;
    if (covered || unknownLease) {
      options.push({
        id: "no-three-day-notice",
        title: covered ? "Defense: no 3-day notice before filing" : "Check: did you get a 3-day notice?",
        explanation:
          "For leases entered on or after July 1, 2024, the landlord must give written notice, at least 3 days before filing, that you had 3 days to pay in full or move out. The court's own Answer form lists missing notice as a response.",
        action: covered
          ? "Check this response on your Answer. Keep every notice (or proof there wasn't one) and bring your lease showing its start date."
          : "Find your lease start date. If it is July 1, 2024 or later and you got no written 3-day notice, this can be a strong response.",
        kind: covered ? "defense" : "check",
        sources: ["dekalbAnswerForm"],
      });
    }
  }

  if (facts.terminationNoticeReceived === false && facts.reason !== "nonpayment") {
    options.push({
      id: "improper-termination-notice",
      title: "Defense: no proper notice to move",
      explanation: "The Answer form lets you state the landlord did not give proper notice that the tenancy was ending, or that you had to move, before filing.",
      action: "Check this response and bring any notices you did receive, with dates.",
      kind: "defense",
      sources: ["dekalbAnswerForm"],
    });
  }

  if (facts.rentClaimedIncorrect) {
    options.push({
      id: "rent-amount-incorrect",
      title: "Dispute the amount claimed",
      explanation: "If the landlord's figure is wrong, the Answer form lets you state the correct amount; the judge decides what, if anything, is owed.",
      action: "Write the correct amount on your Answer and bring your lease, receipts, and bank records.",
      kind: "defense",
      sources: ["dekalbAnswerForm", "fultonTenantPamphlet"],
    });
  }

  if (facts.lockedOut || facts.utilitiesShutOff || facts.threatened) {
    options.push({
      id: "self-help-counterclaim",
      title: "Counterclaim: illegal self-help eviction",
      explanation:
        "Changing the locks, threatening you, or cutting off utilities to force you out is illegal in Georgia and can support a counterclaim for damages.",
      action: "List these acts as a counterclaim in your Answer. Bring photos, texts, and utility records to the hearing.",
      kind: "counterclaim",
      sources: src,
    });
  }

  if (facts.repairRequestedInWriting && facts.repairIgnored) {
    options.push({
      id: "repair-and-deduct",
      title: "Counterclaim: repair and deduct",
      explanation:
        "Landlords must repair normal wear and tear. If a written repair request was ignored and you paid a licensed worker for a reasonable, necessary repair, that cost can be deducted from rent.",
      action: facts.keptRepairReceipts
        ? "Raise repair-and-deduct as a counterclaim and bring the written request plus every receipt and invoice."
        : "This counterclaim depends on receipts and invoices. Gather them now; without them it is hard to prove.",
      kind: "counterclaim",
      sources: src,
    });
  }

  if (facts.namedWrongPerson) {
    options.push({
      id: "wrong-party",
      title: "Check: are you the right person?",
      explanation: "The affidavit must name each tenant. If you are not the tenant named or not in a landlord-tenant relationship, say so.",
      action: "Deny that you are the proper party in your Answer.",
      kind: "defense",
      sources: src,
    });
  }

  if (facts.filedByAgentNotOwner) {
    options.push({
      id: "agent-authority",
      title: "Check: did the landlord's agent file correctly?",
      explanation: "If someone other than the owner filed, the agent must complete the court's Rule 31 form authorizing them to act for the owner.",
      action: "Ask the clerk whether a Rule 31 form is on file; if not, raise it in your Answer.",
      kind: "check",
      sources: src,
    });
  }

  return { options, cautions, disclaimer: DISCLAIMER };
}
