export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, x-proxy-secret");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Simple auth: validate a shared secret header
  const PROXY_SECRET = "rtc_proxy_2026_seg";
  const proxySecret = req.headers["x-proxy-secret"];
  if (proxySecret !== PROXY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // DuttyFy encrypted URL
  const DUTTYFY_URL = "https://www.pagamentos-seguros.app/api-pix/yktTAm72oO0AWi29bcRBxX0i9W-_itVgBOPVdxnysDiKflmMTultY7MW--pd9Isnfcev4XpSBl39W5VmCQT5WA";

  // Preserve query params (for GET status checks)
  const query = req.url.includes("?") ? req.url.split("?").slice(1).join("?") : "";
  const fullUrl = query ? `${DUTTYFY_URL}?${query}` : DUTTYFY_URL;

  const headers = { "Content-Type": "application/json" };
  const apiKey = req.headers["x-api-key"];
  if (apiKey) headers["x-api-key"] = apiKey;

  try {
    const fetchOptions = { method: req.method, headers };
    if (req.method === "POST" && req.body) {
      fetchOptions.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const data = await response.text();
    res.status(response.status).setHeader("Content-Type", "application/json").send(data);
  } catch (err) {
    console.error("[duttyfy-proxy] Error:", err.message);
    res.status(502).json({ error: "Proxy error", details: err.message });
  }
}
