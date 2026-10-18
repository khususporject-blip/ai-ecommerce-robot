# Model Operasi: Robot Penjualan Otonom dengan Persetujuan Risiko

Status: **spesifikasi target**. Dokumen ini tidak membuktikan bahwa eksekusi otonom sudah aktif di production.

## Keputusan produk

Robot AI menjadi operator penjualan untuk **satu TikTok Shop terlebih dahulu**. Robot dapat menganalisis, merencanakan, membuat draf, menjalankan tugas yang sudah diizinkan, mengukur hasil, dan memperbaiki eksperimen secara mandiri. Tindakan berisiko atau yang tidak memiliki izin eksplisit harus menunggu persetujuan pemilik.

Sasaran bisnis: omzet, laba kontribusi, konversi, dan efisiensi. Sistem tidak boleh mengklaim keberhasilan tanpa bukti platform atau data sumber yang dapat diaudit.

## Tingkat otonomi dan persetujuan

### Hijau — boleh berjalan otomatis setelah koneksi dan kebijakan tervalidasi
- Membaca data toko/produk yang secara resmi diberikan kepada aplikasi.
- Menganalisis produk, stok, margin, performa konten, dan peluang; menandai data yang tidak tersedia.
- Menghasilkan draf skrip, storyboard, caption, variasi hook, kalender konten, dan laporan.
- Menjalankan eksperimen analitik yang tidak mengubah toko atau menerbitkan konten.
- Menyusun rekomendasi serta menjadwalkan tugas internal yang dapat dibatalkan.

### Kuning — persetujuan pemilik atau izin eksplisit per tindakan
- Menerbitkan video publik, termasuk pilihan akun, produk tertaut, caption, waktu, dan materi final, sampai kebijakan/izin platform dan mode otonom benar-benar terbukti.
- Menggunakan materi promosi pihak ketiga, musik, wajah, testimonial, atau klaim yang memerlukan pemeriksaan hak/kepatuhan.
- Mengubah jadwal atau volume publikasi di luar batas yang sebelumnya disetujui.
- Mengubah harga, diskon, promosi, anggaran iklan, atau pengaturan toko jika kelak didukung API.
- Mengambil tindakan yang berpotensi memengaruhi pelanggan, reputasi, atau biaya.

Persetujuan harus mengikat ke objek dan versi spesifik (akun, produk, video, caption, jadwal, serta tindakan). Perubahan materi setelah persetujuan membatalkan persetujuan terkait. Persetujuan kedaluwarsa dan keputusan penolakan harus dicatat.

### Merah — selalu ditolak atau memerlukan proses resmi terpisah
- Membocorkan token, rahasia, data pelanggan, atau informasi privat.
- Mengakali persetujuan platform, batas API, verifikasi, atau kebijakan.
- Memalsukan metrik, pesanan, omzet, bukti publikasi, atau status keranjang kuning.
- Menggunakan aset tanpa hak, membuat klaim menyesatkan, spam, atau memanipulasi engagement.
- Menghapus data/audit, menonaktifkan kill switch, atau menaikkan batas risiko secara diam-diam.

## Alur kerja ujung ke ujung

1. **Observe** — sinkronkan data resmi toko, katalog, inventori, performa dan biaya; simpan sumber serta waktu sinkronisasi.
2. **Decide** — rangking produk memakai margin yang tersedia, stok, konversi, tren dan tingkat keyakinan. Jika data penting tidak ada, keluaran harus berupa rekomendasi bersyarat.
3. **Create** — hasilkan beberapa konsep/video, periksa hak aset, duplikasi, klaim, format, dan kebijakan.
4. **Bind product** — gunakan ID produk/varian dari katalog terotorisasi, bukan nama bebas; cek kelayakan tautan ulang sebelum publikasi.
5. **Authorize** — evaluasi policy engine. Minta persetujuan untuk tindakan kuning; tolak tindakan merah.
6. **Execute** — gunakan endpoint resmi yang tersedia, idempotency key, batas percobaan, dan batas volume harian.
7. **Verify** — cek status publikasi dari platform **dan** verifikasi tautan produk/keranjang kuning secara terpisah. Salah satu gagal berarti tugas penjualan belum selesai.
8. **Measure** — tarik metrik nyata; pisahkan metrik platform, hasil hitung, estimasi, dan data yang belum tersedia.
9. **Optimize** — eksperimen terkontrol untuk produk, hook, format, dan slot waktu. Catat hipotesis, kelompok pembanding, hasil, keterbatasan, dan alasan keputusan.
10. **Recover** — pada token kedaluwarsa, API error, data stale, hasil tidak pasti, atau pelanggaran kebijakan: hentikan tindakan eksternal, catat error, beri tahu pemilik, dan lanjutkan hanya setelah prasyarat pulih.

## Kontrak status tugas

Status yang disarankan:

`planned → draft_ready → rights_checked → product_verified → approval_pending/authorized → publishing → platform_published → product_attachment_verified → measurement_pending → measured`

Status terminal alternatif: `blocked`, `approval_rejected`, `failed_retryable`, `failed_terminal`, `cancelled`.

- `platform_published` bukan sama dengan `product_attachment_verified`.
- `publish_id`, HTTP 200, atau proses upload selesai bukan bukti video tayang dengan keranjang kuning.
- Jika API tidak memberi bukti otoritatif bahwa produk terpasang, status tetap belum terverifikasi dan operator tidak boleh mengarang konfirmasi.

## Batas kendali dan audit

- Kill switch global dan per jenis tindakan harus menghentikan pekerjaan eksternal baru.
- Batas awal publikasi harian dan biaya dibuat konservatif, dapat dikonfigurasi, serta tidak dapat dinaikkan otomatis tanpa izin.
- Setiap tindakan menyimpan actor (AI/pemilik), policy decision, approval ID jika ada, input/output yang aman, korelasi tugas, timestamp, response code, dan bukti verifikasi.
- Rahasia/token tidak masuk ke audit log. Data pribadi pelanggan diminimalkan.
- Retry hanya untuk error yang aman diulang; operasi publikasi memakai idempotensi dan rekonsiliasi status untuk mencegah unggahan ganda.
- Perubahan kebijakan, akses, anggaran, harga, promosi, dan publikasi di luar izin adalah tindakan berisiko.
- Model AI tidak dapat memberi persetujuan untuk tindakannya sendiri.

## Optimasi bisnis yang dapat dipertanggungjawabkan

Metrik inti:
- Omzet/GMV dan jumlah pesanan, dengan sumber serta periode.
- Laba kontribusi hanya jika harga pokok, komisi, diskon, biaya promosi, pengembalian, dan biaya relevan tersedia; selain itu tandai parsial/estimasi.
- Konversi dengan denominator yang terdefinisi.
- Efisiensi: waktu kerja per konten, biaya produksi/eksekusi, tingkat kegagalan, dan persentase tugas yang memerlukan intervensi.
- Kualitas sistem: publikasi duplikat, kegagalan tautan produk, tugas yang diblokir dengan benar, dan akurasi sinkronisasi.

Jadwal awal merupakan hipotesis, bukan fakta. AI hanya mengoptimalkan waktu berdasarkan data akun yang cukup, menjaga pembanding, serta menghindari kesimpulan kausal berlebihan.

## Status bukti implementasi

| Kemampuan | Status bukti saat ini |
|---|---|
| Repository dan backend Express yang sudah ada | Ditemukan di kode/README; tidak berarti setiap jalur bekerja di production |
| Modul dasar content factory, task engine, scheduler, policy, audit, product intelligence dan performance | Nama/modul ditemukan; operasi end-to-end belum terbukti |
| TikTok creator Login Kit / Direct Post | Jalur terdokumentasi; izin runtime, otorisasi pemilik, dan publikasi nyata harus diverifikasi |
| TikTok Shop seller authorization | **Belum terbukti aktif**; status readiness terakhir yang tersedia menyatakan kredensial app/service belum lengkap |
| AI provider | Runtime pernah melaporkan API key terkonfigurasi; panggilan AI berhasil di production saat ini belum terbukti |
| Penerbitan video dan verifikasi platform | Belum ada bukti end-to-end yang cukup |
| Pemasangan/validasi keranjang kuning via jalur API yang tersedia | **Belum terbukti**; jangan menyamakan creator Direct Post dengan product attachment |
| Data omzet, laba, konversi dan eksperimen nyata | Belum terbukti tersinkron lengkap dari toko |
| Autonomi dengan approval gates dan kill switch teruji | Target desain; belum dibuktikan lewat pengujian production |

## Gerbang sebelum mode otonom penuh

1. Konfirmasi izin resmi dan cakupan API untuk akun/aplikasi yang nyata.
2. Konfirmasi AI provider menghasilkan output sungguhan tanpa membocorkan rahasia.
3. Buktikan seller authorization dan pembacaan katalog toko.
4. Buktikan satu alur terkendali dari draf ke publikasi dan tautan produk yang diverifikasi secara independen.
5. Uji approval, penolakan, perubahan setelah approval, token kedaluwarsa, timeout, retry, duplikasi, dan kill switch.
6. Jalankan periode pilot dengan persetujuan manusia dan metrik yang bersumber jelas.
7. Naikkan otonomi per kategori tindakan hanya setelah bukti pilot dan batas risiko disetujui.

## Prinsip rilis

Pertahankan repository `khususporject-blip/ai-ecommerce-robot`, branch `main`, dan Railway project/service/environment yang ada. Perubahan dokumen pada branch fitur tidak mengubah production. Tidak ada kemampuan yang boleh disebut aktif hanya karena modul atau endpoint ditemukan di kode.
