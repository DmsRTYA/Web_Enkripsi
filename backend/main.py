import time
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logika

app = FastAPI(title="API Portal Agen Rahasia")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aplikasi-kripto.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextRequest(BaseModel):
    teks: str
    password_kripto: str
    algo: str = "AES-GCM"

# RESTful API Endpoints

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
        res = logika.encrypt_data_with_metrics(req.teks.encode('utf-8'), req.password_kripto, req.algo)
        return {"status": "sukses", **res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/dekripsi/teks")
def dekripsi_teks(req: TextRequest):
    try:
        res = logika.decrypt_data_with_metrics(req.teks, req.password_kripto, req.algo)
        return {
            "status": "sukses", 
            "plaintext": res["plaintext"].decode('utf-8'),
            "execution_time_ms": res["execution_time_ms"],
            "entropy_ciphertext": res["entropy_ciphertext"],
            "histogram_plaintext": res["histogram_plaintext"],
            "histogram_ciphertext": res["histogram_ciphertext"]
        }
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
        res = logika.encrypt_data_with_metrics(file_bytes, password_kripto, algo)
        return {"status": "sukses", "filename": file.filename, **res}
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
        res = logika.decrypt_data_with_metrics(ciphertext, password_kripto, algo)
        import base64
        file_b64 = base64.b64encode(res["plaintext"]).decode('utf-8')
        return {
            "status": "sukses", 
            "file_asli_b64": file_b64,
            "execution_time_ms": res["execution_time_ms"],
            "entropy_ciphertext": res["entropy_ciphertext"],
            "histogram_plaintext": res["histogram_plaintext"],
            "histogram_ciphertext": res["histogram_ciphertext"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/visualize-ecb")
async def visualize_ecb(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        ecb_b64, secure_b64 = logika.visualize_ecb_vs_secure(image_bytes)
        return {
            "status": "sukses",
            "ecb_image_base64": ecb_b64,
            "secure_image_base64": secure_b64
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal memproses visualisasi: {str(e)}")