const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function makeCode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function redisCommand(commandArray) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commandArray),
  });
  if (!res.ok) {
    throw new Error(`Redis error: ${res.status}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).json({
      error: "Redis environment variables missing. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel.",
    });
  }

  const { long_url } = req.body || {};
  if (!long_url) {
    return res.status(400).json({ error: "long_url is required" });
  }

  let parsed;
  try {
    parsed = new URL(String(long_url).trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  let code = makeCode(6);
  for (let i = 0; i < 10; i++) {
    const existing = await redisCommand(["GET", `link:${code}`]);
    if (!existing.result) break;
    code = makeCode(6);
  }

  await redisCommand(["SET", `link:${code}`, parsed.toString()]);

  const slug = `${code}.mp4`;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const short_url = `${proto}://${host}/${slug}`;

  return res.status(200).json({ slug, short_url });
}
