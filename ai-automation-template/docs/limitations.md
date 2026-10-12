# Limitations

## Current constraints

- Data quality depends on the quality of the source system.
- External APIs may fail, rate limit, or return incomplete results.
- AI output can vary depending on prompt quality and model behavior.
- Rule-based filters may miss edge cases or over-filter valid results.
- Human review may still be needed for important decisions.

## Known trade-offs

- More automation can reduce manual work, but increases dependency on external services.
- Broader search coverage may increase noise and reduce precision.
- Stronger validation can improve reliability but adds complexity.
- More structured output improves downstream processing but requires additional maintenance.

## Future improvements

- better source-specific normalization rules
- more robust fallback handling for failed integrations
- clearer scoring and filtering logic
- better observability and monitoring
- stronger model and prompt governance

## Notes

Document your real limitations as they appear in production. This section should evolve with the project, not stay static.
