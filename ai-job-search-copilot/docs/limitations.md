# Limitations

## Current constraints

The workflow is effective, but it is still bounded by the real-world constraints of web-based job discovery and AI-assisted filtering.

### 1. Source coverage is not exhaustive

The system depends on the configured research sources and the availability of public job listings. If a board or company page is missing, the workflow may not see every opportunity.

### 2. Duplicate detection is heuristic

The agent tries to identify duplicates by comparing URLs, metadata, and semantic similarity. That works well for the common cases, but it can still miss some edge cases when titles vary heavily or the same company republishes a similar role with different text.

### 3. Quality depends on context quality

The matching decision is constrained by the quality of the candidate context, including the resume and summary documents. If the profile is outdated or incomplete, the fit-score may be less trustworthy.

### 4. Search freshness is time-sensitive

The results can change rapidly. Some jobs may close, be reposted, or move between sources within a short time window, which means the workflow needs periodic refreshes to keep its output current.

### 5. High output quality depends on prompt tuning

This project relies heavily on AI reasoning. The quality of the extracted fields, deduplication logic, and candidate fit assessment depends on the quality of the prompt and system instructions attached to the agent.

## Known trade-offs

- Broad search can produce noisy results.
- Higher recall can reduce precision unless filtering is strong.
- More explicit logic improves consistency but requires more maintenance.
- Human review remains important for decision quality.

## Natural next improvements

- more robust source-specific normalization rules
- better handling of reposted, expired, and stale jobs
- stronger fit scoring based on explicit candidate preferences
- richer tracking metadata in Google Sheets
- analytics over time to identify which job sources perform best

## Practical conclusion

This project is best understood as a practical job research and triage workflow rather than a pure autonomous hiring engine. It is designed to significantly reduce manual effort while keeping the user involved where judgment matters most.
