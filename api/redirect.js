import crypto from "crypto";

const SECRET = process.env.LINK_SECRET || "change-this-secret-in-vercel-env";

function signPayload(payloadB64) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(payloadB64)
    .digest("base64url")
    .slice(0, 10);
}

export default function handler(req, res) {
  const rawSlug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!rawSlug || !rawSlug.endsWith(".mp4")) {
    return res.status(400).send("Invalid short link");
  }

  const withoutExt = rawSlug.slice(0, -4);
  const lastDot = withoutExt.lastIndexOf(".");
  if (lastDot === -1) {
    return res.status(400).send("Malformed short link");
  }

  const payloadB64 = withoutExt.slice(0, lastDot);
  const sig = withoutExt.slice(lastDot + 1);

  if (signPayload(payloadB64) !== sig) {
    return res.status(400).send("Invalid link signature");
  }

  let targetUrl;
  try {
    targetUrl = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).send("Unsupported protocol");
    }
  } catch {
    return res.status(400).send("Corrupted target URL");
  }

  res.writeHead(302, { Location: targetUrl });
  res.end();
}
