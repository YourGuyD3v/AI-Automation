# Architecture

## System boundary

The project is composed of two n8n workflows and an optional web console:

1. **Main orchestration** — `workflow/Multi-Agent-Ads-System.json` receives
   user messages, loads or creates project state in Supabase, and routes each
   message to the agent responsible for the current stage.
2. **Production sub-workflow** —
   `workflow/Sub-Workflow-Production-Agent.json` is called after the
   storyboard is approved. It plans the production, generates the media
   assets, and assembles a final render.
3. **Ad Production Console** — `adops-console/` serves a static UI and
   same-origin serverless routes. The message route forwards user actions to
   n8n; the status/update routes relay progress through Upstash Redis.

Supabase is the workflow's persistent project and production data store.
External AI, research, media generation, and rendering providers are called
from n8n. The console is optional; the n8n webhook can also be called by
another client that follows the documented request shape.

## Main project lifecycle

```text
POST webhook
  -> get or create project row
  -> append the incoming message
  -> route by current project state
     Intake -> Ad Validation -> Research -> Creative Director
     -> Write ad copy -> Storyboard -> Production Agent
  -> report response / progress to the client
```

The main workflow stores the current state in the project row and uses it to
decide which stage processes the next message. The screenshots show client
feedback loops in validation, research clarification, creative direction, and
copywriting. The storyboard is a separate approval gate before production.
Status and completion messages are sent back to the client/console.

## Production lifecycle

The production workflow is triggered by another workflow and takes a project
identifier plus approved storyboard content. The Planner converts that
approved input into structured instructions for:

1. Image generation
2. Image-to-video clip generation
3. Music
4. Sound effects (SFX)
5. Voice
6. Editing and final render

The generation stages submit work to provider APIs, wait and poll for
completion, then collect and save the results in Supabase. The Editing stage
builds a timeline, requests a render, checks its status, retries while
appropriate, and reports a failure or final result. Refer to the workflow
export for the exact connections and node configuration.

## Data and status flow

```text
Console or API client
  -> POST /api/message
  -> n8n main webhook
  <-> Supabase project state
  -> Production Agent -> media providers / renderer
  -> n8n POST /api/update (optional progress callback)
  -> Upstash Redis
  -> console GET /api/status
```

`/api/message` returns the response from the main webhook. For subsequent
updates during a long job, n8n can POST the latest status to `/api/update`;
the console polls `/api/status?project_id=...`. Redis stores the latest update
for up to one day. If Upstash is not configured, the status route returns
`polling: false`; webhook interaction can still work, but asynchronous
progress updates will not be available.

## Integrations visible in the workflow exports

The workflow exports include nodes for:

- **Supabase** for project and production records.
- **OpenAI** models for validation, planning, and/or storyboard generation.
- **Anthropic** for a creative-agent step.
- **Perplexity** for a research-agent tool.
- **WaveSpeed / ByteDance Seedream** for image generation.
- **Pruna AI** for video generation.
- **ElevenLabs** for music, SFX, and text-to-speech.
- **Shotstack** for rendering the final edit.
- **Vercel and Upstash Redis** for the optional console and progress API.

Provider names and exact operations reflect the checked-in exports; availability,
model names, account access, and provider APIs can change. Configure your own
credentials in n8n and verify each provider's current requirements.

## Workflow files

- `workflow/Multi-Agent-Ads-System.json` — main project webhook and
  conversational stage router.
- `workflow/Sub-Workflow-Production-Agent.json` — callable production planner,
  media generation, and editing pipeline.
- `adops-console/api/message.js` — validates and forwards allowed user actions.
- `adops-console/api/update.js` — accepts and stores n8n progress updates.
- `adops-console/api/status.js` — returns the most recent update for polling.

The README's [screenshot walkthrough](../README.md#screenshots-complete-workflow)
shows the full sequence represented by the exported workflows.
