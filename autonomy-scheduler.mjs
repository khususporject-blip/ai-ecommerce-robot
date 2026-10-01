const DEFAULT_INTERVAL_MS = 60 * 60 * 1000;

export function startAutonomyScheduler({
  enabled = false,
  intervalMs = DEFAULT_INTERVAL_MS,
  runCycle,
  loadProducts
} = {}) {
  if (!enabled || typeof runCycle !== "function" || typeof loadProducts !== "function") return null;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const products = await loadProducts();
      if (!Array.isArray(products) || products.length === 0) return;
      await runCycle({ products, source: "autonomous_scheduler" });
    } catch (error) {
      console.error("Autonomy scheduler cycle failed:", error?.message || error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, Math.max(60_000, Number(intervalMs) || DEFAULT_INTERVAL_MS));
  timer.unref?.();
  return { timer, tick };
}
