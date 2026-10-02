import crypto from "node:crypto";

const APP_KEY = process.env.TTS_APP_KEY || "";
const APP_SECRET = process.env.TTS_APP_SECRET || "";
const AUTH_BASE = String(process.env.TTS_SELLER_AUTH_URL || "").replace(/\/$/, "");
const API_BASE = process.env.TTS_API_BASE_URL || "https://open-api.tiktokglobalshop.com";

export function sellerAuthStatus() {
  return {
    configured: Boolean(APP_KEY && APP_SECRET && AUTH_BASE),
    redirect_uri: process.env.TTS_SELLER_REDIRECT_URI || null,
    authorization_url_configured: Boolean(AUTH_BASE),
    app_credentials_configured: Boolean(APP_KEY && APP_SECRET)
  };
}

export function buildSellerAuthorizeUrl(state) {
  if (!APP_KEY || !AUTH_BASE) throw new Error("tts_seller_auth_not_configured");
  const url = new URL("/open/authorize", AUTH_BASE + "/");
  url.searchParams.set("service_id", String(process.env.TTS_SERVICE_ID || ""));
  if (!process.env.TTS_SERVICE_ID) throw new Error("tts_service_id_missing");
  url.searchParams.set("state", state);
  return url.toString();
}

async function tokenRequest(path, params) {
  if (!APP_KEY || !APP_SECRET) throw new Error("tts_app_credentials_missing");
  const url = new URL(path, "https://auth.tiktok-shops.com");
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("app_secret", APP_SECRET);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function exchangeSellerCode(authCode) {
  return tokenRequest("/api/v2/token/get", {
    auth_code: authCode,
    grant_type: "authorized_code"
  });
}

export async function refreshSellerToken(refreshToken) {
  return tokenRequest("/api/v2/token/refresh", {
    refresh_token: refreshToken,
    grant_type: "refresh_token"
  });
}

function sign(path, query) {
  const pairs = Object.entries(query)
    .filter(([key, value]) => key !== "sign" && value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => key + String(value))
    .join("");
  const payload = path + pairs;
  const wrapped = APP_SECRET + payload + APP_SECRET;
  return crypto.createHmac("sha256", APP_SECRET).update(wrapped).digest("hex");
}

export async function getAuthorizedShops(accessToken) {
  const path = "/authorization/202309/shops";
  const timestamp = Math.floor(Date.now() / 1000);
  const query = { app_key: APP_KEY, timestamp };
  query.sign = sign(path, query);
  const url = new URL(path, API_BASE);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { accept: "application/json", "x-tts-access-token": accessToken }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
