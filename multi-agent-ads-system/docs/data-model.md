# Data model and schema

This document describes the Supabase data model used by the n8n workflow in a generic, sample-safe way. It is based on the actual workflow exports, but it intentionally avoids real project data, user content, production IDs, or any live asset references.

The goal is to document the shape and purpose of the stored records without depending on any real values from a specific campaign.

## Persistence model

The workflow uses two related persistence patterns:

1. A main project table that tracks campaign state, user conversation input, and approvals.
2. A production table that stores the downstream rendering plan, asset metadata, and final assembly output for a single approved project.

The exact table names are configurable in Supabase, but the fields below reflect the exports that the system reads and writes during orchestration and production.

## Main project table

This table represents a single campaign or ad project.

### Canonical fields

| Field | Type | Purpose |
| --- | --- | --- |
| `project_id` | text | Stable identifier for one project, used in lookups and callbacks. |
| `created_at` | timestamp with time zone | When the project record was created. |
| `state` | text | Workflow routing state such as intake, validation, research, creative, storyboard, or production. |
| `validated_content` | jsonb | Structured brief and approval data after validation. |
| `research_content` | jsonb | Research findings and decision support for the campaign. |
| `creative_content` | jsonb | Approved creative direction and campaign concept. |
| `research_review` | jsonb | Reviewer notes or status around research. |
| `user_inputs` | jsonb or text | Historical user prompts, messages, or initial requirements. |
| `writing_content` | jsonb | Approved copy, script, voiceover notes, or text drafts. |
| `storyboard_content` | jsonb | Final storyboard plan and scene-by-scene production direction. |
| `production_state` | text or jsonb | Current production milestone or last known status. |

### Interpretation

- `project_id` is the primary key used by the web console, webhook flow, and production callbacks.
- `state` should represent the internal workflow progression, not the display label shown in the UI.
- `validated_content`, `creative_content`, and `writing_content` are structured rich objects, usually stored as JSON rather than flattened columns.
- `user_inputs` may be a list of messages or a serialized text block depending on implementation.
- `storyboard_content` becomes the handoff artifact passed to the downstream production planner.

### Example shape

```json
{
  "project_id": "project_001",
  "created_at": "2026-01-01T00:00:00Z",
  "state": "storyboard",
  "validated_content": {
    "status": "PROCEED",
    "draft": {
      "objective": "placeholder_objective",
      "audience": "placeholder_audience",
      "platform": "placeholder_platform"
    }
  },
  "research_content": {
    "status": "COMPLETE",
    "findings": []
  },
  "creative_content": {
    "concept": "placeholder_concept",
    "tone": "placeholder_tone"
  },
  "research_review": {
    "status": "approved"
  },
  "user_inputs": [
    { "role": "user", "message": "placeholder_message" }
  ],
  "writing_content": {
    "script": [
      { "text": "placeholder_line" }
    ]
  },
  "storyboard_content": {
    "scenes": [
      { "scene_id": 1, "visual": "placeholder_visual" }
    ]
  },
  "production_state": "ready_for_production"
}
```

This example is intentionally generic and contains no actual client language or branded data.

## Production table

This table stores the planned media assembly work created from an approved storyboard.

### Canonical fields

| Field | Type | Purpose |
| --- | --- | --- |
| `production_id` | text | Identifier for a production run or generated plan. |
| `mode` | text | Execution mode or workflow variant used for this production pass. |
| `editing` | jsonb | Assembly instructions and post-processing guidance. |
| `format` | jsonb | Output configuration such as aspect ratio, duration, and format. |
| `continuity` | jsonb | Visual continuity rules and scene consistency requirements. |
| `text_to_image` | jsonb | Instructions, prompts, or metadata for creating still images. |
| `image_to_video` | jsonb | Motion generation metadata for each base visual. |
| `sound` | jsonb | Music and sound design plan. |
| `sfx` | jsonb | Special effects, transitions, and sonic accents. |
| `dependencies` | jsonb | Asset and task dependencies between scenes or assets. |
| `voice` | jsonb | Voiceover timing, script pieces, and voice selection metadata. |
| `assumptions` | jsonb | Missing information or assumptions that still need confirmation. |
| `images` | jsonb | Generated or planned image assets and their status. |
| `videos` | jsonb | Generated or planned motion/video assets. |
| `music` | jsonb | Music asset definitions, licensing info, and track references. |
| `sfx_audio` | jsonb | Audio effect files or metadata for sound effects. |
| `final_video` | jsonb | Final rendered video metadata and output details. |
| `voice_audio` | jsonb | Final voiceover recordings or linked audio files. |
| `project_id` | text | Foreign key pointing back to the owning project. |

### Interpretation

This table is not a flat list of media files. It is a structured production manifest.

- `text_to_image` and `image_to_video` describe generation tasks.
- `editing` and `continuity` define how the outputs are sequenced and kept consistent.
- `sound`, `music`, `sfx`, and `voice` define the audio layer for the final piece.
- `final_video` and related fields are used when the production run is complete.
- `assumptions` captures unresolved details without inventing data that was never provided.

### Example shape

```json
{
  "production_id": "production_001",
  "mode": "standard",
  "format": {
    "aspect_ratio": "placeholder_ratio",
    "duration_seconds": 15,
    "output_format": "placeholder_format"
  },
  "continuity": {
    "style": "placeholder_style",
    "color_direction": "placeholder_palette"
  },
  "text_to_image": {
    "items": [
      { "scene_id": 1, "status": "pending", "prompt": "placeholder_prompt" }
    ]
  },
  "image_to_video": {
    "items": [
      { "scene_id": 1, "status": "pending" }
    ]
  },
  "voice": {
    "lines": [
      { "start": 0, "end": 2, "text": "placeholder_line" }
    ]
  },
  "sound": {
    "music": "placeholder_music_plan",
    "sfx": "placeholder_sfx_plan"
  },
  "dependencies": {
    "scene_order": [1, 2, 3]
  },
  "images": [
    { "image_id": "img_001", "scene_id": 1, "status": "pending" }
  ],
  "videos": [
    { "video_id": "video_001", "scene_id": 1, "status": "pending" }
  ],
  "music": [
    { "asset_id": "music_001", "status": "pending" }
  ],
  "sfx_audio": [
    { "asset_id": "sfx_001", "status": "pending" }
  ],
  "final_video": {
    "status": "pending"
  },
  "voice_audio": {
    "status": "pending"
  },
  "project_id": "project_001"
}
```

Again, the example is illustrative only and contains no real campaign data.

## Relationships

The relationship is straightforward:

```text
project (1) -> production_run (many)
```

A single project can generate one or more production plans, but each production record is linked back to the project via `project_id`.

## State and lifecycle model

The workflow's persisted state and production state should be treated as lifecycle markers rather than display labels.

Example state progression:

```text
intake -> validation -> research -> creative -> writing -> storyboard -> production -> review -> complete
```

The exact names can vary in implementation, but the important rule is that the record should give the workflow a reliable point-in-time state to route the next step or resume a paused project.

## Data handling guidance

- Use stable, deterministic IDs for projects and production runs.
- Keep promotional or user-generated message content in structured JSON when possible.
- Store nested content as JSON rather than flattening everything into ad hoc columns.
- Keep assumptions explicit instead of fabricating missing facts.
- Do not store sensitive client data or private asset URLs in documented sample content.
- When building examples, use neutral placeholders like `project_001` or `placeholder_prompt`.

## Summary

The workflow uses a small but rich data model:

- the main project record tracks campaign context, reviews, and approvals
- the production record tracks rendering tasks, asset generation, assembly logic, and final outputs
- the relationship between them is the `project_id` key

This design supports both human approval checkpoints and machine-driven production execution without depending on a single rigid schema.
