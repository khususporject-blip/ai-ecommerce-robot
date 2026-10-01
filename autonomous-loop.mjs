import { buildProductIntelligence } from "./product-intelligence.mjs";
import { buildSalesPlan } from "./sales-brain.mjs";
import { buildContentFactory } from "./content-factory.mjs";
import { createExperiment } from "./experiment-registry.mjs";
import { createTask } from "./task-engine.mjs";
import { evaluateAction } from "./autonomy-policy.mjs";

export function runAutonomousCycle(input = {}) {
  const products = Array.isArray(input.products) ? input.products.slice(0, 100) : [];
  const performance = Array.isArray(input.performance) ? input.performance.slice(0, 100) : [];
  const objective = String(input.objective || "meningkatkan penjualan").trim().slice(0, 300);
  const audience = String(input.audience || "calon pembeli TikTok Shop").trim().slice(0, 300);
  const intelligence = buildProductIntelligence({ products });
  const plan = buildSalesPlan({ products, objective, audience, budget: input.budget });
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
    next: products.length ? "EXECUTE_QUEUED_TASKS_THEN_MEASURE" : "CONNECT_TIKTOK_SHOP_DATA_SOURCE"
  };
}
