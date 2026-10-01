export function aiProviderStatus() {
  return {
    configured: Boolean(process.env.AI_API_KEY),
    base_url: process.env.AI_BASE_URL || null,
    model: process.env.AI_MODEL || null
  };
}

export async function generateText(prompt, options = {}) {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return { ok: false, code: "ai_provider_not_configured" };
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = options.model || process.env.AI_MODEL || "gpt-4.1-mini";
  const response = await fetch(base + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
    body: JSON.stringify({
      model,
      temperature: Number.isFinite(Number(options.temperature)) ? Number(options.temperature) : 0.7,
      messages: [
        { role: "system", content: "You are Robot AI, a factual e-commerce sales planning assistant. Never invent product facts, prices, stock, sales, or performance." },
        { role: "user", content: String(prompt || "").slice(0, 12000) }
      ]
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, code: "ai_provider_error", status: response.status, message: data?.error?.message || "provider_error" };
  return { ok: true, text: data?.choices?.[0]?.message?.content || "", usage: data?.usage || null };
}
