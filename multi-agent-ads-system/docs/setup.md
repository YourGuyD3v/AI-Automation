# Setup and deployment

## Prerequisites

- An n8n instance that can receive inbound webhooks and reach your database
  and provider APIs.
- A Supabase project with tables and fields matching the operations in both
  workflow exports.
- Credentials and access for the AI, research, media generation, and render
  providers configured in the exports.
- (Optional) A Vercel project for `adops-console/`.
- (Optional, needed for progress polling) An Upstash Redis REST database.

The exports contain credential references, not your account credentials.
Reconnect each credential in your own n8n instance after importing.

## 1. Import and configure the n8n workflows

1. In n8n, import `workflow/Multi-Agent-Ads-System.json` and
   `workflow/Sub-Workflow-Production-Agent.json`.
2. Configure the referenced Supabase tables, fields, and credentials. The main
   workflow reads/writes `multi agent ads system`; the production workflow
   reads/writes `Production Agent` and the main project table. Check every
   Supabase node for the complete field list and filters required by your
   schema.
3. Reconnect all model, memory, research-tool, media-generation, and render
   credentials. Confirm the referenced provider models/endpoints are available
   to your account.
4. Ensure the Production Agent is available to the main workflow's
   `Call 'Production Agent'` node. Confirm its input fields match the
   sub-workflow trigger (`project_id` and `storyboard_content`).
5. Configure the webhook node and activate the main workflow. Copy its
   **production** webhook URL; do not use the n8n editor's test URL for a
   deployed console.
6. Test a new project and each approval/revision loop before exposing the
   endpoint publicly.

The workflow uses database state to route later user messages. A new project
should start with a unique `project_id`; keep using that ID throughout the
conversation and production run.

## 2. Configure and run the console locally

The console is plain static HTML plus Vercel serverless functions; there is no
build step or project dependency installation. Install the Vercel CLI if
needed, then run:

```sh
cd adops-console
npm install --global vercel
vercel dev
```

Set local environment values in `adops-console/.env.local` (never commit this
file). Local `vercel dev` reads those variables and serves the page/API
locally. The UI also has a demo mode for exercising its simulated interaction
without calling n8n.

## 3. Deploy the console to Vercel

Deploy `adops-console/` as the Vercel project root, either by importing the
repository and setting the project root directory to that folder, or by using
the CLI:

```sh
cd adops-console
vercel
vercel --prod
```

No framework build command is required. Vercel serves `public/index.html` and
deploys `api/*.js` as serverless functions. Set the environment variables
below in the Vercel project settings for the appropriate environments, then
redeploy after changing them.

## Environment variables

| Variable | Required | Used by | Purpose |
|---|---:|---|---|
| `N8N_WEBHOOK_URL` | Yes for live console messages | `/api/message` | Active n8n main workflow webhook URL |
| `N8N_AUTH_HEADER` | Optional | `/api/message` | Value sent as the upstream `Authorization` header |
| `CONSOLE_TOKEN` | Optional; recommended for a restricted console | `/api/message`, `/api/status` | Shared value expected in the request `Authorization` header |
| `N8N_CALLBACK_TOKEN` | Optional; recommended | `/api/update` | Shared value n8n must send in the callback `Authorization` header |
| `UPSTASH_REDIS_REST_URL` | Required for progress callbacks | `/api/update`, `/api/status`, and optional message cleanup | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Required with Redis URL | `/api/update`, `/api/status`, and optional message cleanup | Upstash Redis REST token |

Keep secrets server-side. `CONSOLE_TOKEN` is a shared-secret gate, not a
substitute for user authentication or authorization. Use TLS and appropriate
access controls for both the console and public n8n webhook.

## n8n-to-console status callbacks

During long-running work, configure n8n to POST each update to
`https://<your-vercel-domain>/api/update`. Include the `project_id` and the
latest state fields (`stage`, `status`, `reply`, optional `progress`,
`approval`, and `video_url`). If `N8N_CALLBACK_TOKEN` is set, n8n must include
the exact value in `Authorization`.

The console polls `/api/status?project_id=...`. Upstash holds only the most
recent update for each project ID, with a one-day expiry; this is not a
complete event history. The message API clears an existing update before a
new non-ping action when both Upstash variables are configured.

## Credential and deployment checklist

- [ ] Workflow imports succeed and all credential references are reconnected.
- [ ] Supabase tables/columns match every workflow node's filters and fields.
- [ ] The production webhook URL points to the active main workflow.
- [ ] A test webhook call creates/loads a project and gets a useful response.
- [ ] Each model and provider call can run with your configured account.
- [ ] The Production Agent is callable and accepts the expected inputs.
- [ ] If enabled, `/api/update` accepts a test callback and `/api/status`
      returns it for the same project ID.
- [ ] `.env.local`, provider keys, and Vercel metadata remain untracked.
