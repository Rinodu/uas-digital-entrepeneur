# Content Tracker (Web) — Kanban 3 Status + Calendar Deadline

Versi web yang meniru flow AppSheet kamu:
- Login email/password (Supabase Auth)
- Kanban drag & drop: **Not Started → In Progress → Complete**
- **Validasi:** tidak boleh **Complete** kalau `Final Drive Link` kosong / bukan link file Drive/Docs
- Calendar berdasarkan **Deadline** + dropdown filter status (1 filter saja)
- Riwayat perubahan (Audit) otomatis

## 1) Persiapan Supabase (gratis dulu)
1. Buat proyek di Supabase.
2. Buka **SQL Editor** → jalankan file: `supabase/schema.sql`.
3. Buka **Authentication → Providers → Email**: pastikan email auth aktif.
4. Buat akun untuk tim via halaman `/login` (sign up).
5. Set admin: di Supabase Table Editor, table `profiles`, ubah `role` menjadi `admin` untuk email yang kamu mau.
   ```sql
   update public.profiles set role='admin' where email='admin@email.com';
   ```

## 2) Jalankan di lokal
1. Install Node.js (18+).
2. Copy `.env.example` jadi `.env.local`, lalu isi:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Install dependency & run:
   ```bash
   npm install
   npm run dev
   ```
4. Buka: http://localhost:3000

## 3) Struktur data (tabel `contents`)
Field penting:
- `judul`, `platform`, `status`, `pic_email`, `deadline`, `brief_request`, `link_asset`, `link_draft`, `final_drive_link`

Catatan: `final_drive_link` hanya diterima kalau mengandung:
- `drive.google.com/file/d/` atau
- `docs.google.com/`

## 4) Akses & Role
RLS sudah aktif:
- **Staff**: hanya bisa melihat/mengubah row yang `pic_email` = email dia.
- **Admin**: bisa melihat semua, ubah PIC, delete, dsb.

## 5) Deploy termurah
- **Frontend:** Vercel (free)
- **Backend/DB/Auth:** Supabase (free)

Langkah singkat:
1. Push project ini ke GitHub.
2. Import repo ke Vercel.
3. Set env di Vercel (sama seperti `.env.local`).
4. Deploy.

---

Kalau kamu mau UI makin mirip AppSheet (panel kanan lebih “kaku”, warna/status badge, dll), tinggal bilang gaya yang kamu mau.
