/**
 * The response grounds and counterclaims on Georgia's dispossessory Answer,
 * transcribed from the DeKalb County court's official check-box Answer form.
 * Wording is kept faithful to the form so a draft maps one-to-one onto the
 * paper a clerk will accept.
 */
export type AnswerGroundId =
  | "no-money"
  | "improper-termination-notice"
  | "no-three-day-notice"
  | "plaintiff-not-landlord"
  | "no-money-owed"
  | "section-8"
  | "foreclosure-tenant"
  | "tender-refused-on-time"
  | "tender-with-costs-refused"
  | "rent-amount-incorrect"
  | "terminated-without-reason"
  | "failed-to-repair"
  | "not-entitled-other";

export interface AnswerGround {
  id: AnswerGroundId;
  formText: string;
  /** True when courts do not treat this ground as a defense on its own. */
  notADefenseAlone?: boolean;
}

export const ANSWER_GROUNDS: readonly AnswerGround[] = [
  { id: "no-money", formText: "I was unable to pay rent because I did not have the money.", notADefenseAlone: true },
  {
    id: "improper-termination-notice",
    formText:
      "My landlord did not give me the proper notice that my rental agreement was terminated or that I had to move before filing this lawsuit.",
  },
  {
    id: "no-three-day-notice",
    formText:
      "My landlord did not provide me with a written notice 3 days before filing this dispossessory lawsuit that I had 3 days to pay in full or move out. (Applies only for leases entered into July 1, 2024 or later.)",
  },
  { id: "plaintiff-not-landlord", formText: "The Plaintiff is not my landlord." },
  { id: "no-money-owed", formText: "I do not owe money to my landlord." },
  { id: "section-8", formText: "I have a Section 8 voucher." },
  { id: "foreclosure-tenant", formText: "I am a tenant living in a property where the landlord was foreclosed on." },
  {
    id: "tender-refused-on-time",
    formText: "I offered to pay rent on or before the date I usually pay, but my landlord refused to accept payment in full.",
  },
  {
    id: "tender-with-costs-refused",
    formText: "My landlord would not accept my attempt to pay the rent and the cost of this warrant served on me.",
  },
  { id: "rent-amount-incorrect", formText: "The rent claimed by the landlord is incorrect. The correct rental amount is {amount}." },
  { id: "terminated-without-reason", formText: "My landlord terminated my lease without a valid reason." },
  { id: "failed-to-repair", formText: "My landlord failed to repair the property. (See Counterclaim below for failure to repair.)" },
  {
    id: "not-entitled-other",
    formText: "My landlord is not entitled to evict me or secure a money judgment for the following reasons: {reasons}",
  },
];

export type CounterclaimId = "diminished-value" | "repair-costs" | "damages";

export const COUNTERCLAIMS: Readonly<Record<CounterclaimId, string>> = {
  "diminished-value":
    "My landlord failed to repair my property. Due to this failure, its value has been reduced {perMonth} each month for {months} months.",
  "repair-costs": "My landlord failed to make requested repairs, so I made these repairs that cost {amount}.",
  damages: "My landlord's failure to repair resulted in damages of {amount} to my person/property.",
};

export const PRAYER_FOR_RELIEF: readonly string[] = [
  "Dismiss Plaintiff's lawsuit with all costs assessed against Plaintiff,",
  "Enter a judgment in my favor and against Plaintiff; and",
  "Grant such other and further relief as the Court deems just and proper.",
];

export const CERTIFICATE_OF_SERVICE =
  "I certify that I have this day served the within answer on the Plaintiff by depositing in the United States Mail in a properly addressed envelope with adequate postage thereon.";

/** Georgia's pre-filing 3-day notice requirement applies to leases entered on or after this date. */
export const THREE_DAY_NOTICE_LEASES_FROM = "2024-07-01";
