const store = globalThis.__SHORT_LINKS__ || (globalThis.__SHORT_LINKS__ = new Map());

export default function handler(req, res) {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug) {
    return res.status(400).send("Missing slug");
  }

  // Supports both "9Ncng6.mp4" and "9Ncng6"
  const code = rawSlug.endsWith(".mp4") ? rawSlug.slice(0, -4) : rawSlug;
  const targetUrl = store.get(code);

  if (!targetUrl) {
    return res.status(404).send("Short link not found or expired in demo memory.");
  }

  res.writeHead(302, { Location: targetUrl });
  res.end();
}
