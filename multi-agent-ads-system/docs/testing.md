# Testing and operations

The repository contains n8n workflow exports and static console code; it does
not currently include an automated unit-test suite. Validate imported
workflows and provider integration in a non-production n8n environment.

## Import and configuration checks

- Import both workflow JSON files and confirm n8n can open each workflow.
- Reconnect every credential and confirm database table/resource selections.
- Check that the Production Agent can be called by the main workflow with
  `project_id` and `storyboard_content`.
- Confirm the production workflow is connected to the expected Supabase
  project and provider accounts.
- Confirm the console's production webhook URL targets the active main
  workflow.

## End-to-end smoke test

1. Send a request with a unique test `project_id` and an initial advertising
   brief/message.
2. Confirm the main workflow creates or finds the project record, records the
   message, and returns a response.
3. Continue with that same project ID. Exercise validation, research
   clarification if requested, creative feedback, copy revisions, and
   storyboard approval.
4. Confirm the storyboard approval triggers the Production Agent.
5. Run a small production through each configured media provider. Verify
   image, video, music, SFX, and voice results are stored as expected.
6. Confirm the editing workflow assembles the result, reports render status,
   and reaches the correct complete/failure outcome.
7. If using the console callback path, POST a test update to `/api/update` and
   verify that `/api/status?project_id=<same-id>` returns that update.

Do not generate paid media or publish an ad during an initial smoke test.
Provider calls can incur usage costs even when the overall workflow fails.

## Stage-level checks

| Area | Check |
|---|---|
| Intake | Missing project ID is rejected by the console API; valid ID reaches n8n. |
| State routing | A new project starts in the expected initial state; subsequent messages reach the agent for the saved state. |
| Validation and approvals | Confirmations and requested changes persist and route to the intended next step. |
| Research | Findings are saved; research errors are surfaced instead of treated as success. |
| Writing | Drafts and revisions are stored; approval gates route correctly. |
| Storyboard | Generated output can be parsed and approved before production starts. |
| Production | Each provider request is polled and its final status/result is saved. |
| Rendering | Successful render URL is returned; failure/retry paths do not mark a failed render complete. |
| Status callbacks | Callback token is enforced when configured; callbacks are returned for the matching project ID. |

## Failure and edge cases

Test at least:

- Unknown project ID versus an existing project ID.
- Empty or malformed incoming message payload.
- Repeated webhook delivery for the same project.
- Invalid/expired provider credentials and provider rate limits.
- Provider task that remains pending or reports failure.
- A render that succeeds, fails, or remains in progress across status checks.
- Missing Upstash configuration (live messages should work; polling should
  report that it is disabled).
- Missing/mismatched `CONSOLE_TOKEN` or `N8N_CALLBACK_TOKEN`.
- User revision after a draft and a repeated approval action.

Check the n8n execution log and Supabase rows when a test does not behave as
expected. Keep error callbacks visible to the operator and client; do not mark
failed provider/render work as successful.

## Operational precautions

- Use a separate Supabase project and provider credentials for test runs.
- Clean up test projects using a scoped database operation, not a broad delete.
- Monitor provider usage, render duration, n8n execution errors, and stale
  project statuses.
- Validate generated claims, final copy, music/media rights, accessibility,
  and platform requirements with a human before publication.
