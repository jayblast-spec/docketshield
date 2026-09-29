/**
 * Every rule DocketShield applies is traceable to a primary source.
 * Nothing here is inferred or paraphrased from secondary blogs.
 */
export interface Source {
  id: string;
  title: string;
  url: string;
  retrieved: string; // ISO date the text was read
}

export const SOURCES = {
  fultonTenantPamphlet: {
    id: "fulton-tenant-pamphlet",
    title: "Fulton County Magistrate Court: Landlord-Tenant (Dispossessory Actions) Tenant Pamphlet",
    url: "https://www.fultoncountyga.gov/-/media/Departments/Magistrate-Court/Court-Resources/Tenant-Pamphlet.pdf",
    retrieved: "2026-09-30",
  },
  georgiaStateHolidays2026: {
    id: "ga-state-holidays-2026",
    title: "Georgia State Holidays 2026 (Georgia.gov)",
    url: "https://georgia.gov/georgia-state-holidays-2026",
    retrieved: "2026-09-30",
  },
  evictionLabAtlanta: {
    id: "eviction-lab-atlanta",
    title: "Metro Atlanta leads the nation in eviction filings (Eviction Lab data via FOX 5 Atlanta)",
    url: "https://www.fox5atlanta.com/news/why-metro-atlanta-now-leads-nation-eviction-filings",
    retrieved: "2026-09-30",
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
