# Robot AI

Robot AI is an AI shopping-assistant foundation with TikTok Login Kit integration.

## Current architecture

- Static Robot AI UI: `index.html`
- Node/Express backend: `server.mjs`
- TikTok OAuth entry: `GET /auth/tiktok`
- TikTok OAuth callback: `GET /auth/tiktok/callback`
- Health check: `GET /health`
- Authenticated profile check: `GET /api/me`
- TikTok creator info: `GET /api/tiktok/creator-info`
- TikTok direct-post from verified URL: `POST /api/tiktok/publish-url`
- Assistant command router: `POST /api/assistant`
- OAuth documentation: `docs/tiktok-login.md`

## TikTok Login Kit

The implementation uses TikTok's current Web OAuth v2 flow. The client secret and tokens are backend-only. The callback validates an anti-forgery state cookie before exchanging the authorization code.

Required server variables:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `APP_BASE_URL`
- `TIKTOK_REDIRECT_URI` (optional; defaults to `APP_BASE_URL/auth/tiktok/callback`)
- `TIKTOK_SCOPES` (optional; defaults to `user.info.basic,video.publish,video.upload`)
- `NODE_ENV=production`

## Hosting

The production Node/Express service is deployed on Railway.

Public service domain:
`https://robot-ai-production-1fdb.up.railway.app`

Production callback URI:
`https://robot-ai-production-1fdb.up.railway.app/auth/tiktok/callback`

Railway healthcheck:
`/health`

Railway injects the runtime `PORT`; the server listens on `process.env.PORT`.

## Verification

TikTok URL-property verification file is present at the repository root with the exact filename and verification value supplied by TikTok.

The exact Railway callback URI must be registered in TikTok Login Kit Web configuration. The TikTok client key and secret are intentionally not stored in GitHub.

## Direct Post

The backend now contains the Direct Post request path using `PULL_FROM_URL`. TikTok requires the relevant Content Posting API permission and a verified URL/domain for this source method. Unaudited clients are subject to TikTok's posting restrictions.

## Security notes

- Never commit `TIKTOK_CLIENT_SECRET`.
- Never exchange TikTok authorization codes from browser JavaScript.
- Keep access and refresh tokens server-side.
- Use HTTPS in production.
- OAuth state is generated server-side and checked against an HttpOnly cookie.
- TikTok Shop seller sessions use an encrypted persistent store backed by Upstash Redis when configured, otherwise the file-memory adapter. The TikTok creator Login Kit session map is currently process-local and is cleared on restart; users may need to sign in again. Do not run multi-instance production automation without a shared durable backend. Set `SELLER_SESSION_ENCRYPTION_KEY` to a stable, high-entropy secret so seller sessions remain decryptable across deployments and secret rotations.

## TikTok Shop Seller Authorization

Seller authorization is a separate TikTok Shop flow from TikTok creator Login Kit. The production seller path is `GET /auth/tiktok-shop/seller`; it requires `TTS_APP_KEY`, `TTS_APP_SECRET`, `TTS_SERVICE_ID`, and a configured `TTS_SELLER_AUTH_URL`. After owner consent, the backend exchanges the authorization code, validates seller `user_type`, retrieves authorized shops, stores the selected `shop_cipher` with encrypted session credentials, and refreshes seller tokens when possible. Seller secrets and tokens are never returned to the browser.

## AI Provider

AI generation is deliberately credential-gated. Set `AI_API_KEY` and optionally `AI_BASE_URL` / `AI_MODEL`; without an explicit provider credential the runtime returns `ai_provider_not_configured` rather than fabricating AI output or silently using an unknown provider.

## Deployment trigger

Operational deployment note: Railway must deploy the current default-branch commit; a Railway "Redeploy" reuses the previous deployment snapshot and does not fetch a newer GitHub commit. After a source change, verify the active deployment commit and runtime health before treating the release as live.

## Full Autonomous Sales Brain

The current main branch contains the autonomous sales foundation: Product Intelligence, Sales Brain, Content Factory, Performance Brain, Experiment Registry, Task Engine, business memory, audit logging, autonomy policy/emergency stop, TikTok Shop product/order adapters, TikTok video-performance ingestion, and the autonomous cycle orchestrator.

Runtime capabilities remain data- and authorization-gated. The system must never fabricate product, inventory, conversion, revenue, or performance data. Commerce execution requires an authorized TikTok Shop seller data source; AI text generation requires an explicitly configured provider; TikTok creator execution requires the corresponding approved scopes and user authorization.


<!-- production deployment trigger: 2026-10-01T17:51:11.514Z -->

## TikTok Shop Affiliate Creator (separate from Seller API)

Robot AI has a dedicated creator authorization entry point: `GET /auth/tiktok-shop/affiliate-creator`, with callback `/auth/tiktok-shop/affiliate-creator/callback`. This is the intended path for a creator who promotes other sellers' products without holding inventory. It is not interchangeable with Seller Authorization or TikTok Login Kit.

Configure these production variables from the **Affiliate app** in TikTok Shop Partner Center (do not copy seller or Login Kit credentials unless Partner Center explicitly confirms they belong to this same Affiliate app):

- `TTS_AFFILIATE_APP_KEY`
- `TTS_AFFILIATE_APP_SECRET`
- `APP_BASE_URL=https://robot-ai-production-1fdb.up.railway.app` (used to derive the callback unless `TTS_AFFILIATE_REDIRECT_URI` is set)
- Optional `TTS_AFFILIATE_REDIRECT_URI=https://robot-ai-production-1fdb.up.railway.app/auth/tiktok-shop/affiliate-creator/callback`

Register that exact callback in Partner Center. The flow uses the official creator authorization URL with a server-generated, single-use state, exchanges the callback code server-side, requires `user_type=1`, and stores creator tokens encrypted separately from seller tokens. Status is available at `GET /api/affiliate-creator/authorization-status` and in `/health`. Once the creator token includes `creator.affiliate_collaboration.read`, the owner-session-protected `POST /api/affiliate-creator/products/search` searches the official open-collaboration product marketplace using optional `title_keywords`, `sales_price_range`, `category`, `commission_rate_range`, `page_size`, `page_token`, `sort_field`, and `sort_order` inputs. It returns TikTok API results without inventing product facts.

**Important external gate:** TikTok Shop Affiliate API access is inactive by default and may require Partner Center / Partner Manager approval and approved creator scopes. The new flow cannot manufacture those approvals. After the account is authorized, validate the returned `granted_scopes` and test a real Creator API call before enabling product discovery or posting. Official references: [Creator authorization guide](https://partner.tiktokshop.com/docv2/page/678e3a362dccb8030ea6f98c) and [Affiliate integration](https://partner.tiktokshop.com/docv2/page/affiliate-integration).
