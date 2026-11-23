const store = globalThis.__SHORT_LINKS__ || (globalThis.__SHORT_LINKS__ = new Map());

function makeCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { long_url } = req.body || {};
  if (!long_url) {
    return res.status(400).json({ error: "long_url is required" });
  }

  let parsed;
  try {
    parsed = new URL(long_url);
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  let code = makeCode(6);
  while (store.has(code)) {
    code = makeCode(6);
  }

  const slug = `${code}.mp4`;
  store.set(code, parsed.toString());

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const short_url = `${proto}://${host}/${slug}`;

  return res.status(200).json({ slug, short_url });
}
