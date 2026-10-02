# Robot AI — Production Readiness

## Mission

Robot AI is being built as a sales brain for TikTok Shop: product intelligence → content experiments → authorized execution → measurement → optimization → memory, with explicit owner control for sensitive or irreversible actions.

## Implemented

- TikTok Login Kit OAuth authorization-code flow with server-side state validation.
- Refresh-token handling and server-side session tokens.
- TikTok URL-prefix verification endpoint.
- Content Posting API Direct Post foundation and Upload/Draft chunk upload foundation.
- Publish status handling and audit logging.
- TikTok Display API performance ingestion.
- TikTok Shop seller API client foundation for products and orders.
- TikTok Shop Analytics v202605 product-performance ingestion.
- Product funnel signals are now fed into autonomous product prioritization when analytics credentials/data are available.
- Product scoring no longer treats missing factors as zero.
- Performance scoring no longer multiplies small conversion rates by an excessive factor.
- Content Factory, Sales Brain, Product Intelligence, Experiment Registry, Task Engine, Autonomy Policy, Business Memory, AI-provider adapter, and scheduler foundations.
- Emergency stop and action limits.
- GitHub CI and a guarded Railway deployment workflow.
- Production health endpoint exposes effective autonomy state instead of only the requested flag.
- API security hardening: security headers, bounded JSON payloads, endpoint-aware in-memory rate limits, and publish metadata controls for organic-brand/AIGC declarations.
- TikTok video performance ingestion supports cursor-based pagination.

## Runtime gates

Robot AI intentionally does not pretend that a capability is active when its external authorization/configuration is missing.

### TikTok creator side

The current creator OAuth session is separate from TikTok Shop seller authorization. A creator token must never be used as a seller token.

### TikTok Shop seller side

The autonomous seller loop requires valid seller-side credentials:
- TTS_APP_KEY
- TTS_APP_SECRET
- TTS_ACCESS_TOKEN
- TTS_SHOP_CIPHER

The Analytics product-performance API also requires the corresponding TikTok Shop Analytics scope. TikTok documents the new 202605 product/video analytics APIs as seller-authorized, T-1 data, with pagination up to 100 items.

### AI provider

The optional LLM adapter requires AI_API_KEY. Without it, the deterministic planning engines remain available and no fake AI response is generated.

### Persistence

Business memory currently uses a file-backed adapter. Without a persistent Railway volume or external database, memory is not durable across instance replacement/redeployment. This is a deliberate runtime gate rather than a hidden claim of durability.

### Production deployment

The GitHub Railway deployment workflow is credential-gated. If a Railway token is unavailable to GitHub Actions, the workflow reports the deployment as skipped instead of failing or claiming a production deployment.

## Remaining owner/external-provider gates

These cannot be fabricated safely by code:

1. TikTok Shop seller authorization and seller-side scopes.
2. TikTok app/review decisions controlled by TikTok.
3. Provider credentials/secrets that are not available to the project.
4. Persistent storage infrastructure if long-lived business memory across restarts is required.
5. Media generation/storage/CDN capability for fully automated video production; the current Content Factory produces structured content plans, not synthetic video files.
6. Railway latest-commit deployment is currently externally gated: the GitHub deployment workflow can deploy when a Railway token is available, while the connected Railway service currently has no tool-accessible action to force the latest GitHub commit. Railway documents that “Deploy Latest Commit” or a specific commit deployment is distinct from redeploying the old deployment.

## Verification rule

Every new capability must be represented by:
1. source implementation,
2. smoke/unit coverage,
3. runtime health/configuration reporting,
4. explicit external dependency gate,
5. audit logging for consequential execution.

The system must never report a capability as live merely because its code exists.


## Production gap closure — 2026-10-02

Implemented in source:
- Seller OAuth authorization flow: `/auth/tiktok-shop/seller` → callback → token exchange → authorized-shop discovery → seller session.
- Seller credentials remain separate from TikTok creator Login Kit credentials.
- TikTok Shop client now accepts per-seller credentials and uses the documented HMAC-SHA256 wrapping for signed API requests.
- Durable-memory adapter path added for Upstash Redis REST; file memory remains the local fallback.
- AI content generation endpoint: `POST /api/content/generate`.
- Content execution endpoint: `POST /api/content/execute` for an HTTPS media URL using TikTok Direct Post.
- Smoke coverage added for the new execution modules.

External runtime gates still outstanding:
- Railway production is still running commit `28e2c57fd5c99b1f292a596091d83898badfe112`; source `4089e77dbc810bd7364103e1916928b3ac093aa3` is newer and CI-green. Railway's current GitHub Action has no Railway token, so its deploy step is intentionally skipped.
- Seller authorization requires the TikTok Shop app's `service_id`, seller authorization URL/region, and approved seller scopes. The app code is ready but cannot manufacture those account-side values.
- Durable memory becomes genuinely durable when either an Upstash REST database is configured via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, or the existing Railway service is attached to a persistent volume and `BUSINESS_MEMORY_DIR` points at its mount. Railway documents that ordinary service filesystem storage is ephemeral while volumes persist across deployments.
- Actual AI media/video generation still requires a media-generation provider or a supplied HTTPS media asset. Text/strategy generation is provider-backed through `AI_API_KEY`.

<!-- Railway production sync probe: 2026-10-02 -->
