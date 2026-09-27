const ACTIONS = [
  { id: "tiktok_login", patterns: [/login.*tiktok/i, /hubung.*tiktok/i, /sambung.*tiktok/i], reply: "Siap. Saya akan membuka koneksi TikTok.", path: "/auth/tiktok" },
  { id: "auth_status", patterns: [/status.*login/i, /sudah.*login/i, /cek.*login/i], reply: "Saya cek status koneksi TikTok dari sesi Robot AI." },
  { id: "help", patterns: [/bantuan/i, /help/i, /bisa.*apa/i], reply: "Saya bisa membantu koneksi TikTok, mengecek status sesi, dan menjadi fondasi perintah otomasi e-commerce." }
];

export function planCommand(input = "") {
  const text = String(input).trim();
  if (!text) return { action: "empty", reply: "Sebutkan perintah yang ingin dijalankan." };

  for (const action of ACTIONS) {
    if (action.patterns.some((pattern) => pattern.test(text))) {
      return { action: action.id, reply: action.reply, path: action.path || null };
    }
  }

  return {
    action: "unknown",
    reply: `Saya menerima perintah: "${text}". Mesin AI belum terhubung ke provider model; perintah ini disimpan sebagai fondasi intent router untuk tahap otomasi berikutnya.`
  };
}
