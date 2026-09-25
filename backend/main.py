import time
import jwt
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import logika # Mengimpor logika kriptografi yang sudah Anda buat

app = FastAPI(title="API Portal Agen Rahasia")
security = HTTPBearer()

# Kunci rahasia untuk JWT (Menggunakan algoritma HMAC-SHA512 sesuai syarat tugas)
JWT_SECRET = "rahasia_super_kuat_untuk_jwt_agen_007"
JWT_ALGO = "HS512"

# =========================================================================
# SCHEMAS (Format Data Request)
# =========================================================================
class LoginRequest(BaseModel):
    id_agen: str
    password: str

class TextRequest(BaseModel):
    teks: str
    password_kripto: str
    algo: str = "AES-GCM"

# =========================================================================
# MIDDLEWARE AUTENTIKASI JWT
# =========================================================================
def verify_jwt(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Memverifikasi token JWT dari frontend sebelum mengizinkan akses ke fitur enkripsi."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token kedaluwarsa. Silakan login kembali.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token tidak valid. Akses ditolak.")

# =========================================================================
# ENDPOINTS API RESTful
# =========================================================================

@app.get("/")
def home():
    return {"pesan": "Selamat datang di API Portal Agen Rahasia! Silakan kunjungi /docs untuk antarmuka pengujian."}

@app.post("/api/login")
def login(req: LoginRequest):
    """Endpoint untuk mendapatkan Token JWT."""
    # Dummy verifikasi sederhana. Jika cocok, berikan kunci akses JWT.
    if req.id_agen == "agen007" and req.password == "rahasia":
        payload = {
            "sub": req.id_agen,
            "exp": time.time() + 3600 # Token berlaku 1 jam
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)
        return {"status": "sukses", "token": token}
    
    raise HTTPException(status_code=401, detail="Kredensial Agen tidak valid!")

@app.post("/api/enkripsi/teks")
def enkripsi_teks(req: TextRequest, token: dict = Depends(verify_jwt)):
    try:
        hasil_b64 = logika.encrypt_data(req.teks.encode('utf-8'), req.password_kripto, req.algo)
        return {"status": "sukses", "ciphertext": hasil_b64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/dekripsi/teks")
def dekripsi_teks(req: TextRequest, token: dict = Depends(verify_jwt)):
    try:
        hasil_bytes = logika.decrypt_data(req.teks, req.password_kripto, req.algo)
        return {"status": "sukses", "plaintext": hasil_bytes.decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/enkripsi/file")
def enkripsi_file(
    password_kripto: str = Form(...),
    algo: str = Form("AES-GCM"),
    file: UploadFile = File(...),
    token: dict = Depends(verify_jwt) # Wajib bawa token JWT
):
    try:
        file_bytes = file.file.read()
        hasil_b64 = logika.encrypt_data(file_bytes, password_kripto, algo)
        return {"status": "sukses", "filename": file.filename, "ciphertext": hasil_b64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/dekripsi/file")
def dekripsi_file(
    password_kripto: str = Form(...),
    algo: str = Form("AES-GCM"),
    ciphertext: str = Form(...),
    token: dict = Depends(verify_jwt)
):
    try:
        file_bytes = logika.decrypt_data(ciphertext, password_kripto, algo)
        # Mengembalikan string Base64 dari file asli agar mudah diunduh oleh frontend
        import base64
        file_b64 = base64.b64encode(file_bytes).decode('utf-8')
        return {"status": "sukses", "file_asli_b64": file_b64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))