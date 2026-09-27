# Robot AI — TikTok Login Kit

## Architecture

Robot AI uses TikTok Login Kit for Web with OAuth 2.0.

- Browser: sends the user to `GET /auth/tiktok`.
- Backend: generates a cryptographically random OAuth `state`, stores it server-side, and redirects to TikTok.
- Callback: `GET /auth/tiktok/callback`.
- Backend exchanges the authorization code at TikTok's v2 token endpoint.
- Backend requests the TikTok profile through `/v2/user/info/`.
- TikTok access/refresh tokens remain server-side.
- The browser receives only an HttpOnly session cookie.

## Required server environment variables

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `APP_BASE_URL` (for example `https://robot-ai.example.com`)
- Optional: `TIKTOK_REDIRECT_URI` (defaults to `APP_BASE_URL/auth/tiktok/callback`)
- Optional: `TIKTOK_SCOPES` (defaults to `user.info.basic,user.info.profile`)
- `NODE_ENV=production`

Never put the client secret in HTML, JavaScript shipped to the browser, Git, or public environment variables.

## TikTok configuration

Register the exact HTTPS callback URI in the Login Kit Web configuration:

`https://YOUR_BACKEND_HOST/auth/tiktok/callback`

The URI must be static and must exactly match the value used by the server.

## Local smoke test

Set the environment variables, then run:

`npm install`

`npm start`

Check:

`GET /health`

Expected result:

`{"ok":true,"service":"robot-ai","oauthConfigured":true}`

Then open:

`/auth/tiktok`

## Production hardening

The current server keeps OAuth sessions and token records in process memory so the OAuth flow can be tested without introducing a database dependency. For multi-instance production automation, replace the `pendingStates` and `sessions` maps with a persistent encrypted store and add refresh-token rotation handling.

The TikTok client secret and refresh token must stay server-side. The authorization-code exchange uses TikTok's current v2 endpoint and form-encoded request body.
