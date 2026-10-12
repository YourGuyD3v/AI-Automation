// POST /api/update
// n8n calls this after EACH stage of the pipeline — not just once at the end.
// Store the latest state per project_id so /api/status can hand it to the
// console on its next poll. This is what lets you send "validating idea",
// then "generating images", then "rendering video" as three separate
// updates to the same open chat, without ever needing three HTTP responses
// to the same original request.
//
// Env vars required:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// Optional:
//   N8N_CALLBACK_TOKEN   shared secret — n8n must send this as Authorization

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  if (process.env.N8N_CALLBACK_TOKEN) {
    const given = req.headers.authorization || '';
    if (given !== process.env.N8N_CALLBACK_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
  }

  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) {
    return res.status(500).json({ error: 'UPSTASH_REDIS_REST_URL / TOKEN not set in Vercel.' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const projectId = body.project_id;
  if (!projectId) {
    return res.status(400).json({ error: 'project_id is required.' });
  }

  // Whatever n8n sends becomes the console's next poll result — same shape
  // /api/message already returns, so the console needs no changes.
  const record = {
    project_id: projectId,
    stage: body.stage || null,
    status: body.status || null,
    reply: body.reply || null,
    progress: body.progress || null,
    approval: body.approval || null,
    video_url: body.video_url || null,
    updated_at: new Date().toISOString()
  };

  try {
    // Upstash's command-array REST format avoids URL-encoding issues with
    // long JSON values. EX 86400 auto-expires stale projects after a day.
    const r = await fetch(base, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['SET', `project:${projectId}`, JSON.stringify(record), 'EX', '86400'])
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: 'Redis write failed', detail: t.slice(0, 300) });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

function safeParse(t) {
  try { return JSON.parse(t); } catch { return null; }
}