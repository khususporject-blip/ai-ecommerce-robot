import crypto from "node:crypto";
import { createMemoryStore } from "./business-memory.mjs";
import { createFileMemoryAdapter } from "./file-memory-adapter.mjs";
import { createUpstashMemoryAdapter, upstashMemoryConfigured } from "./upstash-memory-adapter.mjs";

const PREFIX = "seller-session:";
const memory = createMemoryStore(
  upstashMemoryConfigured() ? createUpstashMemoryAdapter() : createFileMemoryAdapter()
);

function encryptionKey() {
  const seed = process.env.SELLER_SESSION_ENCRYPTION_KEY || process.env.TTS_APP_SECRET || process.env.TIKTOK_CLIENT_SECRET || "";
  if (!seed) throw new Error("seller_session_encryption_key_missing");
  return crypto.createHash("sha256").update(seed).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64url"),
    tag: tag.toString("base64url"),
    data: ciphertext.toString("base64url")
  });
}

function decrypt(payload) {
  const envelope = typeof payload === "string" ? JSON.parse(payload) : payload;
  if (!envelope || envelope.v !== 1) throw new Error("seller_session_payload_invalid");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(envelope.iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64url")),
    decipher.final()
  ]).toString("utf8");
  return JSON.parse(plaintext);
}

export function createPersistentSellerSessionStore() {
  return {
    async get(sessionId) {
      if (!sessionId) return null;
      const payload = await memory.get(PREFIX + sessionId);
      if (!payload) return null;
      try {
        return decrypt(payload);
      } catch (error) {
        console.error("Seller session decrypt failed:", error?.message || error);
        return null;
      }
    },
    async set(sessionId, session) {
      if (!sessionId || !session) throw new Error("seller_session_required");
      await memory.set(PREFIX + sessionId, encrypt(session));
      return session;
    },
    async delete(sessionId) {
      if (!sessionId) return false;
      await memory.delete(PREFIX + sessionId);
      return true;
    }
  };
}
