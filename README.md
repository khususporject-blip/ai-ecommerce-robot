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
- Deployment descriptor: `render.yaml`
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

The repository contains a ready-to-deploy Render configuration. A connected Render account is required before ChatGPT can create the live service and securely provision the TikTok environment variables.

The previous Vercel project is not currently accessible through the active Vercel connection, so it is intentionally not modified.

GitHub Pages configuration is also retained for static hosting/verification fallback, but Pages cannot run the Node OAuth backend.

## Verification

TikTok URL-property verification file is present at the repository root with the exact filename and verification value supplied by TikTok.

After a live HTTPS backend is available, register its exact callback URI in TikTok Login Kit Web configuration.

## Security notes

- Never commit `TIKTOK_CLIENT_SECRET`.
- Never exchange TikTok authorization codes from browser JavaScript.
- Keep access and refresh tokens server-side.
- Use HTTPS in production.
- Replace the in-memory session/token store with persistent encrypted storage before multi-instance production automation.
