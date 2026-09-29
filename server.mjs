import express from "express";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { planCommand } from "./robot-agent.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
const APP_BASE_URL = (process.env.APP_BASE_URL || "").replace(/\/$/, "");
const REDIRECT_URI =
  process.env.TIKTOK_REDIRECT_URI ||
  (APP_BASE_URL ? `${APP_BASE_URL}/auth/tiktok/callback` : "");
const SCOPES = process.env.TIKTOK_SCOPES || "user.info.basic,user.info.profile";
const TIKTOK_API = "https://open.tiktokapis.com/v2";

const pendingStates = new Map();
const sessions = new Map();
const tasks = new Map();
const uploadJobs = new Map();

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

function html(title, body) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:system-ui;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f7fb;color:#16181d}.card{background:#fff;border:1px solid #ddd;border-radius:18px;padding:32px;max-width:620px;width:calc(100% - 44px);box-shadow:0 18px 50px rgba(20,25,40,.08)}a{color:#5b35d5}.ok{color:#16794b}.err{color:#b42318}pre{white-space:pre-wrap;word-break:break-word;background:#f7f7fa;padding:14px;border-radius:10px}</style></head><body><main class="card">${body}</main></body></html>`;
}

function tokenExpiry(seconds, fallback = 86400) {
  const value = Number(seconds);
  return Date.now() + (Number.isFinite(value) && value > 0 ? value : fallback) * 1000;
}

function storeTokenSet(session, tokenBody) {
  session.accessToken = tokenBody.access_token;
  session.refreshToken = tokenBody.refresh_token || session.refreshToken;
  session.expiresAt = tokenExpiry(tokenBody.expires_in);
  session.refreshExpiresAt = tokenExpiry(tokenBody.refresh_expires_in, 365 * 86400);
  session.scope = tokenBody.scope || session.scope || SCOPES;
  session.tokenType = tokenBody.token_type || session.tokenType || "Bearer";
  session.openId = tokenBody.open_id || session.openId;
}

async function refreshSession(session) {
  if (!session?.refreshToken) return false;
  if (session.refreshExpiresAt && session.refreshExpiresAt <= Date.now()) return false;

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: session.refreshToken
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) return false;

  storeTokenSet(session, body);
  return true;
}

async function ensureFreshSession(session) {
  if (!session) return false;
  const refreshWindow = 20 * 60 * 1000;
  if (session.expiresAt > Date.now() + refreshWindow) return true;
  return refreshSession(session);
}

// TikTok URL-prefix verification: TikTok supplies a fresh alphanumeric signature
// filename for each verification attempt. Serve the exact token in the required body
// format so a new verification attempt does not require another code deployment.
app.get(/^\/tiktok([A-Za-z0-9]{24,80})\.txt$/, (req, res) => {
  const token = req.params[0];
  res.type("text/plain").send("tiktok-developers-site-verification=" + token);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "robot-ai",
    oauthConfigured: Boolean(CLIENT_KEY && CLIENT_SECRET && REDIRECT_URI),
    sessionStore: "memory"
  });
});

app.get("/auth/tiktok", (_req, res) => {
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
    res.status(400).send(html(
      "TikTok Login — Robot AI",
      `<h1>Login dibatalkan</h1><p class="err">${escapeHtml(error_description || error)}</p><p><a href="/">Kembali ke Robot AI</a></p>`
    ));
    return;
  }

  if (!sameToken(String(state || ""), cookieState)) {
    res.status(400).send(html(
      "TikTok Login — Robot AI",
      "<h1>Login gagal</h1><p class=\"err\">State OAuth tidak valid. Silakan mulai login lagi.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"
    ));
    return;
  }

  const expiresAt = pendingStates.get(String(state));
  pendingStates.delete(String(state));
  if (!expiresAt || expiresAt < Date.now()) {
    res.status(400).send(html(
      "TikTok Login — Robot AI",
      "<h1>Login kedaluwarsa</h1><p class=\"err\">Sesi OAuth sudah kedaluwarsa. Silakan mulai lagi.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"
    ));
    return;
  }

  if (!code) {
    res.status(400).send(html(
      "TikTok Login — Robot AI",
      "<h1>Login gagal</h1><p class=\"err\">TikTok tidak mengembalikan authorization code.</p><p><a href=\"/auth/tiktok\">Coba lagi</a></p>"
    ));
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
      res.status(502).send(html(
        "TikTok Login — Robot AI",
        `<h1>Token exchange gagal</h1><p class="err">TikTok menolak pertukaran authorization code.</p><pre>${escapeHtml(JSON.stringify({ error: tokenBody.error, error_description: tokenBody.error_description, log_id: tokenBody.log_id }, null, 2))}</pre><p><a href="/auth/tiktok">Coba lagi</a></p>`
      ));
      return;
    }

    const profileResponse = await fetch(
      "https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,profile_deep_link",
      { headers: { Authorization: `Bearer ${tokenBody.access_token}` } }
    );
    const profileBody = await profileResponse.json().catch(() => ({}));

    const sessionId = randomToken(32);
    const session = {
      createdAt: Date.now(),
      openId: tokenBody.open_id || profileBody?.data?.user?.open_id || null,
      accessToken: null,
      refreshToken: null,
      expiresAt: 0,
      refreshExpiresAt: 0,
      scope: tokenBody.scope || SCOPES,
      tokenType: tokenBody.token_type || "Bearer",
      profile: profileBody?.data?.user || null
    };
    storeTokenSet(session, tokenBody);
    sessions.set(sessionId, session);

    setCookie(res, "robot_ai_session", sessionId, 86400);
    const profile = session.profile || {};
    res.send(html(
      "Robot AI — TikTok Connected",
      `<h1 class="ok">TikTok berhasil terhubung</h1><p>Robot AI sudah menerima identitas TikTok melalui backend.</p><pre>${escapeHtml(JSON.stringify({
        open_id: profile.open_id || session.openId,
        display_name: profile.display_name || null,
        username: profile.username || null,
        scope: session.scope
      }, null, 2))}</pre><p><a href="/">Kembali ke Robot AI</a></p>`
    ));
  } catch (error) {
    res.status(502).send(html(
      "TikTok Login — Robot AI",
      `<h1>Server error</h1><p class="err">Backend tidak dapat menyelesaikan koneksi ke TikTok.</p><pre>${escapeHtml(error?.message || error)}</pre><p><a href="/auth/tiktok">Coba lagi</a></p>`
    ));
  }
});

app.get("/api/me", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = sessions.get(cookies.robot_ai_session);
  if (!session) return res.status(401).json({ authenticated: false });

  try {
    const fresh = await ensureFreshSession(session);
    if (!fresh && session.expiresAt <= Date.now()) {
      sessions.delete(cookies.robot_ai_session);
      clearCookie(res, "robot_ai_session");
      return res.status(401).json({ authenticated: false, reason: "token_expired" });
    }
  } catch {
    if (session.expiresAt <= Date.now()) {
      sessions.delete(cookies.robot_ai_session);
      clearCookie(res, "robot_ai_session");
      return res.status(401).json({ authenticated: false, reason: "token_refresh_failed" });
    }
  }

  res.json({
    authenticated: true,
    profile: session.profile,
    scope: session.scope,
    tokenExpiresAt: session.expiresAt
  });
});

async function requireTikTokSession(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.robot_ai_session;
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(401).json({ authenticated: false, error: "tiktok_not_connected" });
    return null;
  }
  try {
    const fresh = await ensureFreshSession(session);
    if (!fresh && session.expiresAt <= Date.now()) {
      sessions.delete(sessionId);
      clearCookie(res, "robot_ai_session");
      res.status(401).json({ authenticated: false, error: "tiktok_token_expired" });
      return null;
    }
  } catch {
    if (session.expiresAt <= Date.now()) {
      sessions.delete(sessionId);
      clearCookie(res, "robot_ai_session");
      res.status(401).json({ authenticated: false, error: "tiktok_token_refresh_failed" });
      return null;
    }
  }
  return session;
}

async function tiktokApi(session, pathName, options = {}) {
  return fetch(`${TIKTOK_API}${pathName}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      ...(options.headers || {})
    }
  });
}

function createTask(type, input = {}, status = "prepared") {
  const id = randomToken(12);
  const task = { id, type, status, input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  tasks.set(id, task);
  return task;
}

app.get("/api/tasks", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;
  res.json({ tasks: [...tasks.values()].filter((task) => task.openId === session.openId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100) });
});

app.post("/api/tasks", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;
  const type = String(req.body?.type || "").trim();
  if (!/^(content|product_content|product_upload|sales|event)$/.test(type)) {
    return res.status(400).json({ error: "task_type_invalid" });
  }
  const task = createTask(type, req.body?.input || {});
  task.openId = session.openId || null;
  res.status(201).json({ ok: true, task });
});

app.post("/api/content/prepare", async (req, res) => {
  const session = await requireTikTokSession(req, res);\n  if (!session) return;\n  const product = String(req.body?.product || "produk").trim().slice(0, 160);
  const audience = String(req.body?.audience || "calon pembeli").trim().slice(0, 120);
  const offer = String(req.body?.offer || "").trim().slice(0, 160);
  const task = createTask("content", { product, audience, offer });
  task.openId = session.openId || null;
  const tag = product.replace(/[^A-Za-z0-9]/g, "").slice(0, 42) || "Produk";
  res.status(201).json({ ok: true, task, content: {
    hook: "Butuh " + product + " yang praktis untuk " + audience + "? Cek ini sebelum beli.",
    caption: product + " untuk " + audience + ". " + (offer ? offer + " " : "") + "Lihat detail dan pilih sesuai kebutuhanmu.",
    hashtags: ["#TikTokShop", "#Rekomendasi", "#BelanjaOnline", "#" + tag]
  }});
});

app.get("/api/tiktok/creator-info", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;
  try {
    const response = await tiktokApi(session, "/post/publish/creator_info/query/", {
      method: "POST",
      body: JSON.stringify({})
    });
    const body = await response.json().catch(() => ({}));
    res.status(response.ok ? 200 : response.status).json(body);
  } catch (error) {
    res.status(502).json({ error: "tiktok_unreachable", message: error?.message || String(error) });
  }
});

function tiktokFailure(status, body, fallback = null) {
  const code = body?.error?.code || body?.error || null;
  const message = body?.error?.message || body?.message || null;
  const classification =
    status === 401 || code === "access_token_invalid" ? "authentication" :
    status === 403 && /scope/i.test(String(code || message)) ? "missing_scope" :
    status === 403 && /url|domain|ownership/i.test(String(code || message)) ? "domain_verification" :
    status === 403 ? "authorization_or_provider_restriction" :
    status === 429 ? "rate_limit" :
    status >= 500 ? "provider_or_infrastructure" : "request_or_provider";
  return {
    status,
    code,
    message,
    classification,
    fallback
  };
}

app.get("/api/tiktok/publish-status/:publish_id", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;

  const publishId = String(req.params.publish_id || "").trim();
  if (!publishId) return res.status(400).json({ error: "publish_id_required" });

  try {
    const response = await tiktokApi(session, "/post/publish/status/fetch/", {
      method: "POST",
      body: JSON.stringify({ publish_id: publishId })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.error?.code !== "ok") {
      return res.status(response.status || 502).json({
        error: "publish_status_failed",
        tiktok: tiktokFailure(response.status, body)
      });
    }
    res.json({ ok: true, publish_id: publishId, data: body.data || null });
  } catch (error) {
    res.status(502).json({ error: "tiktok_unreachable", message: error?.message || String(error) });
  }
});

app.post("/api/tiktok/upload-init", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;

  const videoSize = Number(req.body?.video_size);
  const chunkSize = Number(req.body?.chunk_size || videoSize);
  const totalChunkCount = Number(req.body?.total_chunk_count || 1);

  const MIN_CHUNK = 5 * 1024 * 1024;
  const MAX_CHUNK = 64 * 1024 * 1024;
  const MAX_FINAL_CHUNK = 128 * 1024 * 1024;
  const expectedChunkCount = videoSize < MIN_CHUNK ? 1 : Math.floor(videoSize / chunkSize);
  if (!Number.isSafeInteger(videoSize) || videoSize <= 0 ||
      !Number.isSafeInteger(chunkSize) || chunkSize <= 0 ||
      !Number.isSafeInteger(totalChunkCount) || totalChunkCount <= 0 ||
      (videoSize < MIN_CHUNK && (chunkSize !== videoSize || totalChunkCount !== 1)) ||
      (videoSize >= MIN_CHUNK && (chunkSize < MIN_CHUNK || chunkSize > MAX_CHUNK || totalChunkCount !== expectedChunkCount || totalChunkCount > 1000))) {
    return res.status(400).json({
      error: "upload_parameters_invalid",
      message: "Ukuran/chunk upload tidak memenuhi batas TikTok: file <5MB harus 1 chunk; file >=5MB memakai chunk 5-64MB dan total_chunk_count=floor(video_size/chunk_size)."
    });
  }

  try {
    const response = await tiktokApi(session, "/post/publish/inbox/video/init/", {
      method: "POST",
      body: JSON.stringify({
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: chunkSize,
          total_chunk_count: totalChunkCount
        }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body?.error?.code !== "ok") {
      return res.status(response.status || 502).json({
        error: "upload_init_failed",
        tiktok: tiktokFailure(response.status, body, "FILE_UPLOAD")
      });
    }
    const publishId = body.data?.publish_id || null;
    const uploadUrl = body.data?.upload_url || null;
    if (!publishId || !uploadUrl) {
      return res.status(502).json({ error: "upload_init_invalid_response" });
    }
    const uploadId = randomToken(18);
    uploadJobs.set(uploadId, {
      uploadUrl,
      publishId,
      openId: session.openId || null,
      videoSize,
      chunkSize,
      totalChunkCount,
      createdAt: Date.now()
    });
    res.status(202).json({
      ok: true,
      status: "upload_ready",
      upload_id: uploadId,
      publish_id: publishId,
      upload_url: uploadUrl
    });
  } catch (error) {
    res.status(502).json({ error: "tiktok_unreachable", message: error?.message || String(error) });
  }
});

app.post("/api/tiktok/publish-url", async (req, res) => {
  const session = await requireTikTokSession(req, res);
  if (!session) return;

  const videoUrl = String(req.body?.video_url || "").trim();
  const title = String(req.body?.title || "").trim();
  const privacyLevel = String(req.body?.privacy_level || "").trim();

  if (!videoUrl || !/^https:\/\//i.test(videoUrl)) {
    return res.status(400).json({ error: "video_url_required", message: "video_url HTTPS wajib diisi." });
  }

  try {
    const creatorResponse = await tiktokApi(session, "/post/publish/creator_info/query/", {
      method: "POST",
      body: JSON.stringify({})
    });
    const creatorBody = await creatorResponse.json().catch(() => ({}));
    if (!creatorResponse.ok || creatorBody?.error?.code !== "ok") {
      return res.status(creatorResponse.status || 502).json({
        error: "creator_info_failed",
        tiktok: creatorBody
      });
    }

    const options = creatorBody?.data?.privacy_level_options || [];
    const selectedPrivacy = privacyLevel || options.find((value) => value === "SELF_ONLY") || options[0];
    if (!selectedPrivacy || !options.includes(selectedPrivacy)) {
      return res.status(400).json({
        error: "privacy_level_invalid",
        allowed: options
      });
    }

    const initResponse = await tiktokApi(session, "/post/publish/video/init/", {
      method: "POST",
      body: JSON.stringify({
        post_info: {
          title: title.slice(0, 2200),
          privacy_level: selectedPrivacy
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl
        }
      })
    });
    const initBody = await initResponse.json().catch(() => ({}));
    if (!initResponse.ok || initBody?.error?.code !== "ok") {
      return res.status(initResponse.status || 502).json({
        error: "publish_init_failed",
        tiktok: tiktokFailure(initResponse.status, initBody, "PULL_FROM_URL")
      });
    }

    res.status(202).json({
      ok: true,
      status: "submitted_to_tiktok",
      publish_id: initBody.data?.publish_id || null,
      note: "TikTok may restrict unaudited clients to private visibility."
    });
  } catch (error) {
    res.status(502).json({ error: "tiktok_unreachable", message: error?.message || String(error) });
  }
});

app.post("/auth/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.robot_ai_session) sessions.delete(cookies.robot_ai_session);
  clearCookie(res, "robot_ai_session");
  res.status(204).end();
});

app.get("/oauth", (_req, res) => res.redirect("/auth/tiktok"));

app.post("/api/assistant", (req, res) => {
  const plan = planCommand(req.body?.command);
  if (plan.action === "tiktok_login" && plan.path) {
    return res.json({ ...plan, execute: true });
  }
  res.json({ ...plan, execute: false });
});
app.use(express.static(__dirname, { extensions: ["html"] }));
app.use((_req, res) => res.status(404).send("Not found"));

app.listen(port, () => {
  console.log(`Robot AI listening on port ${port}`);
});
