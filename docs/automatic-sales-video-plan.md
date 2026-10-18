# Rencana Implementasi: Video Penjualan Otomatis + Keranjang Kuning

Status dokumen: rancangan implementasi, bukan bukti fitur production aktif.

## Keputusan produk
- Satu toko TikTok Shop lebih dahulu.
- Kombinasi video yang dibuat AI dan materi promosi yang memang berhak digunakan.
- Mulai dari beberapa slot harian; AI mengoptimalkan jadwal berdasarkan performa toko yang terukur.
- Setiap unggahan yang ditujukan untuk penjualan wajib mempunyai tautan produk/keranjang kuning yang benar dan terverifikasi.
- Ukuran keberhasilan: omzet, laba kontribusi, konversi, dan efisiensi.

## Keadaan kode yang telah ditemukan
- Backend: `server.mjs`, Node.js/Express.
- Ada `content-factory.mjs`, `content-executor.mjs`, `autonomy-scheduler.mjs`, `task-engine.mjs`, `tiktok-post-policy.mjs`, `tiktok-shop-client.mjs`, dan `experiment-registry.mjs`.
- Smoke test memeriksa keberadaan rute content preparation, upload TikTok, publish URL, status publikasi, data produk/pesanan, eksperimen, dan autonomy.
- README menjelaskan jalur TikTok creator Content Posting API Direct Post menggunakan `PULL_FROM_URL`. Jalur itu sendiri tidak membuktikan penautan produk TikTok Shop atau keranjang kuning.
- Kredensial/otorisasi TikTok Shop production dan end-to-end publish + product attachment belum boleh dianggap valid sebelum diuji nyata.

## Arsitektur yang dituju

1. **Content source registry**
   - Setiap materi punya `asset_id`, sumber, pemilik/hak penggunaan, produk target, format, durasi, status moderasi, checksum, dan status hak pakai.
   - AI-generated assets dan materi pihak ketiga dicatat terpisah.
   - Materi tanpa hak penggunaan yang jelas ditolak.

2. **Product binding**
   - Pilih produk dari katalog toko terotorisasi melalui API resmi.
   - Simpan ID produk/varian, toko pemilik, waktu verifikasi, dan status kelayakan penautan.
   - Jangan menerima nama produk sebagai pengganti ID produk yang tervalidasi.
   - Sebelum publish, verifikasi ulang bahwa produk tersedia dan bisa ditautkan melalui mekanisme resmi yang didukung akun/API.

3. **Schedule planner**
   - Awali dengan slot konfigurasi WIB: pagi 06.00–08.00, siang 11.30–13.00, sore 16.00–18.00, malam 19.00–22.00.
   - Ini hipotesis eksperimen, bukan klaim waktu terbaik universal.
   - Batasi jumlah unggahan, cegah duplikasi, hormati rate limits dan aturan platform.
   - Optimasi jadwal hanya setelah terkumpul data yang memadai; gunakan zona waktu eksplisit dan simpan alasan perubahan jadwal.

4. **Policy-gated publish pipeline**
   - `draft -> asset_validated -> product_link_verified -> awaiting_approval_or_authorized -> publishing -> platform_confirmed -> product_attachment_confirmed -> measured`.
   - Jika dukungan resmi untuk product attachment tidak tersedia atau verifikasi gagal, hentikan pipeline; jangan tandai sebagai video penjualan selesai.
   - Gunakan idempotency key, retry terbatas, status polling, audit log, emergency stop, dan penanganan token kedaluwarsa.
   - Persetujuan harus terkait ke video, produk, akun, jadwal, dan tindakan yang spesifik.

5. **Performance and profit loop**
   - Catat impressions/views, clicks, product detail visits, orders, GMV/omzet, refunds/returns, biaya yang tersedia, dan waktu kerja.
   - Setiap metrik menyimpan sumber, periode, waktu sinkronisasi, dan tingkat kelengkapan.
   - Hitung conversion rate hanya dengan numerator/denominator yang terdefinisi.
   - Hitung laba kontribusi hanya ketika biaya yang relevan tersedia; beri label estimasi/parsial jika belum lengkap.
   - Bandingkan hasil per produk, konten, slot waktu, dan eksperimen; jangan menyimpulkan kausalitas dari data yang belum memadai.

## Model data minimum (target)
- `content_assets`: id, source_type, rights_status, product_id, media_uri, content_hash, moderation_status.
- `publish_jobs`: id, asset_id, shop_id, product_id, scheduled_at, approval_id, idempotency_key, state, platform_publish_id, error_code.
- `product_link_checks`: publish_job_id, product_id, verified_at, verification_source, result.
- `performance_snapshots`: publish_job_id, metric_name, value, period_start, period_end, source, synced_at, completeness.
- `experiments`: hypothesis, variants, start/end, decision, confidence/limitations.
- `approvals` dan `audit_events`: aktor, tindakan, alasan, waktu, hasil, dan korelasi tugas.

Ini skema target, bukan klaim bahwa tabel tersebut sudah ada. Gunakan adapter penyimpanan yang sesuai dengan storage persisten proyek saat ini; jangan menambahkan database/service baru tanpa bukti kebutuhan dan rencana migrasi.

## Tahap implementasi dan gerbang kelulusan

### Tahap 0 — Audit tanpa efek samping
- Uji health check, versi deployment, konfigurasi readiness tanpa membocorkan nilai rahasia, dan hasil smoke test.
- Petakan API scopes dan fitur resmi yang disetujui untuk akun/aplikasi.
- Konfirmasi apakah jalur resmi yang tersedia benar-benar mendukung penautan produk/keranjang kuning untuk jenis akun dan publikasi yang ditargetkan.
- Jangan publish otomatis pada tahap ini.

**Lulus:** daftar kapabilitas API didukung bukti dokumentasi/akses, blocker kredensial dan izin dicatat, tes dasar lulus.

### Tahap 1 — Draf konten dan kalender
- Integrasikan content factory dengan produk toko yang sudah diverifikasi.
- Buat jadwal awal yang dapat diedit dan daftar antrean.
- Tambahkan validasi hak pakai materi, format media, duplikasi, dan kebijakan konten.

**Lulus:** dapat menghasilkan draf dan rencana jadwal; belum mengklaim unggahan atau keranjang kuning berhasil.

### Tahap 2 — Publish adapter dan verifikasi produk
- Implementasikan hanya endpoint resmi yang diizinkan.
- Pisahkan hasil upload/publish dari hasil product attachment.
- Poll status sampai platform memberi hasil final; simpan bukti respons dan ID yang aman.
- Jika tidak ada API resmi untuk memasang/memverifikasi keranjang kuning pada alur ini, blokir klaim otomatis penuh dan tentukan alur persetujuan/manual yang diizinkan.

**Lulus:** tes sandbox/terkontrol membuktikan video tayang dan produk benar tertaut pada akun target.

### Tahap 3 — Scheduler otonom dengan guardrail
- Aktifkan beberapa slot harian secara bertahap.
- Persetujuan eksplisit untuk publikasi sampai mode otonom diizinkan dan terbukti aman.
- Tambahkan kill switch, batas unggahan harian, retry terbatas, pemulihan dan idempotensi.

**Lulus:** tugas tidak terduplikasi, kesalahan berhenti dengan aman, dan audit log lengkap.

### Tahap 4 — Optimasi berdasarkan hasil
- Sinkronkan metrik platform dan data toko.
- Jalankan eksperimen slot waktu, hook, format, dan produk.
- Ubah jadwal hanya berdasarkan data memadai; pertahankan pembanding dan catat keterbatasan.

**Lulus:** laporan memisahkan data terukur dari estimasi dan menunjukkan omzet, laba, konversi, dan efisiensi.

## Definisi “berhasil”
Satu video penjualan hanya berstatus **SELESAI** jika:
1. Media lolos validasi dan hak penggunaannya jelas.
2. Publikasi dikonfirmasi oleh platform.
3. Tautan produk/keranjang kuning untuk produk yang tepat dikonfirmasi secara terpisah.
4. Semua tindakan sesuai izin dan kebijakan.
5. Hasil dan ID korelasi tercatat tanpa menyimpan rahasia di log.

`publish_id`, HTTP 200, atau video yang tayang tanpa product attachment bukan bukti keberhasilan penuh.

## Keamanan dan batasan
- Tidak ada kredensial atau token di Git, frontend, atau log.
- Tidak mengakali persetujuan platform, UI, atau pembatasan API.
- Tidak menggunakan materi promosi tanpa hak.
- Token dan otorisasi pemilik wajib melalui alur resmi.
- Perubahan ini tidak mengaktifkan publikasi production dengan sendirinya.

## Catatan deployment
Rencana ini harus ditinjau sebelum implementasi kode. Pertahankan repository `khususporject-blip/ai-ecommerce-robot`, branch `main` sebagai target, serta Railway project/service/environment yang ada. Perubahan dokumen pada branch terpisah tidak mengubah deployment production.
