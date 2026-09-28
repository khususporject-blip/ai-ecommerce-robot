const ACTIONS = [
  { id: "tiktok_login", patterns: [/login.*tiktok/i, /hubung.*tiktok/i, /sambung.*tiktok/i], reply: "Siap. Saya akan membuka koneksi TikTok.", path: "/auth/tiktok", status: "PROVEN" },
  { id: "auth_status", patterns: [/status.*login/i, /sudah.*login/i, /cek.*login/i], reply: "Saya cek status koneksi TikTok dari sesi Robot AI.", status: "PROVEN" },
  { id: "content_creation", patterns: [/buat.*konten.*tiktok/i, /buat.*konten/i, /bikin.*konten/i], reply: "Fondasi pembuatan konten sudah disiapkan. Eksekusi publikasi TikTok belum terhubung ke API/permission eksternal.", status: "MADE — NOT VERIFIED" },
  { id: "product_content", patterns: [/konten.*produk/i, /buat.*konten.*produk/i], reply: "Fondasi konten produk sudah disiapkan. Eksekusi katalog/publikasi menunggu API dan permission eksternal.", status: "MADE — NOT VERIFIED" },
  { id: "product_upload", patterns: [/upload.*produk/i, /unggah.*produk/i, /upload.*barang/i], reply: "Fondasi workflow upload produk sudah disiapkan. Upload nyata belum dijalankan karena API/permission TikTok Shop belum tersedia.", status: "MADE — NOT VERIFIED" },
  { id: "sales_workflow", patterns: [/workflow.*sales/i, /penjualan/i, /jualan/i, /sales/i], reply: "Fondasi workflow penjualan sudah disiapkan. Eksekusi nyata belum diverifikasi terhadap API TikTok Shop.", status: "MADE — NOT VERIFIED" },
  { id: "event_workflow", patterns: [/event.*tiktok/i, /acara.*jualan/i, /event.*jualan/i], reply: "Fondasi workflow event sudah disiapkan. Eksekusi nyata belum diverifikasi terhadap API TikTok Shop.", status: "MADE — NOT VERIFIED" },
  { id: "help", patterns: [/bantuan/i, /help/i, /bisa.*apa/i], reply: "Saya bisa menghubungkan TikTok, mengecek sesi, dan menyiapkan workflow konten, produk, upload, penjualan, serta event.", status: "PROVEN" }
];

export function planCommand(input = "") {
  const text = String(input).trim();
  if (!text) return { action: "empty", reply: "Sebutkan perintah yang ingin dijalankan.", status: "PROVEN" };

  for (const action of ACTIONS) {
    if (action.patterns.some((pattern) => pattern.test(text))) {
      return {
        action: action.id,
        reply: action.reply,
        path: action.path || null,
        status: action.status
      };
    }
  }

  return {
    action: "unknown",
    reply: `Saya menerima perintah: "${text}". Mesin AI provider belum terhubung; perintah ini belum dapat dieksekusi secara nyata.`,
    status: "MADE — NOT VERIFIED"
  };
}

export const supportedActions = ACTIONS.map(({ id, status }) => ({ id, status }));
