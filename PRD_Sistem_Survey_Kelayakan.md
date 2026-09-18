# Product Requirements Document (PRD)
## Sistem Survey Kelayakan (Kuesioner + Spin Undian)

**Versi:** 1.0
**Tanggal:** 17 Agustus 2026
**Status:** Draft untuk review

---

## 1. Latar Belakang & Tujuan

Dibutuhkan sistem internal untuk menggantikan proses survey manual berbasis Google Form + WhatsApp/link tracking manual. Sistem ini menggabungkan:
1. Pembuatan kuesioner dinamis (mirip Google Form)
2. Manajemen data responden & pengiriman undangan via email
3. Pemantauan hasil pengisian secara real-time
4. Mekanisme undian (spin) berhadiah bagi responden yang telah mengisi

**Tujuan utama:**
- Menggantikan proses distribusi & tracking survey yang saat ini manual
- Menjamin 1 responden hanya bisa submit 1 kali, tanpa mengekspos identitasnya di form (anonim dari sisi UX)
- Otomatisasi nomor urut peserta & proses undian pemenang

---

## 2. Definisi & Istilah

| Istilah | Penjelasan |
|---|---|
| Shadow Token | Kode unik acak (mis. `a1b2c3d4`) yang digenerate sistem saat admin input responden. Dipakai sebagai identifier di URL link kuesioner. Tidak pernah ditampilkan sebagai "nomor urut". |
| Nomor Urut Asli | Nomor (001, 002, dst) yang digenerate otomatis **hanya** saat responden submit kuesioner, berdasarkan urutan waktu submit. Inilah yang dipakai untuk proses spin. |
| Master Data Responden | Daftar seluruh peserta yang didaftarkan admin (belum tentu sudah isi). |
| Hasil Responden | Daftar peserta yang **sudah submit** kuesioner, lengkap dengan nomor urut asli. |

---

## 3. Role & Aktor

| Role | Deskripsi |
|---|---|
| Admin | Mengelola data responden, membuat kuesioner, memantau hasil, melakukan spin, mengirim email |
| User/Responden | Menerima email undangan, mengisi kuesioner via link unik, tidak perlu login |

---

## 4. Alur Sistem (High-Level Flow)

```
[ADMIN]
 1. Input data responden (manual / import Excel)
      -> sistem generate shadow token per responden
      -> status: "Belum Dikirim"
 2. Buat/edit kuesioner (builder dinamis)
 3. Kirim email undangan (broadcast semua / satu-satu)
      -> template email + link unik (domain.com/survey/{shadow_token})
      -> status responden -> "Terkirim"

[USER]
 4. Klik link unik dari email
 5. Isi kuesioner (form tidak menampilkan nama/email — dikenali dari token)
 6. Submit
      -> validasi: token ini sudah submit sebelumnya?
         - Belum -> submit diterima, generate Nomor Urut Asli (urutan submit global)
         - Sudah -> tampilkan pesan "Kamu sudah mengisi survey ini", submit ditolak
      -> status responden -> "Sudah Isi"
      -> muncul di menu "Hasil Responden" (admin)

[ADMIN]
 7. Pantau menu Hasil Responden (hanya menampilkan yang sudah submit)
 8. Jika jumlah responden submit >= batas minimum (default 5, bisa diatur)
      -> tombol Spin aktif
 9. Klik Spin -> sistem random pilih 1 nomor urut dari yang sudah submit
      -> hasil tersimpan otomatis ke menu Reward
      -> pop-up muncul: "Kirim email selamat ke pemenang sekarang?" [Ya/Nanti]
10. Jika pilih "Nanti", admin bisa kirim email pemenang kapan saja dari menu Reward
```

---

## 5. Modul & Fitur Detail

### 5.1 Menu: Master Data Responden

**Fungsi:** Kelola data mentah peserta sebelum mengisi kuesioner.

Fitur:
- Input manual: Nama, Email, No. Telp, Divisi (dropdown: Business Analyst, IT Infra, IT Dev, Data Visualization, Data Engineering, Human Resource, Finance)
- Import via Excel/CSV dengan template kolom standar
- **Validasi duplikat:** jika nama/email sudah terdaftar, sistem menolak input (baik manual maupun saat import) — baris duplikat di file excel akan di-skip dan dilaporkan ke admin
- Setiap responden baru otomatis mendapat **shadow token** unik (tidak ditampilkan sebagai nomor, hanya dipakai internal untuk generate link)
- Kolom status per responden: `Belum Dikirim` / `Terkirim` / `Sudah Isi`
- Aksi kirim email:
  - Kirim massal (ke semua yang belum isi / semua yang belum dikirim)
  - Kirim satu-satu (per baris data)
- Template email dapat diedit admin, dengan placeholder otomatis untuk link (`{{link_survey}}`) dan nama (opsional, jika ingin personalisasi subjek/isi)

### 5.2 Menu: Kuesioner (Builder Dinamis)

**Fungsi:** Membuat & mengatur pertanyaan survey.

Fitur:
- Tambah/edit/hapus pertanyaan
- Tipe pertanyaan yang didukung:
  - Skala/Linear scale (mis. 1–4, dengan label kiri "Sangat Tidak Puas" / kanan "Sangat Puas")
  - Pilihan ganda (single choice)
  - Checkbox (multiple choice)
  - Long text/essay
  - Short text
- Tandai pertanyaan wajib diisi (*)
- Preview kuesioner sebelum publish
- Kuesioner yang sudah publish & sudah ada yang submit sebaiknya di-lock dari perubahan struktural (untuk jaga integritas data) — *perlu dikonfirmasi ke stakeholder*

### 5.3 Menu: Hasil Responden

**Fungsi:** Memantau siapa saja yang sudah submit, dan menjadi tempat eksekusi spin.

Fitur:
- Hanya menampilkan responden dengan status "Sudah Isi"
- Kolom: Nomor Urut Asli, Nama, Email, Divisi, Waktu Submit
- Counter jumlah total responden yang sudah submit
- Setting: batas minimum responden untuk bisa spin (default 5, admin bisa ubah)
- Tombol **Spin**:
  - Disabled jika jumlah submit < batas minimum
  - Jika diklik: sistem pilih random 1 nomor urut dari daftar yang sudah submit
  - Hasil otomatis tersimpan ke menu Reward
  - Pop-up konfirmasi kirim email ke pemenang (Ya/Nanti)
- Opsi lihat detail jawaban per responden (klik nomor urut -> lihat jawaban lengkap)

### 5.4 Menu: Reward

**Fungsi:** Histori pemenang & pengiriman notifikasi.

Fitur:
- List seluruh histori spin yang pernah dilakukan (jika spin dilakukan berkali-kali)
- Kolom: Nomor Urut, Nama, Email, Divisi, Tanggal Spin, Status Email (Terkirim/Belum)
- Tombol "Kirim Email" per baris pemenang (untuk kasus admin belum sempat konfirmasi kirim di pop-up sebelumnya)
- Template email ucapan selamat (terpisah dari template undangan, bisa diedit admin)

---

## 6. Alur Data: Shadow Token vs Nomor Urut Asli

Ini bagian kritikal, dijelaskan terpisah agar tidak ambigu saat development:

1. Admin input responden -> sistem generate `shadow_token` (contoh: `a1b2c3d4e5`) -> disimpan di database, di-mapping ke `responden_id`
2. Link yang dikirim ke email: `https://domain.com/survey/a1b2c3d4e5`
3. User buka link -> sistem lookup `responden_id` dari `shadow_token` -> tampilkan form kuesioner tanpa field nama/email
4. User submit -> sistem cek kolom `submitted_at` pada `responden_id` tsb:
   - Jika `NULL` -> izinkan submit, isi `submitted_at` = timestamp sekarang, generate `nomor_urut` = COUNT(semua yang sudah submit) + 1
   - Jika sudah ada nilai -> tolak submit, tampilkan pesan sudah pernah mengisi
5. `nomor_urut` inilah yang tampil di menu Hasil Responden dan dipakai sebagai basis random spin

**Catatan keamanan:** shadow token harus cukup panjang/acak (bukan angka urut 1,2,3) agar tidak bisa ditebak/di-enumerasi oleh user lain.

---

## 7. Kebutuhan Non-Fungsional

| Aspek | Kebutuhan |
|---|---|
| Autentikasi Admin | Login username/password (minimal). Multi-admin dengan role berbeda — *perlu dikonfirmasi, di luar scope MVP jika tidak diperlukan* |
| Pengiriman Email | Perlu integrasi SMTP/email service (Gmail SMTP, SendGrid, atau lainnya) — *perlu dikonfirmasi provider* |
| Data Persisten | Database (bukan penyimpanan sementara) agar data responden & hasil survey tidak hilang |
| Hosting | Aplikasi web yang bisa diakses publik (untuk link kuesioner) dan diamankan untuk sisi admin |
| Concurrency | Sistem harus tahan jika banyak user submit bersamaan tanpa duplikasi nomor urut (race condition pada saat generate nomor urut harus ditangani) |

---

## 8. Hal yang Masih Perlu Dikonfirmasi

1. Provider email yang dipakai untuk pengiriman (Gmail SMTP / SendGrid / lainnya) beserta kredensialnya
2. Apakah kuesioner yang sudah ada respondennya boleh diedit strukturnya atau di-lock
3. Apakah spin bisa dilakukan berkali-kali dalam 1 survey, dan apakah nomor yang sudah pernah menang di-exclude dari spin berikutnya
4. Apakah dibutuhkan multi-admin dengan hak akses berbeda, atau 1 akun admin cukup
5. Divisi yang tersedia apakah fixed 7 pilihan di atas atau perlu bisa ditambah admin

---

## 9. Scope MVP vs Pengembangan Lanjutan

**MVP (prioritas dibangun dulu):**
- Master Data Responden (input manual + import Excel + validasi duplikat)
- Kuesioner builder (tipe: skala, pilihan ganda, essay)
- Generate shadow token + link unik per responden
- Kirim email (template + broadcast/satuan)
- Form pengisian publik via link
- Hasil Responden + nomor urut otomatis
- Spin + simpan ke Reward + kirim email pemenang

**Pengembangan Lanjutan (nice to have, di luar MVP):**
- Multi-admin & role permission
- Export hasil ke Excel/PDF
- Dashboard analitik/statistik jawaban
- Reminder otomatis terjadwal ke responden yang belum isi
- Histori multiple spin dengan exclude pemenang sebelumnya

---

## 10. Kriteria Sukses (Acceptance Criteria)

- [ ] Admin bisa input responden manual & import Excel, duplikat tertolak otomatis
- [ ] Admin bisa membuat kuesioner dengan minimal 3 tipe pertanyaan
- [ ] Email terkirim dengan link unik yang valid per responden
- [ ] 1 shadow token hanya bisa submit 1x, percobaan submit kedua ditolak
- [ ] Nomor urut asli hanya muncul setelah submit, sesuai urutan submit
- [ ] Tombol spin disabled jika jumlah submit di bawah batas minimum yang diatur
- [ ] Hasil spin tersimpan otomatis di menu Reward
- [ ] Email pemenang bisa dikirim langsung dari pop-up atau menyusul dari menu Reward
