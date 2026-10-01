const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const clean = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 500);

export function scoreProduct(product = {}) {
  const demand = clamp(product.demand_score);
  const margin = clamp(product.margin_score);
  const content = clamp(product.content_score);
  const stock = clamp(product.stock_score);
  const competition = clamp(product.competition_score);
  const price = Math.max(0, Number(product.price) || 0);
  const opportunity = Math.round(
    demand * 0.30 +
    margin * 0.25 +
    content * 0.20 +
    stock * 0.15 +
    (100 - competition) * 0.10
  );
  const reasons = [];
  if (demand >= 70) reasons.push("demand kuat");
  if (margin >= 70) reasons.push("margin menarik");
  if (content >= 70) reasons.push("potensi konten tinggi");
  if (stock >= 70) reasons.push("stok relatif aman");
  if (competition <= 30) reasons.push("tekanan kompetisi relatif rendah");
  if (!reasons.length) reasons.push("perlu validasi data tambahan");

  return {
    id: clean(product.id),
    name: clean(product.name, "Produk"),
    price,
    opportunity_score: opportunity,
    factors: { demand, margin, content, stock, competition },
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
    .sort((a, b) => b.opportunity_score - a.opportunity_score)
    .map((product, index) => ({ rank: index + 1, ...product }));
}

export function buildProductIntelligence(input = {}) {
  const ranked = rankProducts(input);
  return {
    version: "product-intelligence-v1",
    status: ranked.length ? "ANALYZED" : "WAITING_FOR_CATALOG",
    count: ranked.length,
    products: ranked,
    priority: ranked.slice(0, 5),
    data_requirements: ["demand_score", "margin_score", "content_score", "stock_score", "competition_score"],
    note: "Scores are decision-support inputs; missing real commerce/catalog data is not invented."
  };
}
