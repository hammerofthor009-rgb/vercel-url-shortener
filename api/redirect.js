const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

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
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug) {
    return res.status(400).send("Missing slug");
  }

  if (!REDIS_URL || !REDIS_TOKEN) {
    return res.status(500).send("Redis environment variables missing.");
  }

  const code = rawSlug.endsWith(".mp4") ? rawSlug.slice(0, -4) : rawSlug;

  try {
    const data = await redisCommand(["GET", `link:${code}`]);
    const targetUrl = data?.result;

    if (!targetUrl) {
      return res.status(404).send("Short link not found.");
    }

    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).send("Invalid target URL protocol.");
    }

    res.writeHead(302, { Location: parsed.toString() });
    res.end();
  } catch {
    return res.status(500).send("Error fetching short link.");
  }
}
