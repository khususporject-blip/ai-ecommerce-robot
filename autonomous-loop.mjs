import { buildProductIntelligence } from "./product-intelligence.mjs";
import { buildSalesPlan } from "./sales-brain.mjs";
import { buildContentFactory } from "./content-factory.mjs";
import { createExperiment } from "./experiment-registry.mjs";
import { createTask } from "./task-engine.mjs";
import { evaluateAction } from "./autonomy-policy.mjs";

function percentileScore(value, values) {
  const nums = values.filter((x) => Number.isFinite(x));
  if (!nums.length || !Number.isFinite(value)) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  if (max === min) return 50;
  return Math.round(((value - min) / (max - min)) * 100);
}

function enrichProducts(products, performance) {
  if (!Array.isArray(performance) || !performance.length) return products;
  const byId = new Map(performance.map((item) => [String(item.product_id || ""), item]));
  const impressions = performance.map((item) => Number(item.signals?.impressions)).filter(Number.isFinite);
  const customers = performance.map((item) => Number(item.signals?.estimated_customers)).filter(Number.isFinite);
  return products.map((product) => {
    const match = byId.get(String(product.id || ""));
    if (!match) return product;
    const demandScore = percentileScore(Number(match.signals?.impressions), impressions);
    const conversionScore = Number.isFinite(Number(match.signals?.click_order_rate))
      ? Math.max(0, Math.min(100, Number(match.signals.click_order_rate) * 100))
      : null;
    const customerScore = percentileScore(Number(match.signals?.estimated_customers), customers);
    return {
      ...product,
      ...(demandScore !== null ? { demand_score: demandScore } : {}),
      ...(conversionScore !== null ? { content_score: conversionScore } : {}),
      ...(customerScore !== null ? { demand_score: Math.round((demandScore ?? customerScore) * 0.6 + customerScore * 0.4) } : {})
    };
  });
}

export function runAutonomousCycle(input = {}) {
  const products = Array.isArray(input.products) ? input.products.slice(0, 100) : [];
  const performance = Array.isArray(input.performance) ? input.performance.slice(0, 100) : [];
  const objective = String(input.objective || "meningkatkan penjualan").trim().slice(0, 300);
  const audience = String(input.audience || "calon pembeli TikTok Shop").trim().slice(0, 300);
  const enrichedProducts = enrichProducts(products, performance);
  const intelligence = buildProductIntelligence({ products: enrichedProducts });
  const plan = buildSalesPlan({ products: enrichedProducts, objective, audience, budget: input.budget });
  const selected = intelligence.priority || [];
  const content = selected.map((product) => buildContentFactory({
    product: product.name,
    audience,
    offer: input.offer,
    variations: 5
  }));
  const experiments = content.flatMap((factory, index) => factory.experiments.map((experiment) => createExperiment({
    id: `exp-${Date.now().toString(36)}-${index + 1}-${experiment.experiment_id}`,
    product_id: selected[index]?.id,
    content_id: experiment.experiment_id,
    hypothesis: `Angle ${experiment.angle} menghasilkan sinyal lebih baik untuk ${selected[index]?.name || "produk"}.`
  })));
  const tasks = experiments.map((experiment) => createTask({
    type: "content_experiment",
    payload: { experiment_id: experiment.id, product_id: experiment.product_id, content_id: experiment.content_id }
  }));
  const publishDecision = evaluateAction("publish_content", { posts_today: Number(input.posts_today) || 0 });
  return {
    version: "autonomous-loop-v1",
    status: products.length ? "CYCLE_PLANNED" : "WAITING_FOR_PRODUCT_DATA",
    objective,
    audience,
    intelligence,
    plan,
    content,
    experiments,
    tasks,
    performance,
    publish_policy: publishDecision,
    data_sources: {
      product_catalog: products.length ? "CONNECTED" : "MISSING",
      shop_analytics: performance.length ? "CONNECTED" : "MISSING"
    },
    next: products.length ? (performance.length ? "EXECUTE_QUEUED_TASKS_THEN_MEASURE" : "CONNECT_SHOP_ANALYTICS_THEN_EXECUTE") : "CONNECT_TIKTOK_SHOP_DATA_SOURCE"
  };
}
