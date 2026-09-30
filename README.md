# DocketShield

**Served papers → source-backed response deadline → draft Answer → filing guidance.**

DocketShield helps Georgia renters understand a dispossessory summons, review their response deadline, prepare a draft Answer, and find filing information and free legal help. It provides legal information, not legal advice. It does not submit documents or confirm that an Answer was filed.

- [Tenant app](https://docketshield-app.vercel.app) — choose “Try with a sample case”
- [App source](https://github.com/jayblast-spec/docketshield-app)
- [API health](https://docketshield.vercel.app/api/health)
- [WarriorHacks submission](https://devpost.com/software/warriorhacks-team-arknet-digital-lakshmi)

## Working implementation

| Component | Behavior |
|---|---|
| Gemini extraction | Extracts structured fields with supporting text and model-reported confidence; validates dates and enums; asks for review of every field |
| Deadline engine | Applies the source-described seven-day rule and weekend/holiday rollover; refuses to return a deadline without a verified calendar |
| Triage | Maps supplied facts to source-backed options; unknown facts remain unknown |
| Answer drafting | Produces a reviewable text draft from case facts; lists missing information; never files it |
| Tenant interface | Scan or manual entry, explicit field confirmation, deadline reasoning, situation questions, options, draft, and filing guidance |
| Local routing | Fulton office details only for a Fulton case; other counties receive instructions to consult the court on the summons |

## Run and verify

Requires Node.js 22 or newer.

```sh
npm ci
npm run typecheck
npm run build
npm test
npx tsc -p tsconfig.api.json --noEmit
```

Tests cover deadline rollover, unverified calendars, malformed extraction, document/rule conflicts, triage, and Answer drafting. GitHub Actions runs these checks on pull requests. Test counts should be read from the runner rather than a manually maintained badge.

The API exposes POST /api/extract, /api/deadline, /api/triage, and /api/draft. Extraction requires a server-side GEMINI_API_KEY. The deadline endpoint returns HTTP 422 with a readable explanation when the holiday calendar is unsupported.

## Trust boundaries and limitations

- Only the 2026 Georgia state holiday calendar is included. A date in another deadline year produces an error, not an estimated deadline.
- The rules reference Fulton materials; county-specific closures, forms, filing methods, and case circumstances still need confirmation with the court.
- Model confidence is self-reported, not a calibrated accuracy measurement. Quoted extraction evidence is also model output and must be checked against the document.
- A printed deadline that conflicts with the calculation requires prompt clerk review. Editing the service date or printed deadline triggers a fresh comparison.
- The Answer draft draws on a DeKalb form and Fulton information. It is not a claim that every court accepts this output as an official form.
- Documents are sent to Google Gemini. The repository's lack of document persistence does not establish provider retention behavior.
- Automated tests and synthetic samples are developer-authored regression evidence, not independent legal review, field accuracy, or proof of reduced evictions.

See [architecture](docs/ARCHITECTURE.md) and [validation and demo plan](docs/VALIDATION.md). SMS reminders, serial-filer analysis, independent legal validation, and measured tenant outcomes remain future work.

Built by ArkNet Digital.
