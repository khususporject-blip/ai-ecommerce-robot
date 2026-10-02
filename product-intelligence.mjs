const clean = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 500);
const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const WEIGHTS = Object.freeze({ demand: 0.30, margin: 0.25, content: 0.20, stock: 0.15, competition: 0.10 });

function factor(value) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number) : null;
}

export function scoreProduct(product = {}) {
  const factors = {
    demand: factor(product.demand_score),
    margin: factor(product.margin_score),
    content: factor(product.content_score),
    stock: factor(product.stock_score),
    competition: factor(product.competition_score)
  };
  const available = Object.entries(factors).filter(([, value]) => value !== null);
  const weightTotal = available.reduce((sum, [key]) => sum + WEIGHTS[key], 0);
  const weighted = available.reduce((sum, [key, value]) => {
    const contribution = key === "competition" ? 100 - value : value;
    return sum + contribution * WEIGHTS[key];
  }, 0);
  const opportunity = weightTotal ? Math.round(weighted / weightTotal) : null;

  const reasons = [];
  if (factors.demand !== null && factors.demand >= 70) reasons.push("demand kuat");
  if (factors.margin !== null && factors.margin >= 70) reasons.push("margin menarik");
  if (factors.content !== null && factors.content >= 70) reasons.push("potensi konten tinggi");
  if (factors.stock !== null && factors.stock >= 70) reasons.push("stok relatif aman");
  if (factors.competition !== null && factors.competition <= 30) reasons.push("tekanan kompetisi relatif rendah");
  if (!reasons.length) reasons.push(available.length ? "perlu optimasi atau data tambahan" : "belum ada sinyal produk yang cukup");

  return {
    id: clean(product.id),
    name: clean(product.name, "Produk"),
    price: Math.max(0, Number(product.price) || 0),
    opportunity_score: opportunity,
    factors,
    available_factors: available.map(([key]) => key),
    reasons
  };
}

export function rankProducts(input = {}) {
  const products = Array.isArray(input.products) ? input.products.slice(0, 100) : [];
  return products
    .map((product, index) => {
      const scored = scoreProduct(product);
      if (!scored.id) scored.id = `product-${index + 1}`;
      if (scored.name === "Produk") scored.name = clean(product.name, `Produk ${index + 1}`);
      return scored;
    })
    .sort((a, b) => (b.opportunity_score ?? -1) - (a.opportunity_score ?? -1))
    .map((product, index) => ({ rank: index + 1, ...product }));
}

export function buildProductIntelligence(input = {}) {
  const ranked = rankProducts(input);
  const analyzedCount = ranked.filter((item) => item.opportunity_score !== null).length;
  return {
    version: "product-intelligence-v2",
    status: ranked.length ? (analyzedCount ? "ANALYZED_PARTIAL" : "WAITING_FOR_SIGNALS") : "WAITING_FOR_CATALOG",
    count: ranked.length,
    products: ranked,
    priority: ranked.filter((item) => item.opportunity_score !== null).slice(0, 5),
    data_requirements: ["demand_score", "margin_score", "content_score", "stock_score", "competition_score"],
    note: "Only supplied or API-derived signals are scored. Missing factors are excluded from the denominator rather than treated as zero."
  };
}
