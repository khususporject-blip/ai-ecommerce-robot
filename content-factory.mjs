const clean = (value, fallback = "") => String(value ?? fallback).trim().slice(0, 500);

const DEFAULT_ANGLES = [
  { id: "problem_solution", name: "Masalah → solusi", prompt: "Tunjukkan masalah nyata pembeli lalu demonstrasikan solusi produk." },
  { id: "proof_demo", name: "Demo / bukti penggunaan", prompt: "Tunjukkan produk dipakai dalam situasi nyata dan hasil yang dapat diamati." },
  { id: "comparison", name: "Perbandingan", prompt: "Bandingkan pendekatan lama dengan produk secara faktual tanpa klaim yang tidak terbukti." },
  { id: "objection", name: "Jawab keberatan", prompt: "Jawab satu keberatan pembeli paling umum dengan informasi produk yang tersedia." },
  { id: "use_case", name: "Use case", prompt: "Bangun skenario penggunaan spesifik untuk target pembeli." }
];

export function buildContentFactory(input = {}) {
  const product = clean(input.product, "produk");
  const audience = clean(input.audience, "calon pembeli");
  const offer = clean(input.offer);
  const count = Math.max(1, Math.min(10, Number(input.variations) || 5));
  const angles = DEFAULT_ANGLES.slice(0, count);

  return {
    version: "content-factory-v1",
    status: "CONTENT_PLAN_READY",
    product,
    audience,
    offer: offer || null,
    experiments: angles.map((angle, index) => ({
      experiment_id: `exp-${index + 1}`,
      angle_id: angle.id,
      angle: angle.name,
      hook: `${angle.name}: Kenapa ${product} relevan untuk ${audience}?`,
      script_outline: [angle.prompt, "Tampilkan fakta/fitur yang tersedia.", "Akhiri dengan CTA yang jelas dan tidak menyesatkan."],
      caption: `${product} untuk ${audience}.${offer ? " " + offer : ""}`,
      cta: "Lihat detail produk dan pilih sesuai kebutuhan.",
      success_signal: "ukur respons dan konversi menggunakan data yang tersedia"
    })),
    policy: {
      no_unverified_claims: true,
      no_guaranteed_results: true,
      human_review_for_sensitive_claims: true
    }
  };
}
