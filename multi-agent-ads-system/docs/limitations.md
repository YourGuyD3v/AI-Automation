# Limitations and operational risks

## Current constraints

- **Not turnkey:** the workflow exports require n8n setup, credential
  reconnection, compatible Supabase tables, and provider accounts.
- **Provider dependency:** model, research, image, video, audio, and render
  APIs can change, fail, rate-limit, or incur usage charges.
- **Human review remains necessary:** generated research, copy, claims, assets,
  and final renders need review before advertising use or publication.
- **Stateful routing:** main workflow routing depends on persisted project
  state. Inconsistent or stale state can send messages to an unexpected stage.
- **Console access is not user identity:** `CONSOLE_TOKEN` gates the server
  routes using a shared value; it does not provide per-user authentication,
  roles, or campaign ownership.
- **Provider/media policy:** generated material can have quality, licensing,
  likeness, platform-policy, and brand-safety concerns that are outside the
  workflow's technical status checks.

## Security and privacy considerations

- Treat webhook URLs, shared tokens, provider credentials, and Supabase
  access as secrets.
- Restrict webhook access and protect console deployment with appropriate
  identity controls for the intended users.
- The message route forwards the `x-forwarded-for` header value as client IP
  metadata; validate trusted proxy behavior for your deployment.
- The message route uses one webhook URL for all accepted actions. Confirm
  the imported workflow handles each action safely; the main workflow's
  visible routing is state-based.
- Avoid sending unnecessary personal, confidential, or sensitive information
  in briefs or model prompts.
- Define retention and deletion rules for project conversations and generated
  assets in Supabase and connected providers.

## Known implementation trade-offs

- Long generation jobs rely on provider polling and may use fixed wait
  intervals; duration and retry behavior should be tuned to provider limits
  and cost.
- A single shared Redis key per project represents only the latest status.
  Concurrent runs for the same project ID can overwrite one another.
- A workflow can successfully return a webhook acknowledgement while later
  production stages fail. Monitor n8n execution results and callback status,
  not just the initial HTTP response.
- Model output parsing and downstream schema assumptions can break when
  prompts, provider responses, or output structures change.

## Improvements to consider

- Add per-user authentication and project-level authorization to the console.
- Add durable event history, run identifiers, and concurrency protection.
- Add explicit schema migrations and automated workflow/API contract tests.
- Add provider-specific retry/backoff policies and operational alerting.
- Add retention controls and a documented approval/audit process for generated
  advertising material.
