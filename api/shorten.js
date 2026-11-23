import crypto from "crypto";

const SECRET = process.env.LINK_SECRET || "default-vercel-shortener-secret-key";

function makeSig(payloadB64) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url")
    .slice(0, 8);
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
    parsed = new URL(String(long_url).trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return res.status(400).json({ error: "Only http/https URLs are allowed" });
  }

  const payloadB64 = Buffer.from(parsed.toString(), "utf8").toString("base64url");
  const sig = makeSig(payloadB64);
  const slug = `${payloadB64}.${sig}.mp4`;

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const short_url = `${proto}://${host}/${slug}`;

  return res.status(200).json({ slug, short_url });
}
