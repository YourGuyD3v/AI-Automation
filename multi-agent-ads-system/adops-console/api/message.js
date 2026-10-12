// POST /api/message
// Receives every action from the console and forwards it to your n8n webhook.
// Keeps the n8n URL and auth token server-side, and removes any CORS problem
// because the browser only ever talks to your own Vercel domain.
//
// Env vars required:
//   N8N_WEBHOOK_URL   e.g. https://n8n.yourdomain.com/webhook/adops/message
// Optional:
//   N8N_AUTH_HEADER   value sent as the Authorization header to n8n
//   CONSOLE_TOKEN     if set, the console must send the same value (shared secret)

const ACTIONS = ['message', 'brief', 'approve', 'request_changes', 'revision', 'ping'];

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const target = process.env.N8N_WEBHOOK_URL;
  if (!target) {
    return res.status(500).json({
      error: 'N8N_WEBHOOK_URL is not set in the Vercel environment variables.'
    });
  }

  // Optional shared secret between the browser and this route
  if (process.env.CONSOLE_TOKEN) {
    const given = req.headers.authorization || '';
    if (given !== process.env.CONSOLE_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});

  // ---- validate the payload shape the console sends ----
  const action = body.action || 'message';
  if (!ACTIONS.includes(action)) {
    return res.status(400).json({ error: `Unknown action "${action}".` });
  }
  if (!body.project_id) {
    return res.status(400).json({ error: 'project_id is required.' });
  }

  const payload = {
    project_id: String(body.project_id),
    action,
    stage: body.stage || 'intake',
    message: typeof body.message === 'string' ? body.message : '',
    brief: body.brief || {},
    timestamp: body.timestamp || new Date().toISOString(),
    // useful for rate limiting / audit inside n8n
    source: 'console',
    client_ip: req.headers['x-forwarded-for'] || null
  };

  // New turn: wipe the previous turn's stored update so polling can never
  // replay an old reply next to the new one.
  if (action !== 'ping' && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      await fetch(process.env.UPSTASH_REDIS_REST_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['DEL', `project:${payload.project_id}`])
      });
    } catch { /* non-fatal: worst case the old reply is shown once */ }
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.N8N_AUTH_HEADER) headers['Authorization'] = process.env.N8N_AUTH_HEADER;

    // n8n video pipelines can be slow — give it room, but bail before Vercel's limit
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeout);

    const text = await upstream.text();

    if (!upstream.ok) {
      return res.status(502).json({
        error: `n8n returned ${upstream.status}`,
        reply: 'The pipeline rejected that request. Check the n8n execution log.',
        detail: text.slice(0, 500)
      });
    }

    // n8n may return JSON, or plain text if there is no Respond to Webhook node
    const data = safeParse(text);
    if (data) return res.status(200).json(data);
    return res.status(200).json({ reply: text || 'Accepted.' });

  } catch (err) {
    const aborted = err.name === 'AbortError';
    return res.status(504).json({
      error: aborted ? 'n8n did not respond in time.' : err.message,
      reply: aborted
        ? 'The pipeline is still working. Status updates will arrive through polling.'
        : 'Could not reach the pipeline.'
    });
  }
}

function safeParse(t) {
  try { return JSON.parse(t); } catch { return null; }
}    