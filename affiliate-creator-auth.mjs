import crypto from "node:crypto";

const APP_KEY = String(process.env.TTS_AFFILIATE_APP_KEY || "").trim();
const APP_SECRET = String(process.env.TTS_AFFILIATE_APP_SECRET || "").trim();
const APP_BASE_URL = String(process.env.APP_BASE_URL || "").replace(/\/$/, "");
const REDIRECT_URI = String(
  process.env.TTS_AFFILIATE_REDIRECT_URI ||
  (APP_BASE_URL ? APP_BASE_URL + "/auth/tiktok-shop/affiliate-creator/callback" : "")
).trim();

export function affiliateCreatorAuthStatus() {
  const missingFields = [];
  if (!APP_KEY) missingFields.push("TTS_AFFILIATE_APP_KEY");
  if (!APP_SECRET) missingFields.push("TTS_AFFILIATE_APP_SECRET");
  if (!REDIRECT_URI) missingFields.push("TTS_AFFILIATE_REDIRECT_URI");
  return {
    configured: missingFields.length === 0,
    app_credentials_configured: Boolean(APP_KEY && APP_SECRET),
    redirect_uri: REDIRECT_URI || null,
    authorization_url_configured: Boolean(APP_KEY),
    missing_fields: missingFields,
    requires_partner_api_approval: true
  };
}

export function buildAffiliateCreatorAuthorizeUrl(state) {
  if (!APP_KEY) throw new Error("tts_affiliate_app_key_missing");
  if (!REDIRECT_URI) throw new Error("tts_affiliate_redirect_uri_missing");
  if (!state || typeof state !== "string") throw new Error("creator_oauth_state_required");
  const url = new URL("https://shop.tiktok.com/alliance/creator/auth");
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("state", state);
  return url.toString();
}

async function tokenRequest(params) {
  if (!APP_KEY || !APP_SECRET) throw new Error("tts_affiliate_app_credentials_missing");
  const url = new URL("/api/v2/token/get", "https://auth.tiktok-shops.com");
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("app_secret", APP_SECRET);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export async function exchangeAffiliateCreatorCode(code) {
  if (!code) throw new Error("creator_auth_code_missing");
  return tokenRequest({ auth_code: code, grant_type: "authorized_code" });
}

export async function refreshAffiliateCreatorToken(refreshToken) {
  if (!refreshToken) throw new Error("creator_refresh_token_missing");
  if (!APP_KEY || !APP_SECRET) throw new Error("tts_affiliate_app_credentials_missing");
  const url = new URL("/api/v2/token/refresh", "https://auth.tiktok-shops.com");
  url.searchParams.set("app_key", APP_KEY);
  url.searchParams.set("app_secret", APP_SECRET);
  url.searchParams.set("refresh_token", refreshToken);
  url.searchParams.set("grant_type", "refresh_token");
  const response = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export function validateAffiliateCreatorToken(tokenBody = {}) {
  const data = tokenBody?.data || {};
  return {
    ok: Number(tokenBody?.code) === 0 && Number(data.user_type) === 1 && Boolean(data.access_token),
    user_type: Number.isFinite(Number(data.user_type)) ? Number(data.user_type) : null,
    granted_scopes: Array.isArray(data.granted_scopes)
      ? data.granted_scopes
      : String(data.granted_scopes || "").split(",").map((scope) => scope.trim()).filter(Boolean),
    open_id: data.open_id || null
  };
}
