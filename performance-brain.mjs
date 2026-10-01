const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));

export function analyzePerformance(input = {}) {
  const items = Array.isArray(input.items) ? input.items.slice(0, 100) : [];
  const analyzed = items.map((item, index) => {
    const views = Math.max(0, Number(item.views) || 0);
    const likes = Math.max(0, Number(item.likes) || 0);
    const comments = Math.max(0, Number(item.comments) || 0);
    const shares = Math.max(0, Number(item.shares) || 0);
    const conversions = Math.max(0, Number(item.conversions) || 0);
    const engagement = views ? ((likes + comments + shares) / views) * 100 : 0;
    const conversionRate = views ? (conversions / views) * 100 : 0;
    const score = clamp(engagement * 0.55 + conversionRate * 100 * 0.45);
    return {
      id: String(item.id ?? `content-${index + 1}`),
      title: String(item.title ?? ""),
      views,
      engagement_rate: Number(engagement.toFixed(4)),
      conversion_rate: Number(conversionRate.toFixed(4)),
      score: Number(score.toFixed(2)),
      recommendation: score >= 60 ? "ITERATE" : score >= 25 ? "TEST_VARIATION" : "REWORK"
    };
  }).sort((a, b) => b.score - a.score);

  return {
    version: "performance-brain-v1",
    status: items.length ? "ANALYZED" : "WAITING_FOR_DATA",
    items: analyzed,
    next_actions: items.length
      ? ["Prioritaskan variasi dari konten ber-sinyal terbaik.", "Uji hook/angle baru pada konten lemah.", "Ukur kembali hasil sebelum menaikkan volume."]
      : ["Hubungkan sumber data performa yang diizinkan.", "Masukkan metrik konten untuk memulai feedback loop."]
  };
}
