import assert from "node:assert/strict";
import { validateDirectPostInput } from "../tiktok-post-policy.mjs";
import fs from "node:fs/promises";
import { scoreProduct } from "../product-intelligence.mjs";
import { analyzePerformance } from "../performance-brain.mjs";
import { normalizeProductPerformance } from "../tiktok-shop-client.mjs";
import { sellerAuthStatus, buildSellerAuthorizeUrl } from "../seller-auth.mjs";
import { upstashMemoryConfigured, createUpstashMemoryAdapter } from "../upstash-memory-adapter.mjs";
import { buildContentExecution } from "../content-executor.mjs";
import { generateText, aiProviderStatus } from "../ai-provider.mjs";
import { validateAffiliateCreatorToken } from "../affiliate-creator-auth.mjs";

const server = await fs.readFile(new URL("../server.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(await fs.readFile(new URL("../package.json", import.meta.url), "utf8"));
const scheduler = await fs.readFile(new URL("../autonomy-scheduler.mjs", import.meta.url), "utf8");
const shopClient = await fs.readFile(new URL("../tiktok-shop-client.mjs", import.meta.url), "utf8");
const sellerAuthSource = await fs.readFile(new URL("../seller-auth.mjs", import.meta.url), "utf8");
const affiliateCreatorAuthSource = await fs.readFile(new URL("../affiliate-creator-auth.mjs", import.meta.url), "utf8");
const indexHtml = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");

assert.match(sellerAuthSource, /service_id_configured: Boolean\(SERVICE_ID\)/);
assert.match(affiliateCreatorAuthSource, /shop\.tiktok\.com\/alliance\/creator\/auth/);
assert.match(affiliateCreatorAuthSource, /grant_type: "authorized_code"/);
assert.match(server, /\/auth\/tiktok-shop\/affiliate-creator\/callback/);
assert.match(server, /Number\(data\.user_type\) !== 1/);
assert.match(indexHtml, /Hubungkan TikTok Shop Affiliate Creator/);
assert.match(sellerAuthSource, /const path = "\/authorization\/202309\/shops";/);
assert.match(sellerAuthSource, /missing_fields: missingFields/);
assert.match(indexHtml, /\/auth\/tiktok-shop\/seller/);
assert.match(indexHtml, /id="connectionStatus"/);
assert.match(indexHtml, /loadConnectionReadiness/);
assert.match(indexHtml, /ai_provider_configured/);
assert.match(server, /ai_provider_missing_fields:.*AI_API_KEY/);
assert.match(indexHtml, /ai_provider_missing_fields/);
assert.match(indexHtml, /Konfigurasi production yang belum tersedia/);

assert.match(server, /v2\/auth\/authorize\//);
assert.match(server, /v2\/oauth\/token\//);
assert.match(server, /grant_type: "authorization_code"/);
assert.match(server, /grant_type: "refresh_token"/);
assert.match(server, /\/api\/tiktok\/creator-info/);
assert.match(server, /\/api\/tiktok\/publish-url/);
assert.match(server, /\/api\/tiktok\/publish-status/);
assert.match(server, /\/api\/tiktok\/performance/);
assert.match(server, /\/api\/shop\/products/);
assert.match(server, /\/api\/shop\/orders/);
assert.match(server, /\/api\/shop\/product-performance/);
assert.match(shopClient, /analytics\/202605\/shop_products\/performance/);
assert.match(server, /product_status_filter/);
assert.match(server, /performance = tiktokShopClient\.normalizeProductPerformance/);
assert.match(server, /\/api\/robot\/cycle/);
assert.match(server, /\/api\/autonomy\/emergency-stop/);
assert.match(server, /\/api\/ai\/generate/);
assert.match(server, /tiktokShopClient/);
assert.match(server, /runAutonomousCycle/);
assert.match(server, /startAutonomyScheduler/);
assert.match(server, /ROBOT_AUTONOMY_ENABLED/);
assert.match(server, /seller_authorization: \{ \.\.\.sellerAuthStatus\(\), authorized: sellerAuthorized \}/);
assert.match(server, /shopAppConfigured\(\) &&\s*\(sellerAuthorized \|\|/);
assert.match(server, /Belum bisa menghubungkan TikTok Shop/);
assert.match(server, /Field konfigurasi yang belum tersedia/);
assert.match(server, /missingFields\.map/);
assert.match(server, /Periksa konfigurasi seller di halaman Robot AI/);
assert.match(server, /autonomous_loop_enabled:.*shopAppConfigured\(\).*sellerAuthorized/);
assert.match(scheduler, /startAutonomyScheduler/);
assert.match(scheduler, /source: "autonomous_scheduler"/);
assert.match(server, /\/api\/tiktok\/upload-init/);
assert.match(server, /\/api\/content\/prepare/);
assert.match(server, /\/api\/sales\/plan/);
assert.match(server, /\/api\/sales\/analyze/);
assert.match(server, /\/api\/product-intelligence/);
assert.match(server, /\/api\/content\/factory/);
assert.match(server, /\/api\/autonomy\/policy/);
assert.match(server, /\/api\/experiments/);
assert.match(server, /\/api\/tasks\/engine/);
assert.match(server, /buildProductIntelligence/);
assert.match(server, /shopCredentialsConfigured/);
assert.match(server, /autonomous_loop_requested/);
assert.match(server, /buildContentFactory/);
assert.match(server, /autonomyPolicy/);
assert.match(server, /buildSalesPlan/);
assert.match(server, /analyzePerformance/);
assert.match(server, /\/api\/tasks/);
assert.match(server, /\/api\/tiktok\/upload-chunk\/:upload_id/);
assert.match(server, /Content-Range/);
assert.match(server, /Content-Length/);
assert.match(server, /totalChunkCount/);
assert.match(server, /nextByte/);
assert.match(server, /chunkIndex/);
assert.match(server, /tiktok_completed_before_expected_final_chunk/);
assert.match(server, /tiktok_did_not_complete_final_chunk/);
assert.match(server, /task\.openId = session\.openId \|\| null/);

assert.match(server, /app\.get\(\/\^/);
assert.match(server, /tiktok\(\[A-Za-z0-9\]\{24,80\}\)/);
assert.match(server, /\\\.txt\$\//);
assert.match(server, /PULL_FROM_URL/);
assert.match(server, /timingSafeEqual/);
assert.match(server, /HttpOnly/);
assert.match(server, /X-Content-Type-Options/);
assert.match(server, /rateLimit/);
assert.match(server, /brand_organic_toggle/);
assert.match(server, /is_aigc/);
assert.match(server, /next_cursor/);
assert.match(server, /SameSite=Lax/);
assert.match(server, /escapeHtml/);
assert.match(server, /MEMORY_CLEANUP_INTERVAL_MS/);
assert.match(server, /TASK_RETENTION_MS/);
assert.match(server, /UPLOAD_JOB_RETENTION_MS/);
assert.match(server, /cleanupMemoryState/);
assert.doesNotMatch(server, /TIKTOK_CLIENT_SECRET\s*=\s*["'][^"']+["']/);
assert.equal(pkg.scripts.start, "node server.mjs");

const missingSignals = scoreProduct({ id: "p1", name: "No Data" });
assert.equal(missingSignals.opportunity_score, null);
const stockOnly = scoreProduct({ id: "p2", stock_score: 80 });
assert.equal(stockOnly.opportunity_score, 80);
const perf = analyzePerformance({ items: [{ id: "v1", views: 1000, likes: 100, comments: 20, shares: 10, conversions: 10 }] });
assert.equal(perf.items[0].conversion_rate, 1);
assert.ok(perf.items[0].score > 0 && perf.items[0].score < 100);
const analytics = normalizeProductPerformance({ data: { products: [{ id: "p1", title: "Demo", total_performance: { product_impressions: 1000, product_clicks: 100, click_order_rate: "0.08", estimated_customers: 5, gmv_incl_tax: { amount: "123.45" } } }] } });
assert.equal(analytics[0].signals.impressions, 1000);
assert.equal(analytics[0].signals.clicks, 100);
assert.equal(analytics[0].signals.gmv, 123.45);


const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const originalUpstashFetch = globalThis.fetch;
try {
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash-test.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-upstash-token";
  const { createUpstashMemoryAdapter: createTestUpstashAdapter } = await import("../upstash-memory-adapter.mjs?smoke-test");
  const commands = [];
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(String(url), "https://upstash-test.example");
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer test-upstash-token");
    const command = JSON.parse(init.body);
    commands.push(command);
    let result = null;
    if (command[0] === "GET") result = '{"saved":true}';
    else if (command[0] === "SET") result = "OK";
    else if (command[0] === "DEL") result = 1;
    else if (command[0] === "KEYS") result = ["robot-ai:memory:task:1"];
    else if (command[0] === "MGET") result = ['{"task_id":"task:1"}'];
    return { ok: true, status: 200, json: async () => ({ result }) };
  };
  const memoryAdapter = createTestUpstashAdapter();
  assert.deepEqual(await memoryAdapter.get("user"), { saved: true });
  assert.deepEqual(await memoryAdapter.set("user", { saved: true }), { saved: true });
  assert.equal(await memoryAdapter.delete("user"), true);
  assert.deepEqual(await memoryAdapter.list("task:"), [{ task_id: "task:1" }]);
  assert.deepEqual(commands.map((command) => command[0]), ["GET", "SET", "DEL", "KEYS", "MGET"]);
} finally {
  globalThis.fetch = originalUpstashFetch;
  if (originalUpstashUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
  else process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
  if (originalUpstashToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
  else process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
}

console.log("Robot AI smoke checks passed.");

assert.equal(typeof sellerAuthStatus, "function");
assert.equal(typeof buildSellerAuthorizeUrl, "function");
assert.equal(typeof upstashMemoryConfigured, "function");
assert.equal(typeof createUpstashMemoryAdapter, "function");
assert.equal(buildContentExecution({ video_url: "https://example.com/video.mp4", posts_today: 0 }).ready, true);

const creatorPolicy = {
  privacy_level_options: ["PUBLIC_TO_EVERYONE", "SELF_ONLY"],
  max_video_post_duration_sec: 120,
  comment_disabled: false,
  duet_disabled: false,
  stitch_disabled: false
};
const validPostInput = {
  user_consent: true,
  privacy_level: "PUBLIC_TO_EVERYONE",
  video_duration_sec: 30,
  disable_comment: false,
  disable_duet: false,
  disable_stitch: false,
  commercial_content_toggle: false,
  brand_organic_toggle: false,
  brand_content_toggle: false
};
assert.equal(validateDirectPostInput(validPostInput, creatorPolicy).ok, true);
assert.equal(validateDirectPostInput({ ...validPostInput, user_consent: false }, creatorPolicy).error, "explicit_user_consent_required");
assert.equal(validateDirectPostInput({ ...validPostInput, privacy_level: "" }, creatorPolicy).error, "privacy_level_selection_required");
assert.equal(validateDirectPostInput({ ...validPostInput, video_duration_sec: 121 }, creatorPolicy).error, "video_duration_exceeds_creator_limit");


const originalApiKey = process.env.AI_API_KEY;
const originalAiModel = process.env.AI_MODEL;
const originalAiBaseUrl = process.env.AI_BASE_URL;
const originalFetch = globalThis.fetch;
try {
  // Make provider assertions deterministic even when production has its own model/base URL.
  delete process.env.AI_MODEL;
  delete process.env.AI_BASE_URL;
  delete process.env.AI_API_KEY;
  assert.equal(aiProviderStatus().configured, false);
  assert.deepEqual(await generateText("hello"), { ok: false, code: "ai_provider_not_configured" });

  process.env.AI_API_KEY = "   ";
  assert.equal(aiProviderStatus().configured, false);
  assert.deepEqual(await generateText("whitespace key"), { ok: false, code: "ai_provider_not_configured" });

  process.env.AI_API_KEY = "  test-only-key  ";
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.method, "POST");
    assert.equal(init.headers.Authorization, "Bearer test-only-key");
    const body = JSON.parse(init.body);
    assert.equal(body.model, "gpt-4.1-mini");
    assert.equal(body.messages[1].content, "test prompt");
    return {
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: "Draft content" } }], usage: { total_tokens: 12 } })
    };
  };
  assert.deepEqual(await generateText("test prompt"), {
    ok: true,
    text: "Draft content",
    usage: { total_tokens: 12 }
  });

  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content: "   " } }] })
  });
  assert.deepEqual(await generateText("empty response"), {
    ok: false,
    code: "ai_provider_empty_response"
  });

  globalThis.fetch = async () => {
    throw new TypeError("network unavailable");
  };
  assert.deepEqual(await generateText("network error"), {
    ok: false,
    code: "ai_provider_unavailable"
  });

  globalThis.fetch = async () => ({
    ok: false,
    status: 429,
    json: async () => ({ error: { message: "rate limited" } })
  });
  const providerError = await generateText("provider error");
  assert.equal(providerError.ok, false);
  assert.equal(providerError.code, "ai_provider_error");
  assert.equal(providerError.status, 429);
} finally {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.AI_API_KEY;
  else process.env.AI_API_KEY = originalApiKey;
  if (originalAiModel === undefined) delete process.env.AI_MODEL;
  else process.env.AI_MODEL = originalAiModel;
  if (originalAiBaseUrl === undefined) delete process.env.AI_BASE_URL;
  else process.env.AI_BASE_URL = originalAiBaseUrl;
}

const creatorTokenGood = validateAffiliateCreatorToken({
  code: 0,
  data: { user_type: 1, access_token: "creator-token", granted_scopes: ["creator.affiliate_collaboration.read"] }
});
assert.equal(creatorTokenGood.ok, true);
assert.equal(creatorTokenGood.user_type, 1);
assert.deepEqual(creatorTokenGood.granted_scopes, ["creator.affiliate_collaboration.read"]);
assert.equal(validateAffiliateCreatorToken({
  code: 0,
  data: { user_type: 0, access_token: "seller-token" }
}).ok, false);
assert.equal(validateAffiliateCreatorToken({
  code: 0,
  data: { user_type: 1 }
}).ok, false);
