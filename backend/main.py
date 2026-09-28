import time
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logika

app = FastAPI(title="API Portal Agen Rahasia")

# Tambahkan CORS Middleware agar bisa diakses oleh Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================================
# SCHEMAS (Format Data Request)
# =========================================================================
class TextRequest(BaseModel):
    teks: str
    password_kripto: str
    algo: str = "AES-GCM"

# =========================================================================
# ENDPOINTS API RESTful
# =========================================================================

@app.get("/")
def home():
    return {"pesan": "Selamat datang di API Portal Agen Rahasia! Silakan kunjungi /docs untuk antarmuka pengujian."}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/v1/models")
def models():
    return {"data": [{"id": "default-model"}]}

@app.post("/api/enkripsi/teks")
def enkripsi_teks(req: TextRequest):
    try:
        hasil_b64 = logika.encrypt_data(req.teks.encode('utf-8'), req.password_kripto, req.algo)
        return {"status": "sukses", "ciphertext": hasil_b64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/dekripsi/teks")
def dekripsi_teks(req: TextRequest):
    try:
        hasil_bytes = logika.decrypt_data(req.teks, req.password_kripto, req.algo)
        return {"status": "sukses", "plaintext": hasil_bytes.decode('utf-8')}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/enkripsi/file")
def enkripsi_file(
    password_kripto: str = Form(...),
    algo: str = Form("AES-GCM"),
    file: UploadFile = File(...)
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
    file: UploadFile = File(...)
):
    try:
        ciphertext = file.file.read().decode('utf-8').strip()
        file_bytes = logika.decrypt_data(ciphertext, password_kripto, algo)
        # Mengembalikan string Base64 dari file asli agar mudah diunduh oleh frontend
        import base64
        file_b64 = base64.b64encode(file_bytes).decode('utf-8')
        return {"status": "sukses", "file_asli_b64": file_b64}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))