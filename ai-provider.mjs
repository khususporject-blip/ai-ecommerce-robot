const DEFAULT_TIMEOUT_MS = 20_000;
const MAX_PROMPT_CHARS = 12_000;

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

  let base = process.env.AI_BASE_URL || "https://api.openai.com/v1";
  while (base.endsWith("/")) base = base.slice(0, -1);
  const model = options.model || process.env.AI_MODEL || "gpt-4.1-mini";
  const timeoutMs = Number.isFinite(Number(options.timeoutMs))
    ? Math.min(60_000, Math.max(1_000, Number(options.timeoutMs)))
    : DEFAULT_TIMEOUT_MS;
  const temperature = Number.isFinite(Number(options.temperature))
    ? Math.min(2, Math.max(0, Number(options.temperature)))
    : 0.7;

  let response;
  try {
    response = await fetch(base + "/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          {
            role: "system",
            content: "You are Robot AI, a factual e-commerce sales planning assistant. Never invent product facts, prices, stock, sales, or performance."
          },
          { role: "user", content: String(prompt || "").slice(0, MAX_PROMPT_CHARS) }
        ]
      })
    });
  } catch (error) {
    return {
      ok: false,
      code: error?.name === "TimeoutError" || error?.name === "AbortError"
        ? "ai_provider_timeout"
        : "ai_provider_unavailable"
    };
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      code: "ai_provider_error",
      status: response.status,
      message: typeof data?.error?.message === "string"
        ? data.error.message.slice(0, 300)
        : "provider_error"
    };
  }

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    return { ok: false, code: "ai_provider_empty_response" };
  }

  return { ok: true, text, usage: data?.usage || null };
}
