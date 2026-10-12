# Design decisions

## Stage-based orchestration

The main workflow persists project state in Supabase and routes the next
message based on that state. This allows a client conversation to continue
over multiple webhook calls without requiring one long-running request to
hold all conversational context.

**Trade-off:** state values and transitions must remain consistent between
workflow edits and database records. Existing projects can be routed
incorrectly if state names change without a migration.

## Human approval gates

The client participates in idea validation, creative development, copy
revision, and storyboard approval before production. Production receives the
approved storyboard as its source of truth.

**Reason:** advertising copy, claims, brand treatment, and final creative
require human judgment. Agent output should support the process, not silently
approve publication or make unverified claims.

## Separate production sub-workflow

Planning and media generation are isolated in a callable Production Agent.
The planner translates the approved storyboard into task-specific directions;
separate stages generate the assets and assemble the final timeline.

**Trade-off:** this makes the production work independently reusable, but
requires a stable trigger contract (`project_id`, `storyboard_content`) and
matching database expectations.

## Polling for long-running work

Media generation and rendering may take longer than a single request should
remain open. The console uses an immediate webhook response and can poll for
later progress stored by `/api/update` in Redis.

**Trade-off:** this needs an Upstash account for progress polling and keeps
only the latest status rather than an audit trail. The n8n execution history
and persistent database remain important for diagnosing a run.

## Provider-specific workflow nodes

The workflow directly connects to model, research, media, and rendering
providers using n8n nodes/HTTP requests rather than hiding all providers
behind one abstraction.

**Reason:** the visible nodes make generation and polling steps easy to
inspect and change.

**Trade-off:** credentials, request formats, provider APIs, and model
availability must be maintained individually.

## Server-side console proxy

The browser talks to same-origin Vercel API routes rather than calling n8n or
provider APIs directly.

**Reason:** avoid exposing the n8n endpoint/auth configuration in browser
requests and avoid cross-origin browser calls.

**Trade-off:** the console requires serverless deployment configuration and
does not itself provide full end-user identity/authorization.

## Structured planning and results

The production planner creates discrete instructions for scenes and asset
types, while later workflow stages save generation results. This supports
tracking and assembling assets separately.

**Trade-off:** the database schema and structured AI output must match
downstream node expectations. Prompt or schema changes should be validated
against a complete test run before rollout.
