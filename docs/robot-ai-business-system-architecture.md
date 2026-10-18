# Robot AI — Arsitektur Sistem Bisnis AI Lengkap

Status: **blueprint target**. Dokumen ini bukan klaim bahwa seluruh kemampuan telah diimplementasikan atau diverifikasi di production.

## Keputusan produk
- Sasaran akhir: sistem bisnis AI lengkap dengan otomasi dan optimasi terintegrasi.
- Ruang lingkup awal: satu toko TikTok Shop; desain modular agar bisa diperluas kelak.
- Dua mesin inti dikembangkan bersama: profit/sales intelligence dan content/growth engine.
- Otonomi dalam guardrail; persetujuan pemilik diperlukan untuk tindakan berisiko.
- KPI: omzet, laba kontribusi, konversi, dan efisiensi.
- Video penjualan menggabungkan konten yang dibuat AI dan materi promosi yang sah digunakan.
- Jadwal dimulai dari beberapa slot harian, lalu dioptimalkan dari data nyata.
- Video penjualan tidak dianggap selesai kecuali publikasi dikonfirmasi dan produk/keranjang kuning yang benar terverifikasi melalui mekanisme resmi.

## Prinsip implementasi
1. Pertahankan repository `khususporject-blip/ai-ecommerce-robot`, branch `main`, Railway project/service/environment yang sudah ada.
2. Jangan membuat repository/service baru atau mengganti domain/secret tanpa kebutuhan teknis terbukti.
3. Reuse modul yang sudah ada; jangan menganggap nama modul atau keberadaan endpoint sebagai bukti fungsi end-to-end.
4. Semua fakta bisnis harus punya sumber dan timestamp; jangan mengarang data atau metrik.
5. Jangan bypass kebijakan, persetujuan, API scopes, atau keterbatasan TikTok.
6. Setiap perubahan kode harus disertai tes, bukti deployment, dan validasi runtime sebelum dinyatakan selesai.

## Arsitektur target (modular monolith)
### A. Control plane
- Dashboard: readiness, status seller/AI, antrean konten, jadwal, approval, hasil dan error.
- API/auth: sesi pemilik, OAuth, validasi, rate limits dan izin.
- Policy engine: memeriksa izin, risiko, anggaran, margin floor, batas publikasi, hak media dan emergency stop.

### B. Intelligence plane
- Business memory: tujuan toko, batas margin, preferensi merek, keputusan sebelumnya dan eksperimen.
- Product intelligence: potensi permintaan, margin, stok, kualitas data dan kesiapan konten.
- Sales/profit brain: prioritas produk dan tindakan berdasarkan laba yang terukur.
- Content/growth brain: hook, skrip, format, CTA, caption, variasi kreatif dan kalender.
- Experiment engine: hipotesis, varian, periode, pembanding, batas sampel dan hasil.

### C. Execution plane
- TikTok Shop adapter: autentikasi seller, katalog, pesanan, metrik dan operasi yang memang diizinkan.
- Content source registry: materi AI vs materi pihak ketiga, hak penggunaan, sumber, checksum, status moderasi.
- Product binding: ID produk/varian dari toko terotorisasi dan pemeriksaan kelayakan tautan.
- Publish pipeline: validasi aset -> validasi produk -> policy/approval -> publikasi resmi -> status final -> verifikasi product attachment -> measurement.
- Task engine/scheduler: idempotensi, retry terbatas, timeouts, token expiry, recovery, kill switch dan audit log.
- AI provider adapter: provider terkonfigurasi eksplisit, penanganan error/timeout, kontrol biaya dan tidak ada output palsu saat provider gagal.

### D. Data and learning plane
Gunakan adapter penyimpanan yang kompatibel dengan fondasi persisten yang ada; jangan menambah database baru tanpa audit kebutuhan.
Entitas target:
- products, product_costs, inventory_snapshots
- orders, order_line_items, refunds/returns jika tersedia
- content_assets, product_bindings, publish_jobs
- product_link_checks, approvals, audit_events
- performance_snapshots, experiments, experiment_results
- tasks, business_memory, provider_usage

Setiap record bisnis menyimpan sumber, waktu sinkronisasi, periode, dan status kelengkapan. Pisahkan data terukur, estimasi, dan data yang belum tersedia.

## Siklus operasi bisnis
1. Ambil data toko yang diizinkan dan periksa kesegarannya.
2. Hitung KPI dan tentukan produk/peluang yang diprioritaskan.
3. Pilih hipotesis konten yang dapat diuji dan target metrik.
4. Buat video/draf dari aset AI atau aset dengan hak pakai yang jelas.
5. Verifikasi produk target, kesiapan media, kebijakan, kuota dan izin.
6. Minta persetujuan jika diwajibkan oleh policy.
7. Publikasikan hanya melalui API/flow resmi yang didukung dan diizinkan.
8. Verifikasi status tayang dan product attachment secara terpisah.
9. Ambil hasil performa, hitung KPI, tandai keterbatasan data.
10. Perbarui prioritas/jadwal hanya saat data cukup dan simpan alasan keputusan.

## Definisi KPI
- Omzet/GMV: gunakan definisi sumber platform dan periode yang konsisten; bedakan GMV bruto dari omzet setelah penyesuaian.
- Laba kontribusi: pendapatan relevan dikurangi biaya produk, diskon, komisi, biaya promosi, retur/refund dan biaya relevan lain yang tersedia. Tandai sebagai parsial bila ada komponen biaya yang hilang.
- Konversi: definisikan pembilang dan penyebut secara eksplisit, misalnya pesanan/klik produk, hanya jika kedua metrik tersedia dan sebanding.
- Efisiensi: waktu kerja yang dihemat, biaya per pesanan, keberhasilan tugas, retry/failure rate, dan biaya AI/API.
- Jangan menyatakan kenaikan disebabkan oleh AI tanpa pembanding yang memadai.

## Guardrail otonomi
- Otomatis: analisis, laporan, draf, validasi internal, pengambilan data yang diizinkan.
- Dengan batas eksplisit: eksperimen berisiko rendah, kuota posting, biaya provider dan perubahan jadwal.
- Approval wajib sesuai policy: publikasi eksternal sampai terotorisasi, harga/diskon, anggaran, dan tindakan berdampak pada transaksi/pelanggan.
- Block: tidak ada izin, produk tidak valid, aset tidak berhak digunakan, keranjang kuning gagal diverifikasi, data basi/kritis hilang, biaya melampaui batas, atau kebijakan platform dilanggar.
- Approval terikat pada tindakan spesifik (akun, video, produk, jadwal, parameter); tidak menjadi izin universal.
- Emergency stop harus menghentikan pekerjaan baru dan penjadwalan publikasi.

## Roadmap dan gerbang kelulusan

### Phase 0 — Audit production dan izin
Verifikasi commit aktif, health, smoke tests, AI provider real-call, seller readiness, token persistence, log, storage, scopes, API review dan dukungan product attachment.
**Gate:** bukti terukur untuk setiap status; blocker dan pemilik tindakan jelas; tidak ada publikasi otomatis.

### Phase 1 — Data trust + KPI
Validasi produk/pesanan/margin/stok dari sumber resmi; definisi KPI; freshness checks; dashboard yang membedakan data aktual dari data parsial.
**Gate:** hasil rekonsiliasi terhadap sumber, perhitungan unit-tested dan penanda data hilang.

### Phase 2 — Business Brain + Content Factory
Prioritasi produk, rencana penjualan, draf video, content registry, hak penggunaan dan kalender slot awal.
**Gate:** AI benar-benar merespons; draf terhubung dengan produk terverifikasi; tidak ada konten yang mengklaim hal tanpa dasar.

### Phase 3 — Publish + product attachment proof
Konfirmasi secara dokumenter dan lewat akses resmi jalur publikasi serta penautan produk untuk tipe aplikasi/akun ini. Implementasikan adapter dan status terpisah. Jika product attachment tidak didukung API yang tersedia, jangan mengklaim otomatis penuh; gunakan proses manual/approval yang sesuai aturan.
**Gate:** uji nyata pada akun target membuktikan video tayang dan produk yang benar tertaut; bukti tersimpan aman.

### Phase 4 — Guarded scheduler
Mulai dengan sejumlah slot WIB yang bisa diedit; batas unggahan, idempotency, status polling, retry terbatas, approval dan emergency stop.
**Gate:** tidak ada posting ganda pada uji kegagalan, error berhenti aman, persetujuan ditegakkan di backend.

### Phase 5 — Closed-loop optimization
Uji waktu, hook, format dan produk dengan pembanding; sinkronkan performa; optimalkan hanya dengan data yang cukup.
**Gate:** laporan mencakup omzet, laba, konversi, efisiensi, ukuran sampel, keterbatasan, dan alasan perubahan jadwal.

## Status verifikasi saat blueprint dibuat
### Terverifikasi pada tingkat repository/dokumentasi
- Repository `khususporject-blip/ai-ecommerce-robot`, default branch `main`.
- Backend Node/Express dan modul fondasi bisnis/konten/scheduler/task/policy ada dalam repository.
- README mendokumentasikan TikTok creator Direct Post melalui `PULL_FROM_URL`.
- Smoke test memeriksa keberadaan sejumlah route/modul dan aturan kode.

### Belum terverifikasi end-to-end
- Panggilan AI provider sukses pada runtime saat ini.
- Seller TikTok Shop production telah terotorisasi dan token aktif.
- Data katalog, pesanan, stok, biaya, dan performa benar-benar tersedia dan direkonsiliasi.
- API/izin yang tersedia untuk aplikasi dan akun ini mendukung publikasi video serta pemasangan/konfirmasi keranjang kuning.
- Video nyata terpublikasi otomatis dan produk yang benar tertaut.
- Jadwal otomatis tahan restart/failure dan tidak menggandakan posting.
- Eksperimen terbukti meningkatkan omzet/laba/konversi/efisiensi.

## Definisi production success
Jangan memberi label "FINAL VERIFIED PRODUCTION" sampai seluruh gerbang relevan lulus dengan bukti: tes kode, konfigurasi/readiness tanpa membocorkan secret, log runtime, verifikasi akun/API resmi, dan uji publikasi nyata + product attachment. Keberadaan endpoint, HTTP 200, atau `publish_id` saja tidak cukup.

## Deployment
Blueprint ini tidak mengubah deployment production. Implementasi kode harus dilakukan bertahap pada branch perubahan, diuji, ditinjau, dan baru dipromosikan ke `main` serta Railway yang ada setelah gerbang yang relevan lulus.
