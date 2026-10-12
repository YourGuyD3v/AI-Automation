# Ad Production Console

The console is a static client UI plus three Vercel serverless routes. The UI
submits briefs/messages, displays project status and approvals, and can poll
for updates. The API routes proxy user actions to n8n and relay asynchronous
status through Upstash Redis.

```text
adops-console/
├── public/
│   └── index.html
├── api/
│   ├── message.js   POST   browser action -> n8n
│   ├── update.js    POST   n8n callback -> Upstash
│   └── status.js    GET    console poll <- Upstash
├── package.json
└── vercel.json
```

There is no frontend build step or application dependency. Node.js 18+ is
configured as the Vercel function runtime requirement.

## Run locally

Install the Vercel CLI if needed and run from this directory:

```sh
npm install --global vercel
vercel dev
```

For live requests, create `.env.local` with the required server-side
environment values described below. Do not commit that file. The UI's demo
mode simulates the flow without a live n8n backend.

## Deploy

Deploy this directory as the Vercel project root:

```sh
vercel
vercel --prod
```

Alternatively, import the repository into Vercel and set the project root
directory to `ai-automation/multi-agent-ads-system/adops-console`. No build
command is necessary. Configure environment variables in the Vercel project
settings and redeploy after changing them.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `N8N_WEBHOOK_URL` | Yes for live messages | URL of the active main n8n workflow webhook |
| `N8N_AUTH_HEADER` | Optional | Authorization header value sent to n8n |
| `CONSOLE_TOKEN` | Optional | Shared token required by `/api/message` and `/api/status` when configured |
| `N8N_CALLBACK_TOKEN` | Optional | Shared token required by `/api/update` when configured |
| `UPSTASH_REDIS_REST_URL` | Optional; required for progress callbacks | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Optional; required with Redis URL | Upstash Redis REST token |

When either Upstash value is absent, `/api/status` returns
`{"project_id":"...","polling":false}`. User messages can still be forwarded,
but the asynchronous progress callback/polling feature is unavailable.

## API contract

### `POST /api/message`

Accepts `message`, `brief`, `approve`, `request_changes`, `revision`, and
`ping` actions. `project_id` is required. If `action` is omitted, it defaults
to `message`.

Example:

```json
{
  "project_id": "campaign-2026-001",
  "action": "message",
  "stage": "intake",
  "message": "We need a 30-second social ad for our new coffee product.",
  "brief": {},
  "timestamp": "2026-10-11T16:00:00.000Z"
}
```

The route forwards a normalized request with `project_id`, `action`, `stage`,
`message`, `brief`, `timestamp`, `source: "console"`, and client IP metadata.
It sends `N8N_AUTH_HEADER` as the upstream `Authorization` header when set.
The route has a 55-second upstream timeout. If a response is JSON, it is
returned as JSON; plain-text n8n responses are wrapped as `{ "reply": "..." }`.

Common responses include:

- `400` — invalid action or missing `project_id`
- `401` — `CONSOLE_TOKEN` is configured but does not match
- `500` — `N8N_WEBHOOK_URL` is not configured
- `502` — n8n returns an unsuccessful status
- `504` — n8n did not respond before the route timeout

### `POST /api/update`

n8n posts the latest state for a project to this route:

```json
{
  "project_id": "campaign-2026-001",
  "stage": "production",
  "status": "generating_images",
  "reply": "Generating storyboard image assets.",
  "progress": { "scenes_done": 2, "scenes_total": 6 },
  "approval": null,
  "video_url": null
}
```

The route requires `project_id` and both Upstash environment values. When
`N8N_CALLBACK_TOKEN` is set, n8n must pass its value in the `Authorization`
header. The record is stored at `project:<project_id>` and expires after 24
hours; each new update replaces the previous one.

### `GET /api/status?project_id=campaign-2026-001`

Returns the latest stored update for the project, including `stage`, `status`,
`reply`, `progress`, `approval`, `video_url`, and `updated_at`. If no update
has arrived, it returns a null stage. The response is marked `no-store`.

`CONSOLE_TOKEN`, if configured, must be supplied as the `Authorization`
header for both `/api/message` and `/api/status`. n8n callbacks authenticate
separately using `N8N_CALLBACK_TOKEN`.

## n8n connection pattern

1. Point `N8N_WEBHOOK_URL` to the active main workflow's POST webhook.
2. Configure the workflow to return its acknowledgement promptly; do not wait
   for a full media render before responding.
3. During long-running stages, POST status updates to
   `https://<your-vercel-domain>/api/update`.
4. Include the stable project ID in every user request and callback.
5. Configure the console polling path to use `/api/status` (the bundled UI
   uses the same-origin route).

The exact stages and state transitions are controlled by the n8n exports;
see the parent [system README](../README.md) and
[architecture guide](../docs/architecture.md).
