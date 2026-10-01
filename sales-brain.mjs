import { scoreProduct } from "./product-intelligence.mjs";
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

function text(value, fallback = "") {
  return String(value ?? fallback).trim().slice(0, 500);
}

export function buildSalesPlan(input = {}) {
  const products = Array.isArray(input.products) ? input.products.slice(0, 50) : [];
  const audience = text(input.audience, "calon pembeli TikTok Shop");
  const objective = text(input.objective, "meningkatkan penjualan");
  const budget = Number(input.budget);

  const rankedProducts = products
    .map((product, index) => ({
      id: text(product.id, `product-${index + 1}`),
      name: text(product.name, `Produk ${index + 1}`),
      score: scoreProduct(product).opportunity_score,
      reason: [
        Number(product.demand_score) >= 70 ? "demand kuat" : null,
        Number(product.margin_score) >= 70 ? "margin menarik" : null,
        Number(product.content_score) >= 70 ? "mudah dibuat konten" : null,
        Number(product.stock_score) >= 70 ? "stok relatif aman" : null
      ].filter(Boolean)
    }))
    .sort((a, b) => b.score - a.score);

  const selected = rankedProducts.slice(0, 3);
  const actions = [
    "Validasi produk dan stok sebelum promosi.",
    "Buat beberapa angle konten untuk produk prioritas.",
    "Publikasikan melalui jalur TikTok yang telah diotorisasi.",
    "Pantau performa konten dan respons pembeli.",
    "Ulangi angle yang menghasilkan sinyal positif dan hentikan eksperimen yang lemah."
  ];

  return {
    version: "sales-brain-v1",
    status: "PLAN_READY",
    objective,
    audience,
    budget: Number.isFinite(budget) && budget >= 0 ? budget : null,
    decision: selected.length
      ? "Prioritaskan produk dengan skor peluang tertinggi, lalu jalankan siklus konten → ukur → optimasi."
      : "Belum ada katalog terstruktur. Siapkan data produk sebelum robot mengambil keputusan produk.",
    selected_products: selected,
    workflow: [
      { step: 1, name: "product_intelligence", status: "ready" },
      { step: 2, name: "content_strategy", status: "ready" },
      { step: 3, name: "content_execution", status: "requires_tiktok_authorization" },
      { step: 4, name: "performance_measurement", status: "requires_supported_data_sources" },
      { step: 5, name: "optimization", status: "ready_for_feedback_loop" }
    ],
    next_actions: actions,
    autonomy: {
      automatic: ["planning", "prioritization", "content_experiment_design", "next_action_selection"],
      approval_required: ["financial_commitments", "irreversible_account_changes", "actions_not_supported_by_authorized_apis"]
    }
  };
}
