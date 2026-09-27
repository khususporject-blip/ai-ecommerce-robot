import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const APP_BASE_URL = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || (APP_BASE_URL ? `${APP_BASE_URL}/auth/tiktok/callback` : "");
const SCOPES = process.env.TIKTOK_SCOPES || "user.info.basic,user.info.profile";

const pendingStates = new Map();
const sessions = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

function requireConfig(res) {
  if (!CLIENT_KEY || !CLIENT_SECRET || !REDIRECT_URI) {
    res.status(503).send("Robot AI OAuth is not configured on the server yet.");
    return false;
  }
  return true;
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

function setCookie(res, name, value, maxAge) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "HttpOnly",
    "SameSite=Lax"
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearCookie(res, name) {
  setCookie(res, name, "", 0);
}

function sameToken(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function parseCookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    out[key] = decodeURIComponent(value);
  }
  return out;
}

function html(title, body) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f7fb;color:#16181d}.card{background:#fff;border:1px solid #ddd;border-radius:18px;padding:32px;max-width:620px;width:calc(100% - 44px);box-shadow:0 18px 50px rgba(20,25,40,.08)}a{color:#5b35d5}.ok{color:#16794b}.err{color:#b42318}pre{white-space:pre-wrap;word-break:break-word;background:#f7f7fa;padding:14px;border-radius:10px}</style></head><body><main class="card">${body}</main></body></html>`;
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "robot-ai",
    oauthConfigured: Boolean(CLIENT_KEY && CLIENT_SECRET && REDIRECT_URI)
  });
});

app.get("/auth/tiktok", (req, res) => {
  if (!requireConfig(res)) return;

  const state = randomToken(32);
  pendingStates.set(state, Date.now() + 10 * 60 * 1000);

  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", CLIENT_KEY);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("state", state);

  setCookie(res, "robot_ai_oauth_state", state, 600);
  res.redirect(url.toString());
});

app.get("/auth/tiktok/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const cookies = parseCookies(req.headers.cookie);
  const cookieState = cookies.robot_ai_oauth_state;

  clearCookie(res, "robot_ai_oauth_state");

  if (error) {
    res.status(400).send(html("TikTok Login — Robot AI", `<h1>Login dibatalkan</h1><p class="err">${String(error_description || error).replace(/[<>]/g, "")}</p><p><a href="/">Kembali ke Robot AI</a></p>`));
    return;
  }

  if (!sameToken(String(state || ""), cookieState)) {
    res.status(400).send(html("TikTok Login — Robot AI", "<h1>Login gagal</h1><p class=\"err\">State OAuth tidak valid. Silakan mulai login lagi.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"));
    return;
  }

  const expiresAt = pendingStates.get(String(state));
  pendingStates.delete(String(state));
  if (!expiresAt || expiresAt < Date.now()) {
    res.status(400).send(html("TikTok Login — Robot AI", "<h1>Login kedaluwarsa</h1><p class=\"err\">Sesi OAuth sudah kedaluwarsa. Silakan mulai lagi.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"));
    return;
  }

  if (!code) {
    res.status(400).send(html("TikTok Login — Robot AI", "<h1>Login gagal</h1><p class=\"err\">TikTok tidak mengembalikan authorization code.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"));
    return;
  }

  try {
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: CLIENT_KEY,
        client_secret: CLIENT_SECRET,
        code: String(code),
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenBody = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || tokenBody.error) {
      res.status(502).send(html("TikTok Login — Robot AI", `<h1>Token exchange gagal</h1><p class="err">TikTok menolak pertukaran authorization code.</p><pre>${JSON.stringify({ error: tokenBody.error, error_description: tokenBody.error_description, log_id: tokenBody.log_id }, null, 2)}</pre><p><a href="/auth/tiktok">Coba lagi</a></p>`));
      return;
    }

    const profileResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,profile_deep_link", {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` }
    });
    const profileBody = await profileResponse.json().catch(() => ({}));

    const sessionId = randomToken(32);
    sessions.set(sessionId, {
      createdAt: Date.now(),
      openId: tokenBody.open_id || profileBody?.data?.user?.open_id || null,
      accessToken: tokenBody.access_token,
      refreshToken: tokenBody.refresh_token,
      expiresAt: Date.now() + Number(tokenBody.expires_in || 86400) * 1000,
      profile: profileBody?.data?.user || null
    });

    setCookie(res, "robot_ai_session", sessionId, 86400);
    const profile = profileBody?.data?.user || {};
    res.send(html("Robot AI — TikTok Connected", `<h1 class="ok">TikTok berhasil terhubung</h1><p>Robot AI sudah menerima identitas TikTok melalui backend.</p><pre>${JSON.stringify({ open_id: profile.open_id || tokenBody.open_id, display_name: profile.display_name || null, username: profile.username || null }, null, 2)}</pre><p><a href="/">Kembali ke Robot AI</a></p>`));
  } catch (error) {
    res.status(502).send(html("TikTok Login — Robot AI", `<h1>Server error</h1><p class="err">Backend tidak dapat menyelesaikan koneksi ke TikTok.</p><pre>${String(error?.message || error).replace(/[<>]/g, "")}</pre><p><a href="/auth/tiktok">Coba lagi</a></p>`));
  }
});

app.get("/api/me", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = sessions.get(cookies.robot_ai_session);
  if (!session) return res.status(401).json({ authenticated: false });

  if (session.expiresAt <= Date.now()) {
    sessions.delete(cookies.robot_ai_session);
    clearCookie(res, "robot_ai_session");
    return res.status(401).json({ authenticated: false });
  }

  res.json({ authenticated: true, profile: session.profile });
});

app.post("/auth/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.robot_ai_session) sessions.delete(cookies.robot_ai_session);
  clearCookie(res, "robot_ai_session");
  res.status(204).end();
});

app.get("/oauth", (_req, res) => res.redirect("/auth/tiktok"));

app.use(express.static(__dirname, { extensions: ["html"] }));

app.use((_req, res) => {
  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`Robot AI listening on port ${port}`);
});
