const store = globalThis.__SHORT_LINKS__ || (globalThis.__SHORT_LINKS__ = new Map());

export default function handler(req, res) {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug) {
    return res.status(400).send("Missing slug");
  }

  const code = rawSlug.endsWith(".mp4") ? rawSlug.slice(0, -4) : rawSlug;
  const targetUrl = store.get(code);

  if (!targetUrl) {
    return res.status(404).send("Short link expired or not found in current memory.");
  }

  res.writeHead(302, { Location: targetUrl });
  res.end();
}
