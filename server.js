/* Explee Command Center — same-origin proxy (kills CORS) */
const express = require('express');
const path = require('path');

const app = express();
const EXPLEE_BASE = 'https://api.explee.com';

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'explee-command-proxy' }));

/* Forward ANY method /api/explee/*  ->  https://api.explee.com/* */
app.all('/api/explee/*', async (req, res) => {
  const key = req.headers['x-explee-key'];
  if (!key) return res.status(400).json({ error: 'Missing X-Explee-Key header' });

  const sub = req.originalUrl.slice('/api/explee'.length); // path + query
  const target = EXPLEE_BASE + sub;

  try {
    const r = await fetch(target, {
      method: req.method,
      headers: {
        'X-API-Key': key,
        'Content-Type': 'application/json'
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body || {})
    });
    const data = await r.json().catch(() => ({}));
    res.status(r.status).json(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream fetch failed: ' + e.message });
  }
});

const port = process.env.PORT || 10000;
app.listen(port, () => console.log('Explee Command proxy listening on', port));
