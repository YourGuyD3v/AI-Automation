# Design decisions

## Goal

The system is designed to remove the repetitive parts of job discovery while keeping the final decision in the hands of the user. The workflow focuses on surfacing genuinely new, relevant opportunities instead of dumping a raw list of every result found.

## Key decisions

### 1. Use a research-first pipeline

The workflow begins with broad research via Perplexity instead of directly scraping a single site. This improves the chance of finding relevant positions across multiple sources and reduces the risk of missing opportunities that appear in less obvious places.

### 2. Separate search, qualification, and delivery

The implementation deliberately splits the pipeline into:

- discovery
- extraction and normalization
- deduplication and classification
- candidate matching
- persistence and reporting

This makes the workflow easier to debug, easier to extend, and easier to re-use for different job categories.

### 3. Keep structured storage as the source of truth

The Google Sheets logs act as memory. Instead of trusting only ephemeral LLM output, the workflow checks previous entries before deciding whether a posting is new. This reduces false positives and provides an operational history for later review.

### 4. Match against the actual candidate context

The AI Agent is given resume and summary context, not only a generic prompt. This is a major design choice because candidate fit depends on practical experience, not just keywords. The workflow is therefore closer to an assistive research engine than a naive scraper.

### 5. Human approval remains part of the loop

Even after scoring and filtering, the final result is still reviewable by a human. Reports are sent to Telegram and often delivered as PDFs, giving the user a chance to validate the shortlist before acting.

## Trade-offs

### Strengths

- broad search coverage
- automated filtering and deduplication
- category-aware job tracking
- structured output suitable for reports and logs
- easier review than raw job-board pages

### Costs

- depends on external tools and API reliability
- quality is sensitive to prompt quality and source completeness
- duplicate detection is heuristic and not perfect
- ranking quality depends on the strength and recency of the candidate profile context

## Why this design fits the project

The goal is not just to “collect jobs.” It is to produce a concise and trustworthy shortlist that is relevant to the user’s profile and clean enough to act on. The design decisions above support that objective while remaining flexible enough to expand to new domains or more advanced matching logic later.
