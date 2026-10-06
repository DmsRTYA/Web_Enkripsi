# Portal Kriptografi - Project Overview

## Anggota Kelompok

| Nama | NPM | Kontribusi Utama |
|------|-----|------------------|
| Rendi Yogi Ramdani | 247006111084 | Backend API (FastAPI), System Testing, Deployment (Render), Supabase Integration |
| Rafi Ahnaf Hanafi | 247006111089 | Frontend UI/UX (Glassmorphism), Debugging, UI Polish, History System |
| Dhimas Raditya | 247006111119 | Backend Logic, Crypto Metrics Analysis, Visualizer Feature, Git Repository |

## Konsep Projek

Ini adalah **Portal Kriptografi** - aplikasi web untuk **enkripsi dan dekripsi teks & file** menggunakan algoritma modern dan aman.

### Fitur Utama (4 Operasi)
| Fitur | Input | Output |
|-------|-------|--------|
| **Enkripsi Teks** | Teks biasa + Password | Ciphertext (Base64) |
| **Dekripsi Teks** | Ciphertext + Password | Teks asli |
| **Enkripsi File** | File apa saja + Password | File `.enc` (Base64) |
| **Dekripsi File** | File `.enc` + Password | File asli (binary) |

---

## Teknologi yang Digunakan

| Layer | Teknologi | Versi | Kenapa? |
|-------|-----------|-------|---------|
| **Backend** | FastAPI (Python) | 0.115+ | Cepat, auto-docs, type-safe |
| **Frontend** | Next.js + React | 16 / 19 | Modern, SSR, Tailwind native |
| **Styling** | Tailwind CSS | v4 | Utility-first, responsive, dark mode |
| **Crypto** | `cryptography` library | 42+ | Standard industri, audited |
| **Algoritma** | AES-GCM, ChaCha20-Poly1305 | - | AEAD (Authenticated Encryption) |

---

## Cara Menjalankan (Step-by-Step)

### 1. Backend (Terminal 1)
```bash
cd backend
# Install dependencies (sekali saja)
pip install -r requirements.txt

# Jalankan server
uvicorn main:app --reload --port 8000
```
Server running di: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 2. Frontend (Terminal 2)
```bash
cd frontend
# Install dependencies (sekali saja)
npm install

# Jalankan dev server
npm run dev
```
Server running di: **http://localhost:3000** (atau 3001 kalau 3000 dipakai)

---

## Struktur Project

```
versi dimas/
├── backend/
│   ├── main.py          # FastAPI app + endpoints + CORS
│   ├── logika.py        # Core crypto logic (AES-GCM, ChaCha20)
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx     # Main UI (single-page app)
│   │   ├── layout.tsx   # Root layout + fonts
│   │   └── globals.css  # Tailwind + theme
│   ├── components/ui/   # UI components (BackgroundGlobal, SkewCard, etc.)
│   ├── hooks/           # Custom hooks (history)
│   ├── lib/             # Supabase client, password encryption
│   ├── package.json
│   └── next.config.ts
├── PRODUCT.md           # Design authority (Impeccable skill)
├── progres.md           # Development log
├── DESIGN.md            # Design specifications
└── README.md            # This file
```

---

## Deployment
- **Frontend**: Vercel (URL: [https://aplikasi-kripto.vercel.app](https://aplikasi-kripto.vercel.app))
- **Backend**: Render (URL: [https://aplikasikripto.onrender.com](https://aplikasikripto.onrender.com))
- **CORS Configuration**: Restrict to Vercel production domain and localhost:3000

---

## API Endpoints (Backend)

Semua endpoint: `POST` | Base URL: `http://localhost:8000`

| Endpoint | Deskripsi | Request Body |
|----------|-----------|--------------|
| `/api/enkripsi/teks` | Enkripsi teks | `{ teks, password_kripto, algo }` |
| `/api/dekripsi/teks` | Dekripsi teks | `{ teks, password_kripto, algo }` |
| `/api/enkripsi/file` | Enkripsi file | `FormData: file, password_kripto, algo` |
| `/api/dekripsi/file` | Dekripsi file | `FormData: file, password_kripto, algo` |

### Contoh Request (Text Encryption)
```json
POST /api/enkripsi/teks
Content-Type: application/json

{
  "teks": "Hello World",
  "password_kripto": "mypassword123",
  "algo": "AES-GCM"
}
```

### Contoh Response Sukses
```json
{
  "ciphertext": "dGhpcyBpcyBhIGJhc2U2NCBlbmNvZGVkIHN0cmluZw=="
}
```

### Contoh Error Response
```json
{
  "detail": "Password salah atau data korup"
}
```

---

## Algoritma Kripto (Penjelasan Simple)

### AES-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Symmetric**: Satu password untuk enkripsi & dekripsi
- **Block cipher**: Proses data per blok 128-bit
- **GCM = Authenticated**: Otomatis cek apakah data diubah (integrity)
- **Key size**: 256-bit (diturunkan dari password via PBKDF2)
- **IV/Nonce**: 12-byte random per enkripsi

### ChaCha20-Poly1305
- **Stream cipher**: Proses data sebagai aliran (bukan blok)
- **Lebih cepat di CPU tanpa AES-NI** (mobile, embedded)
- **Poly1305**: Message authentication code (integrity)
- **Key size**: 256-bit
- **Nonce**: 12-byte random

### Key Derivation (Sama untuk keduanya)
```
Password + Salt (16 byte random) 
    → PBKDF2 (100,000 iterations, SHA-256)
    → 32-byte Key (256-bit)
```
⚠️ Salt disimpan bersamaan ciphertext (tidak rahasia, cuma biar unik per enkripsi)

---

## Format File Output

### Enkripsi File → `.enc`
```
File asli → [Read bytes] → [Encrypt] → [Base64 encode] → Simpan sebagai .enc (text file Base64)
```
- Hasilnya file **teks** (Base64), aman dikirim via email/chat
- Nama file: `document.pdf` → `document.pdf.enc`

### Dekripsi File → `_hasil_dekripsi.ext`
```
File .enc → [Read Base64] → [Decrypt] → Binary asli
```
- Nama file: `document.pdf.enc` → `document_hasil_dekripsi.pdf`
- **Logic**: hapus suffix `.enc`, pisahkan nama & ekstensi, sisipkan `_hasil_dekripsi` di tengah (sebelum ekstensi)

### Implementasi Frontend (`downloadFile()`)
```typescript
const formatDecryptedFilename = (name: string): string => {
  if (name.endsWith('.enc')) name = name.slice(0, -4);
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex !== -1) {
    const namePart = name.substring(0, lastDotIndex);
    const extPart = name.substring(lastDotIndex);
    return `${namePart}_hasil_dekripsi${extPart}`;
  }
  return `${name}_hasil_dekripsi`;
};
```

---

## Frontend UI (page.tsx) - Arsitektur

### State Management (React `useState`)
```typescript
// Mode utama
mode: 'menu' | 'encrypt' | 'decrypt'
contentType: 'text' | 'file'

// Text state
textInput, password, showPassword, algo, textResult, textError

// File state
file, filePassword, fileAlgo, fileResult, fileError
```

### Flow Navigasi
```
Menu (2 tombol: Enkripsi / Dekripsi)
    ↓
Pilih Mode (Encrypt/Decrypt) + Toggle (Text/File)
    ↓
Form Input → Submit → Loading → Result/Error
    ↓
Result: Copy (text) atau Download (file)
```

### Design Principles (Premium Glassmorphism)
- **Palette**: Violet (`#818cf8`), Cyan (`#06b6d4`), Dark Navy base
- **2 main modes** (Encrypt/Decrypt) + Toggle (Text/File)
- **Premium input forms**: Glassmorphism wrapper (`input-wrapper`), focus glow violet, char counter
- **Password toggle**: Lucide `Eye`/`EyeOff` icon, functional show/hide
- **Custom select dropdown**: ChevronDown rotate 180° on focus
- **Mobile-first**: `sm:` breakpoint (640px+)
- **No emojis**, clean icons (→ ←, Lock, Unlock, FileUp, Eye, ChevronDown)
- **Dark theme** default (slate-950 background)

### Premium UI Components (Frontend)
| Component | Fitur Utama |
|-----------|-------------|
| `BackgroundGlobal.tsx` | Parallax orbs, cursor-tracking gradient (4 quadrant colors), pulse ring, noise overlay, vignette, 60fps RAF |
| `SkewCard.tsx` | 3D skew-to-straight hover, blob gradient border, glass expansion, magnetic cursor, shimmer sweep |
| `EncryptionIcons.tsx` | Gradient icon backgrounds, glow ring pulse, consistent sizing |
| `BackButton.tsx` | Pill-style, backdrop blur, violet glow ring, chevron slide, pressed scale 0.96 |
| `ChooseFileButton.tsx` | 3D layered (back/front sheets), folded corner, action badge, FileUp icon lift, state update filename+size |

---

## Keamanan & Best Practices

### Yang Sudah Diimplementasikan
✅ PBKDF2 (100k iterasi) untuk key derivation  
✅ Random salt per enkripsi (16 byte)  
✅ Random nonce/IV per enkripsi (12 byte)  
✅ AEAD (authenticated encryption) - deteksi tampering  
✅ Password tidak disimpan, hanya dipakai derive key  
✅ CORS dibatasi ke `localhost:3000`  

### Yang BELUM (Untuk Production)
❌ HTTPS (wajib untuk production)  
❌ Rate limiting / brute-force protection  
❌ Audit logging  
❌ Key rotation policy  
❌ Secure password requirements  
❌ Input sanitization (XSS protection di frontend)  

---

## Common Issues & Fixes

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `CORS error` | Backend tidak allow origin | Cek `CORSMiddleware` di `main.py` allow `localhost:3000` |
| `Connection refused` | Backend tidak jalan | Jalankan `uvicorn main:app --reload --port 8000` |
| `Port 3000 in use` | Process lama jalan | `taskkill /PID <pid> /F` lalu `npm run dev` |
| `Invalid padding` / `Decryption failed` | Password salah / file korup | Pastikan password benar, file `.enc` tidak corrupt |
| `Fast Refresh full reload` | State mismatch React | Pastikan state direset saat ganti mode (`resetState()`) |

---

## Testing Manual

### Test Enkripsi Teks
1. Buka http://localhost:3000
2. Klik **Enkripsi** → Pastikan tab **Teks** aktif
3. Isi: Teks = "Hello", Password = "123", Algo = AES-GCM
4. Klik **Enkripsi** → Copy hasil ciphertext

### Test Dekripsi Teks
1. Klik **Dekripsi** → Tab **Teks**
2. Paste ciphertext, Password = "123", Algo = AES-GCM
3. Klik **Dekripsi** → Harus keluar "Hello"

### Test Enkripsi File
1. Klik **Enkripsi** → Tab **File**
2. Pilih file (gambar, pdf, dll), Password = "123"
3. Klik **Enkripsi File** → Download `filename.enc`

### Test Dekripsi File
1. Klik **Dekripsi** → Tab **File**
2. Pilih file `.enc` tadi, Password = "123"
3. Klik **Dekripsi File** → Download file asli

---

## Key Files untuk Dipahami Junior

### 1. `backend/logika.py` - Jantung Kripto
- Fungsi: `derive_key()`, `encrypt_aes_gcm()`, `decrypt_aes_gcm()`, `encrypt_chacha()`, `decrypt_chacha()`
- Pelajari: PBKDF2, nonce, tag authentication, base64 encoding

### 2. `backend/main.py` - API Layer
- FastAPI endpoints, Pydantic models, CORS, error handling
- Pelajari: `UploadFile`, `FormData`, `FileResponse`

### 3. `frontend/app/page.tsx` - Full UI Logic
- Single component (intentional untuk simplicity)
- State management, fetch API, file download logic
- Pelajari: `useState`, `fetch`, `FormData`, `Blob`, `URL.createObjectURL()`

---

## Development Log (Singkat)

Lihat `progres.md` untuk detail. Ringkasan:
- ✅ Setup project structure
- ✅ Backend API (4 endpoints)
- ✅ Frontend 4 features + auto-download + copy clipboard
- ✅ Bug fix: File decryption (UploadFile vs form field)
- ✅ CORS fix
- ✅ **Redesign minimalis** (Impeccable skill): 4 cards → 2 modes + toggle
- ✅ **Redesign Premium Glassmorphism**: BackgroundGlobal (parallax orbs, cursor gradient), SkewCard (3D skew), EncryptionIcons, BackButton, ChooseFileButton
- ✅ **Premium Input Forms** (tes.html porting): `input-wrapper` with violet glow, password toggle (Eye/EyeOff), custom select chevron (rotate 180°), char counter
- ✅ **File Naming Logic Fix**: Enkripsi → `file.enc`, Dekripsi → `file_hasil_dekripsi.ext`
- ✅ **UI/UX Polish**: Cursor gradient transparency (0.15), disabled button saat field wajib kosong

---

## Pertanyaan Umum (FAQ)

**Q: Kenapa pakai Base64 untuk file enkripsi?**
A: Biar file `.enc` bisa dibuka di text editor, dikirim via email/chat tanpa corrupt. Binary aman tapi tidak portable.

**Q: Kenapa salt & nonce disimpan bersamaan ciphertext?**
A: Standar kripto. Salt & nonce **tidak rahasia** - fungsinya biar setiap enkripsi unik meski password sama. Attacker lihat salt/nonce tidak bisa derivasi key tanpa password.

**Q: Bisa pakai password lemah?**
A: Bisa, tapi PBKDF2 100k iterasi melambatkan brute-force. Untuk production: enforce password policy.

**Q: Kenapa tidak pakai JWT/auth?**
A: Requirement eksplisit: "Authentication bypassed/disabled untuk direct web access". Ini tool internal/localhost.

---

## Next Steps (Ideas untuk Pengembangan)

1. **Drag & drop** file upload
2. **Progress bar** untuk file besar
3. **Batch processing** (multiple files)
4. **Password strength meter**
5. **Dark/Light theme toggle**
6. **PWA support** (offline capable)
7. **Unit tests** (pytest + jest)
8. **Dockerize** untuk deployment mudah

---

## Kontak / Referensi

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com
- **cryptography.io**: https://cryptography.io
- **NIST SP 800-38D** (AES-GCM spec)
- **RFC 8439** (ChaCha20-Poly1305 spec)

---

*File ini dibuat untuk memudahkan onboarding junior developer atau AI assistant murah. Update saat ada perubahan signifikan.*
