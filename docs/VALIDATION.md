# Validation and demonstration plan

## Evidence available today

Automated tests cover developer-authored cases. The bundled warrant is synthetic. No independent legal review, representative extraction accuracy, usability study, or eviction outcome improvement is claimed.

## Evaluation protocol

Freeze a separate evaluation set before changing extraction prompts. Have a reviewer other than the prompt author record expected fields and deadline outcomes. Keep personal documents out of the public repository; use consented redacted documents or clearly labeled synthetic variants.

Include:
1. Clear warrant with an ordinary response window.
2. Weekend plus holiday rollover.
3. Thanksgiving and December stacked holidays.
4. Deadline year with no verified holiday calendar.
5. Notice date and service date on the same page.
6. Missing service date.
7. Printed deadline conflicting with computed deadline.
8. Low-quality or rotated scan.
9. County outside Fulton.
10. Provider outage with manual-entry fallback.
11. Edited service date after extraction.
12. Optional field absent from the papers.

Measure field exact-match accuracy with correct refusals reported separately, wrong-date count, missing-field refusal behavior, conflict detection, completion time, and API failure recovery. Publish the sample size, document provenance, model version, evaluation date, failures, and whether review was independent. Do not treat confidence scores as measured accuracy.

## External review

Ask a qualified Georgia housing-law reviewer to assess the source interpretation, service-date assumptions, holiday treatment, cutoff, draft wording, and county/form applicability. Record the scope and unresolved issues. Do not imply court endorsement or acceptance.

Observe unfamiliar users completing a synthetic case. Record where they hesitate, misunderstand confirmation, miss a warning, or cannot identify the filing destination.

## Two-minute demo script

- 0–15 seconds: renter receives a dispossessory summons; explain the response problem.
- 15–45: scan a labeled synthetic document and explicitly review extracted fields against the paper.
- 45–70: show the source-backed deadline and holiday rollover reasoning.
- 70–100: answer situation questions; show relevant options, a draft, and correct county guidance.
- 100–120: show an unsupported-calendar refusal and report only measured results.

Make the video length conform to the actual event rules. Include the live URL, public repositories, supported scope, known limitations, and what was built during the eligible period.
