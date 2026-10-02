const URL = process.env.UPSTASH_REDIS_REST_URL || "";
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const PREFIX = process.env.BUSINESS_MEMORY_PREFIX || "robot-ai:memory:";

export function upstashMemoryConfigured() {
  return Boolean(URL && TOKEN);
}

async function command(parts, body = null) {
  if (!upstashMemoryConfigured()) throw new Error("upstash_memory_not_configured");
  const response = await fetch(URL, {
    method: body === null ? "GET" : "POST",
    headers: { Authorization: "Bearer " + TOKEN, "Content-Type": "application/json" },
    body: body === null ? undefined : JSON.stringify(parts)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) throw new Error(data?.error || "upstash_memory_request_failed");
  return data.result;
}

export function createUpstashMemoryAdapter() {
  return {
    async get(key) {
      const value = await command(["GET", PREFIX + String(key)]);
      return value ? JSON.parse(value) : null;
    },
    async set(key, value) {
      await command(["SET", PREFIX + String(key), JSON.stringify(value)]);
      return value;
    },
    async delete(key) {
      await command(["DEL", PREFIX + String(key)]);
      return true;
    },
    async list(prefix = "") {
      const keys = await command(["KEYS", PREFIX + String(prefix) + "*"]);
      if (!Array.isArray(keys) || !keys.length) return [];
      const values = await command(["MGET", ...keys]);
      return (Array.isArray(values) ? values : []).filter(Boolean).map((value) => JSON.parse(value));
    }
  };
}
