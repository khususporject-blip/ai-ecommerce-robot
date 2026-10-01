# Robot AI — Sales Brain Master Plan

Robot AI is being built as a sales brain for the owner's TikTok Shop operation, not merely as a posting utility.

## Core operating loop

**Data → Analyze → Decide → Create → Execute → Measure → Learn → Optimize → Repeat**

## Core engines

1. **Sales Brain** — objectives, product prioritization, next-action selection.
2. **Product Intelligence** — demand, margin, competition, content potential, stock.
3. **Content Factory** — hooks, angles, scripts, captions, CTAs, experiments.
4. **TikTok Execution Engine** — OAuth, Direct Post, Upload/Draft, status tracking.
5. **Performance Brain** — engagement/conversion analysis and experiment recommendations.
6. **Autonomous Optimization** — feedback loops that select the next experiment from measured results.
7. **Autonomy Controller** — spending/action limits, approval gates, audit trail, emergency stop.
8. **Persistent Business Memory** — products, content, experiments, outcomes, decisions, account history.
9. **Objective Engine** — optimize actions toward measurable sales objectives rather than posting volume.
10. **Owner Control** — owner remains the authority for sensitive or irreversible actions.

## Current implementation

- `sales-brain.mjs`: deterministic product opportunity scoring and sales-plan generation.
- `product-intelligence.mjs`: normalized product opportunity scoring and ranking.
- `content-factory.mjs`: repeatable hooks, angles, scripts, captions, CTAs, and experiment plans.
- `autonomy-policy.mjs`: action limits, approval gates, and emergency-stop policy.
- `performance-brain.mjs`: deterministic performance scoring and next-action recommendations.
- `POST /api/sales/plan`: authenticated sales planning endpoint.
- `POST /api/sales/analyze`: authenticated performance analysis endpoint.
- `POST /api/product-intelligence`: authenticated product intelligence endpoint.
- `POST /api/content/factory`: authenticated content factory endpoint.
- `POST /api/autonomy/policy`: authenticated autonomy policy endpoint.
- `GET /api/shop/products` and `GET /api/shop/orders`: TikTok Shop Seller API adapters, gated by seller authorization credentials.
- `GET /api/tiktok/performance`: TikTok Display API performance input using `video.list` when that scope is granted.
- `POST /api/robot/cycle`: autonomous planning loop that connects product intelligence, sales plan, content factory, experiments, tasks, and policy.
- `POST /api/autonomy/emergency-stop`: runtime emergency stop.
- `POST /api/ai/generate`: optional LLM provider adapter; deterministic engines remain available without it.
- `audit-log.mjs`, `data-adapter.mjs`, `tiktok-shop-client.mjs`, `autonomous-loop.mjs`: execution/data foundations.
- `robot-agent.mjs`: sales-brain intent routing foundation.
- Smoke tests cover the new sales endpoints.

## External capability gates

TikTok Direct Post requires the approved and authorized `video.publish` scope. Upload/Draft uses `video.upload`. TikTok also requires creator information to be queried before the Direct Post export flow. The final production behavior therefore depends on the permissions and capabilities actually approved for the app.

## Next engineering priorities

1. Complete Seller Center authorization and grant the minimum required Shop API scopes before live catalog/order execution.\n2. Connect supported TikTok data sources to Product Intelligence and Performance Brain.
3. Feed Product Intelligence into Sales Brain so product selection uses one normalized scoring engine.
4. Replace in-memory business state with encrypted persistent storage.
5. Build the Content Factory as a real generation/execution pipeline.
6. Add experiment registry and automatic winner/loser iteration based on measured data.
7. Enforce autonomy policy at every execution endpoint and add audit logging.
8. Add TikTok Shop commerce data integration where an approved/available API supports it.
9. Run end-to-end tests after TikTok approval and authorization.\n\n## Current external gates\n\nThe codebase now contains the integration layers, but live TikTok Shop commerce execution still requires a Seller Center-authorized seller token, shop cipher, app credentials, and the corresponding Partner Center scopes. TikTok Shop documentation distinguishes seller authorization from creator authorization, and seller APIs use `x-tts-access-token`, signed requests, and `shop_cipher` where required. The public TikTok Content Posting/Display APIs are also separate from TikTok Shop Seller APIs.
