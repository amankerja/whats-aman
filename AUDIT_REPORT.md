# Laporan Audit Komprehensif: WhatsApp Local Hub (WhatsAman)

**Tanggal:** 27 September 2026 (Ref. PRD)
**Target:** Repositori WhatsAman (Backend Node.js/TypeScript & Arsitektur)
**Auditor:** Jules (AI Software Engineer)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Aplikasi WhatsAman telah berhasil meletakkan dasar yang sangat solid, mengimplementasikan konsep "Single Engine" (Aman Gateway) dengan antarmuka yang didekoneksi (Decoupled Engine via `IWhatsAppEngine`). Penggunaan `better-sqlite3` dengan mode WAL (Write-Ahead Logging) adalah pilihan tepat untuk konkurensi pada lingkungan lokal/portabel. Struktur modul (Services, Routes, Repositories) sudah tersusun rapi layaknya standar arsitektur monolitik modern.

Meskipun demikian, ada beberapa celah kritis pada manajemen memori (Memory Leak), validasi masukan (Input Validation), dan potensi _race conditions_ pada sistem _event listener_ yang perlu diperbaiki sebelum rilis produksi (M10).

---

## 2. Temuan Kritis (Critical)

### 2.1 Potensi Kebocoran Memori (Memory Leak) pada EventBus Listener
**Masalah:**
Di dalam `src/core/engine/baileys.adapter.ts`, setiap kali adapter membuat koneksi (`connect()`), adapter mendaftarkan listener baru ke `socket.ev.on()`, dan mengirimkan event melalui global `eventBus`. Namun, pada fungsi `disconnect()` maupun `logout()`, `eventBus` belum sepenuhnya melepaskan (remove) listener, terutama jika ada module lain (seperti Campaign) yang melanggan session spesifik tanpa diputus.
**Rekomendasi:**
Pastikan memanggil `eventBus.removeAllListeners(sessionEvent)` atau memastikan implementasi penghapusan koneksi membersihkan memori (garbage collected). Untuk adapter Baileys, pastikan untuk menghancurkan instans `WASocket` secara total.

### 2.2 Validasi Input API Belum Menggunakan Zod (Security/Stability)
**Masalah:**
Meskipun library `zod` telah disertakan di `package.json`, pada rute Express (`src/api/routes/*.routes.ts`), payload dan query dari pengguna hanya divalidasi menggunakan validasi manual sederhana (contoh: `if (!id) res.status(400)`). Hal ini berisiko menimbulkan _Payload Injection_ atau _TypeError_ (Uncaught Exception) yang berakibat pada Server Crash.
**Rekomendasi:**
Implementasikan skema Zod untuk setiap DTO (Data Transfer Object) dan buat Express Middleware untuk memvalidasi setiap masukan Request (Body, Params, Query) sebelum masuk ke Controller/Service.

---

## 3. Temuan Menengah (Medium)

### 3.1 Penanganan File Media dalam Memori (Performance)
**Masalah:**
Pada fungsi `sendMedia` di `baileys.adapter.ts`, file media (baik dari URL maupun direktori lokal) dibaca ke dalam RAM menggunakan `fs.readFileSync(mediaPathOrBuffer)` (Baris 463) atau di-buffer langsung dari URL (Baris 458). Untuk pengiriman massal (Campaign) yang menyertakan video 20MB+, hal ini akan sangat membebani RAM (V8 Heap) dan dapat menyebabkan `OutOfMemory` (OOM).
**Rekomendasi:**
Gunakan `fs.createReadStream()` bila memungkinkan, atau setidaknya buat mekanisme batasan ukuran (size limit) saat membaca buffer ke memori. (Baileys mendukung stream objek pada parameter `stream`).

### 3.2 Thread-Blocking pada Async Delay (Performance)
**Masalah:**
Pada `campaign.service.ts` baris 378, utilitas `delay` menggunakan `new Promise(resolve => setTimeout(resolve, ms))`. Hal ini aman. Namun, proses _Campaign Runner_ dijalankan sebagai "Fire and Forget" dengan `while` loop yang cukup panjang. Jika antrean besar, `event loop` node.js dapat mengalami _starvation_.
**Rekomendasi:**
Gunakan `setImmediate()` di antara setiap iterasi batch/queue dalam `runCampaignLoop()` agar Event Loop tetap bisa melayani request HTTP.

### 3.3 Penanganan API Key di Express Server
**Masalah:**
Di `src/api/server.ts`, otentikasi API-Key (`x-api-key`) bersifat global, kecuali `/health`. Jika aplikasi dikembangkan dengan UI statis yang memerlukan akses API, _Cross-Site_ exposure (CORS) dikonfigurasi ke `*`.
**Rekomendasi:**
Ubah `CORS origin` ke spesifik URL localhost (misalnya port 3000 dan 5173). Selama mode UI terpasang (Portable Mode), terapkan otentikasi kunci secara internal, atau biarkan UI melewatkan otorisasi menggunakan sesi statis (Session cookie) alih-alih mengekspos API Key.

---

## 4. Temuan Rendah & Peningkatan (Low / Improvements)

### 4.1 Pembersihan File Session (File System Cleanup)
**Masalah:**
Pada fungsi `deleteSession` (`session.manager.ts`), ketika session dihapus, folder `sessionDir` dipaksa hapus `fs.rmSync(..., { force: true })`. Jika proses database Baileys di level C/OS sedang memegang *file-lock*, ini bisa gagal di OS Windows.
**Rekomendasi:**
Tambahkan jeda sedikit (delay 500ms) setelah pemanggilan `session.logout()` dan penghancuran instans Socket sebelum menghapus folder secara sinkron.

### 4.2 SQLite Pragmas Optimasi
**Masalah:**
Konfigurasi `better-sqlite3` sudah menggunakan WAL mode (`journal_mode = WAL`), yang sangat baik. Namun, penggunaan `synchronous = NORMAL` kadang masih memiliki risiko korupsi yang kecil pada *abrupt power loss* di Windows.
**Rekomendasi:**
Tetap pertahankan untuk kecepatan, tetapi pastikan backup sistem (sebagaimana dijabarkan pada `ARCHITECTURE.md`) dilakukan secara rutin.

### 4.3 Struktur Eksepsi (Exception / Error Handling)
**Masalah:**
Global Error handler di `server.ts` mengembalikan stack trace ke frontend/UI pada saat unhandled error jika tidak dikondisikan ke production.
**Rekomendasi:**
Hapus *stack trace* di respon HTTP jika `NODE_ENV === 'production'` untuk mencegah kebocoran informasi file sistem lokal pengguna.

---

## 5. Kesimpulan & Penilaian Kepatuhan PRD

Aplikasi ini sudah memenuhi sekitar **85% dari arsitektur MVP** yang direncanakan pada PRD (`whatsapp-local-hub-prd.txt`). Penggunaan "Single Engine" telah memisahkan kekhawatiran (*Separation of Concerns*) dengan sangat baik.

**Tindak Lanjut Utama:**
Prioritaskan perbaikan **Memori Leak & Manajemen Buffer Media (3.1)** untuk memastikan stabilitas server dalam mode portabel pada Windows yang biasanya sensitif terhadap lonjakan RAM. Kemudian, tambahkan **Zod Validation (2.2)** sebelum aplikasi dirilis ke publik.
