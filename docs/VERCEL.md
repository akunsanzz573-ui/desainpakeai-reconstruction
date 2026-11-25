# Deployment notes

## Status jujur

Aplikasi **lokal** (`npm start`) berfungsi penuh dengan SQLite + filesystem: user, project, chat, version, publish, dan export benar-benar tersimpan.

**Vercel serverless tidak bisa langsung memakai penyimpanan itu.** Function container bersifat ephemeral dan filesystem read-only. Jika `vercel.json` dipakai apa adanya tanpa perubahan, UI akan tampil, tetapi:

- database SQLite tidak persisten (data bisa hilang antar-request/instance),
- file publikasi di `public/sites/` tidak bisa ditulis,
- więc publish/download tidak benar-benar bekerja.

Itu **bukan** deploy yang bisa disebut “semua fitur bekerja”. Jangan menganggap deploy langsung sebagai produksi.

## Opsi 1 — Vercel dengan penyimpanan eksternal (disarankan jika harus Vercel)

Yang perlu ditambahkan sebelum deploy:

1. **Database persistent**
   - Ganti `node:sqlite` di `server/db.js` dengan klien seperti `@libsql/client` (Turso) atau `@neondatabase/serverless` (Postgres).
   - Skema ada di `server/db.js` (`users`, `sessions`, `projects`, `messages`, `versions`, `published_sites`, `catalog`, `updates`, `reports`, `checkout_intents`, `user_ai_settings`).
   - Env: `DATABASE_URL` (dan token bila penyedia memerlukan).

2. **Object storage untuk situs publikasi**
   - Ganti tulis/baca `public/sites/<slug>/...` di `server/index.js` (endpoint publish, unpublish, `sendPublishedFile`, export) dengan Vercel Blob (`@vercel/blob`) atau S3-compatible.
   - Env: `BLOB_READ_WRITE_TOKEN` atau kredensial S3.

3. **AI**
   - Env `GEMINI_API_KEY` / `OPENAI_API_KEY`, atau pakai menu “AI Gemini” di workspace single-user. Tanpa kunci, engine lokal yang dipakai.

4. **Environment variables di Vercel**
   ```bash
   DATABASE_URL=...
   BLOB_READ_WRITE_TOKEN=...
   GEMINI_API_KEY=...
   GEMINI_MODEL=gemini-3.6-flash
   ```

Setelah adapter DB + storage dibuat dan diuji, `vercel.json` + `api/index.js` siap dipakai.

## Opsi 2 — Host dengan disk persisten (tanpa ubah kode)

Untuk menjaga perilaku yang sudah teruji persis seperti lokal, deploy ke platform yang menyediakan filesystem/disk persisten, misalnya Railway, Render, Fly.io, atau VPS. Jalankan:

```bash
npm install
npm run build
PORT=3000 npm start
```

Simpan volume persisten untuk `data/` dan `public/sites/`.

## GitHub

Repo sudah tersedia di `https://github.com/akunsanzz573-ui/desainpakeai-reconstruction` beserta `.gitignore`, `vercel.json`, dan `api/index.js`. Perubahan setelah push perlu di-commit dan di-push ulang dengan token GitHub baru.
