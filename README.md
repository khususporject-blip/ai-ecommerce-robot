# Robot AI

Robot AI is an AI shopping-assistant foundation with TikTok Login Kit integration.

## Current architecture

- Static Robot AI UI: `index.html`
- Node/Express backend: `server.mjs`
- TikTok OAuth entry: `GET /auth/tiktok`
- TikTok OAuth callback: `GET /auth/tiktok/callback`
- Health check: `GET /health`
- Authenticated profile check: `GET /api/me`
- Logout: `POST /auth/logout`
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

## Security notes

- Never commit `TIKTOK_CLIENT_SECRET`.
- Never exchange TikTok authorization codes from browser JavaScript.
- Keep access and refresh tokens server-side.
- Use HTTPS in production.
- OAuth state is generated server-side and checked against an HttpOnly cookie.
- The current session/token store is in-memory and is suitable for the current single-instance foundation; replace it with persistent encrypted storage before multi-instance production automation.
