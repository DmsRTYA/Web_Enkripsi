# Product: Portal Kriptografi Agen Rahasia

- Target: Portal kriptografi aman untuk enkripsi/dekripsi teks dan file (AES-GCM dan ChaCha20-Poly1305)
- Core features: 
  - Enkripsi teks
  - Dekripsi teks
  - Enkripsi file
  - Dekripsi file
- Audience: Pengguna yang membutuhkan alat kriptografi sederhana dan aman
- Design: Minimalis, fungsional, tema profesional "Agen Rahasia", fokus pada dark-mode
- Platform: Web (Next.js, Tailwind)
- Mode: Operate (fokus pada utilitas)

## Requirements from the prompt:
1. Audit landing page dan perbaiki hierarki visual, kontras warna, responsivitas mobile
2. Redesign agar lebih minimalis dan fokus pada fitur utama
3. Test sebelum memberikan ke pengguna (perlu izin menjalankan terminal/browser)
4. Fix bug/error jika ada
5. Update progres.md setelah selesai

## Current State:
- Frontend di frontend/app/page.tsx dengan 4 fitur utama dalam grid
- Warna: Biru (enkripsi teks), Emerald (dekripsi teks), Amber (enkripsi file), Purple (dekripsi file)
- Dark mode dengan background gradient
- Responsif (md:grid-cols-2)
