// GET /api/status?project_id=proj_xxxx
// Polled by the console every few seconds while a job runs. Reads whatever
// n8n most recently pushed to /api/update for this project_id — this is how
// the console shows multiple updates ("validating idea" -> "generating
// images" -> "rendering video") from a single webhook call that only got to
// respond once.
//
// Env vars:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//   CONSOLE_TOKEN     optional shared secret from the console

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const projectId = req.query.project_id;
  if (!projectId) {
    return res.status(400).json({ error: 'project_id query parameter is required.' });
  }

  if (process.env.CONSOLE_TOKEN) {
    const given = req.headers.authorization || '';
    if (given !== process.env.CONSOLE_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
  }

  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) {
    // Polling is optional -- return a quiet no-op rather than an error banner
    return res.status(200).json({ project_id: projectId, polling: false });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const r = await fetch(base, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(['GET', `project:${projectId}`])
    });

    if (!r.ok) {
      return res.status(200).json({ project_id: projectId, error: `Redis returned ${r.status}` });
    }

    const data = await r.json(); // { result: "...json string..." | null }
    if (!data.result) {
      // Nothing pushed yet for this project -- not an error, just nothing new
      return res.status(200).json({ project_id: projectId, stage: null });
    }

    const record = JSON.parse(data.result);
    return res.status(200).json({
      project_id: projectId,
      stage: record.stage || null,
      status: record.status || null,
      reply: record.reply || null,
      progress: record.progress || null,
      approval: record.approval || null,
      video_url: record.video_url || null,
      updated_at: record.updated_at || null
    });

  } catch (err) {
    return res.status(200).json({ project_id: projectId, error: err.message });
  }
}