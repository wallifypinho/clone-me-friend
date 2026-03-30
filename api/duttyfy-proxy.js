const sanitizeEnvValue = (value) => {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^['\"]|['\"]$/g, "");
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, x-proxy-secret");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Simple auth: validate a shared secret header
  const PROXY_SECRET = process.env.DUTTYFY_PROXY_SECRET || "rtc_proxy_2026_seg";
  const proxySecret = req.headers["x-proxy-secret"];
  if (proxySecret !== PROXY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const configuredUrl = req.method === "GET"
    ? sanitizeEnvValue(process.env.DUTTYFY_STATUS_URL) || sanitizeEnvValue(process.env.DUTTYFY_ENCRYPTED_URL)
    : sanitizeEnvValue(process.env.DUTTYFY_ENCRYPTED_URL);

  if (!configuredUrl) {
    return res.status(500).json({ error: "DuttyFy URL not configured" });
  }

  // Preserve query params (for GET status checks)
  const query = req.url.includes("?") ? req.url.split("?").slice(1).join("?") : "";
  const fullUrl = query ? `${configuredUrl}?${query}` : configuredUrl;

  const headers = { "Content-Type": "application/json" };
  const apiKey = req.headers["x-api-key"];
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const fetchOptions = { method: req.method, headers };
    if (req.method === "POST" && req.body) {
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    console.log(`[duttyfy-proxy] ${req.method} -> ...${configuredUrl.slice(-12)}`);

    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.text();
    res
      .status(response.status)
      .setHeader("Content-Type", response.headers.get("content-type") || "application/json")
      .send(data);
  } catch (err) {
    console.error("[duttyfy-proxy] Error:", err.message);
    res.status(502).json({ error: "Proxy error", details: err.message });
  }
}
