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
- `TIKTOK_SCOPES` (optional; defaults to `user.info.basic,user.info.profile`)
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
- The current session/token store is in-memory and is suitable for the current single-instance foundation; replace it with persistent encrypted storage before multi-instance production automation.

## Deployment trigger

Operational deployment note: Railway must deploy the current default-branch commit; a Railway "Redeploy" reuses the previous deployment snapshot and does not fetch a newer GitHub commit. After a source change, verify the active deployment commit and runtime health before treating the release as live.

## Full Autonomous Sales Brain

The current main branch contains the autonomous sales foundation: Product Intelligence, Sales Brain, Content Factory, Performance Brain, Experiment Registry, Task Engine, business memory, audit logging, autonomy policy/emergency stop, TikTok Shop product/order adapters, TikTok video-performance ingestion, and the autonomous cycle orchestrator.

Runtime capabilities remain data- and authorization-gated. The system must never fabricate product, inventory, conversion, revenue, or performance data. Commerce execution requires an authorized TikTok Shop seller data source; AI text generation requires an explicitly configured provider; TikTok creator execution requires the corresponding approved scopes and user authorization.


<!-- production deployment trigger: 2026-10-01T17:51:11.514Z -->
