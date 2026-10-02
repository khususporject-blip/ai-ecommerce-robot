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
