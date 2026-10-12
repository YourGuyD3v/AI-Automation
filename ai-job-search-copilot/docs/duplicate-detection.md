# Duplicate detection

## Objective

The workflow is designed to avoid adding a job to the job log multiple times when the same opening appears across different sources or in near-identical variations.

## Detection strategy

The implementation uses a layered approach:

1. URL comparison
   - If the same posting URL is found again, it is treated as a duplicate.
2. Title and company normalization
   - Titles and company names are normalized before comparison to reduce small formatting differences.
3. Content similarity checks
   - The AI Agent compares job descriptions and required skills to identify close matches that are not exact duplicates.
4. Log-based historical checks
   - Each job is validated against the existing Google Sheet rows in the relevant category before it is accepted.

## Why this matters

Job boards often surface the same opportunity in more than one form:

- the same company page appears in a search result and an aggregated board
- a remote listing is mirrored with a different title variant
- a job is reposted with a new date but the same core content

Without deduplication, the system would flood the user with repetitive results.

## Actual workflow behavior

The AI Agent prompt included a direct instruction to:

- check the relevant existing job log
- evaluate whether a job is genuinely new
- return only the jobs that qualify as new and relevant

This is the operational duplicate filter inside the automation.

## Example duplicate cases

Common examples the workflow is meant to handle:

- same URL across multiple search results
- same company + title pair with a slightly changed description
- recurring internships or reposts that are not new opportunities
- rows already present in `Job Log / AI Automation` or `Job Log / Solidity`

## Output policy

When a duplicate is detected, the system should not add a second row for the same opportunity. The preserved record is the one with the strongest metadata and the clearest fit to the candidate profile.
