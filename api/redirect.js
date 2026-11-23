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
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug || !rawSlug.endsWith(".mp4")) {
    return res.status(400).send("Invalid short link");
  }

  const withoutExt = rawSlug.slice(0, -4);
  const dotIdx = withoutExt.lastIndexOf(".");
  if (dotIdx === -1) {
    return res.status(400).send("Malformed short link");
  }

  const payloadB64 = withoutExt.slice(0, dotIdx);
  const sig = withoutExt.slice(dotIdx + 1);

  if (makeSig(payloadB64) !== sig) {
    return res.status(400).send("Invalid signature");
  }

  let targetUrl;
  try {
    targetUrl = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).send("Unsupported protocol");
    }
    res.writeHead(302, { Location: parsed.toString() });
    res.end();
  } catch {
    return res.status(400).send("Corrupted target URL");
  }
}
