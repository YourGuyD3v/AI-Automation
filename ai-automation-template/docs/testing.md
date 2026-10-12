# Testing

## Validation checklist

- Confirm the trigger works correctly.
- Verify the workflow accepts valid input data.
- Check that parsing and normalization produce the expected output.
- Validate filtering or deduplication logic.
- Confirm AI results are structured and usable.
- Test storage, delivery, and final output actions.

## Recommended smoke test

Run one small real example through the full flow and check that the output matches the intended behavior.

## Suggested checks

- input validation
- empty or malformed data handling
- API failure handling
- duplicate handling
- logging and error visibility
- end-to-end output quality

## Notes

This file is a generic template. Add your project-specific scenarios, edge cases, and expected outputs as your workflow becomes more mature.
