import type { SourceId } from "./rules/sources.js";

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
