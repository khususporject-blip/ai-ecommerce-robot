import fs from "node:fs/promises";
import path from "node:path";

export function createFileMemoryAdapter(root = process.env.BUSINESS_MEMORY_DIR || ".data/memory") {
  const safe = (key) => String(key || "").replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 180);
  const file = (key) => path.join(root, safe(key) + ".json");
  async function ensure() { await fs.mkdir(root, { recursive: true }); }
  return {
    async get(key) {
      try { return JSON.parse(await fs.readFile(file(key), "utf8")); }
      catch (error) { if (error?.code === "ENOENT") return null; throw error; }
    },
    async set(key, value) {
      await ensure();
      const target = file(key);
      const temp = target + ".tmp";
      await fs.writeFile(temp, JSON.stringify(value), "utf8");
      await fs.rename(temp, target);
      return value;
    },
    async delete(key) {
      try { await fs.unlink(file(key)); } catch (error) { if (error?.code !== "ENOENT") throw error; }
      return true;
    },
    async list(prefix = "") {
      await ensure();
      const names = await fs.readdir(root);
      const wanted = safe(prefix);
      const out = [];
      for (const name of names.filter((x) => x.endsWith(".json") && x.slice(0, -5).startsWith(wanted))) {
        out.push(JSON.parse(await fs.readFile(path.join(root, name), "utf8")));
      }
      return out;
    }
  };
}
