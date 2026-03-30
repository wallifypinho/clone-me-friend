export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, x-proxy-secret");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Validate proxy secret to prevent unauthorized use
  const proxySecret = req.headers["x-proxy-secret"];
  if (!proxySecret || proxySecret !== process.env.PROXY_SECRET) {
    return res.status(401).json({ error: "Unauthorized proxy request" });
  }

  const duttyfyUrl = process.env.DUTTYFY_URL;
  if (!duttyfyUrl) {
    return res.status(500).json({ error: "DUTTYFY_URL not configured" });
  }

  // Preserve query params (used by check-payment-status for GET polling)
  const query = req.url.includes("?") ? req.url.split("?").slice(1).join("?") : "";
  const fullUrl = query ? `${duttyfyUrl}?${query}` : duttyfyUrl;

  const headers = { "Content-Type": "application/json" };
  const apiKey = req.headers["x-api-key"];
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method === "POST" && req.body) {
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.text();

    res.status(response.status).setHeader("Content-Type", "application/json").send(data);
  } catch (err) {
    console.error("[duttyfy-proxy] Error:", err.message);
    res.status(502).json({ error: "Proxy connection failed", details: err.message });
  }
}
