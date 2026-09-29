<div align="center">

# DocketShield

### From a served eviction notice to a filed Answer, before day 7.

Metro Atlanta has the highest eviction-filing rate in the United States: 24 filings per 100 renter households, three times the national average. In Georgia a tenant has seven days after service to file an Answer, or the landlord may seek removal on the eighth day. DocketShield is an agentic legal-deadline system that reads the dispossessory papers, computes the exact filing deadline under Georgia rules, surfaces the defenses and counterclaims the court actually recognizes, and routes the tenant to free legal help, with every rule traced to a primary court source.

[![Devpost](https://img.shields.io/badge/Devpost-WarriorHacks_2.0-1D4ED8?style=for-the-badge&logo=devpost)](https://devpost.com/software/warriorhacks-team-arknet-digital-lakshmi)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-181717?style=for-the-badge&logo=github)](https://github.com/jayblast-spec/docketshield)

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Rules Engine](https://img.shields.io/badge/Rules-Source--Cited-1D4ED8?style=flat-square)
![Tests](https://img.shields.io/badge/tests-32%20passing-1D4ED8?style=flat-square)

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=18&pause=1000&color=1D4ED8&center=true&vCenter=true&width=760&lines=7+days+to+answer.+Zero+room+for+a+wrong+date.;Weekends+count.+Holidays+roll+forward.+5%3A00+PM+cutoff.;Every+rule+cites+the+court+that+wrote+it.;Legal+information%2C+routed+to+free+legal+help.)](https://git.io/typing-svg)

</div>

## What It Does

DocketShield turns the most dangerous week of a renter's life into a clear, correct plan. Given the date a tenant was served and how, its deadline engine applies Georgia's dispossessory rule exactly: seven calendar days that include weekends and holidays, with the final day rolled forward past any Saturday, Sunday, or Georgia state holiday to the next open court day, closing at 5:00 PM. It shows its reasoning day by day, refuses to guess when a year's official holiday calendar is not verified, and warns when the service method means the tenant should confirm the date with the clerk. A triage engine then maps the tenant's facts to the options the Fulton County Magistrate Court itself describes (pay-and-stay for a first filing in twelve months, refused-tender pleading, illegal self-help eviction counterclaims, repair-and-deduct, wrong-party and agent-authority checks) and states plainly what is not a defense, so the tenant spends their seven days on what can actually work.

## How It Works

- `src/deadline.ts`: `computeAnswerDeadline()` implements the 7-day Answer rule with weekend and holiday rollover, a day-by-day reasoning trace, fail-closed warnings for unverified calendars and uncertain service, and source citations on every result.
- `src/rules/holidays.ts`: the official 2026 Georgia state holiday calendar from Georgia.gov, including the stacked Thanksgiving and December 24/25 closures that silently break naive date math.
- `src/dates.ts`: timezone-proof ISO calendar arithmetic that validates real dates and never depends on the host machine's clock.
- `src/triage.ts`: `triage()` maps case facts to cures, defenses, counterclaims, and procedural checks, each with a plain-language explanation, a concrete action before the deadline, and its source; unknown facts never produce options.
- `src/rules/sources.ts`: the registry of primary sources (Fulton County Magistrate Court Tenant Pamphlet, Georgia.gov holiday proclamation, Eviction Lab data) that every rule references.
- `test/`: 17 Vitest cases pinning the exact dates for ordinary weeks, stacked weekend-plus-holiday rollovers, year-boundary calendars, invalid input, and each triage branch.
- `docs/ARCHITECTURE.md`: the full agent pipeline (document extraction, deadline, triage, Answer drafting, legal-aid routing, serial-filer detection) and the build roadmap.

## Live

[DocketShield on Devpost (WarriorHacks 2.0)](https://devpost.com/software/warriorhacks-team-arknet-digital-lakshmi). The rules engine is live in this repo today; the tenant-facing app is in active build.

## Tech Stack

| Layer | Technology |
|---|---|
| Rules engine | TypeScript (strict), zero runtime dependencies |
| Testing | Vitest |
| Legal sources | Fulton County Magistrate Court, Georgia.gov, Eviction Lab |
| Document agent (roadmap) | Vision LLM extraction of dispossessory warrants |
| Interface (roadmap) | Mobile-first web app, SMS deadline reminders |

---

> DocketShield provides legal information, not legal advice. Free help: Housing Court Assistance Center (Fulton County Magistrate Court Clerk's Office, TG-100), Atlanta Legal Aid Society, Georgia Legal Services Program, Atlanta Volunteer Lawyers Foundation.

<div align="center">

![footer](https://capsule-render.vercel.app/api?type=waving&color=0:1D4ED8,55:0B1E3D,100:020617&height=120&section=footer&text=ArkNet%20Digital&fontColor=ffffff&fontSize=28&desc=michael@arknet.digital&descAlignY=80&descSize=14)

</div>
