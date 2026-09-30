import time
import io
import base64
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import xlsxwriter
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import logika

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="API Portal Agen Rahasia")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Terlalu banyak permintaan. Coba lagi dalam 15 detik."},
        headers={"Retry-After": "15"},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://aplikasi-kripto.vercel.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Retry-After"],
)

# Pydantic Models for Excel Download

class TextHistoryItem(BaseModel):
    id: int
    ciphertext: str
    password_ciphertext: str
    method: str
    waktu_komputasi_ms: float
    entropi_shannon: float
    avalanche_effect: float
    histogram_base64: str

class FileHistoryItem(BaseModel):
    id: int
    original_filename: str
    password_ciphertext: str
    ekstensi: str
    file_size: int
    method: str
    waktu_komputasi_ms: float
    entropi_shannon: float
    avalanche_effect: float
    histogram_base64: str

class VisualizationPayload(BaseModel):
    id_uji: Optional[str] = None
    nama_file: str
    ukuran_file: int
    waktu_komputasi: float
    gambar_original: str
    gambar_ecb: str
    gambar_gcm: str

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
@limiter.limit("3/15seconds")
def enkripsi_teks(req: TextRequest, request: Request):
    try:
        res = logika.encrypt_data_with_metrics(req.teks.encode('utf-8'), req.password_kripto, req.algo)
        return {"status": "sukses", **res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/dekripsi/teks")
@limiter.limit("3/15seconds")
def dekripsi_teks(req: TextRequest, request: Request):
    try:
        res = logika.decrypt_data_with_metrics(req.teks, req.password_kripto, req.algo)
        return {
            "status": "sukses", 
            "plaintext": res["plaintext"].decode('utf-8'),
            "execution_time_ms": res["execution_time_ms"],
            "entropy_ciphertext": res["entropy_ciphertext"],
            "histogram_plaintext": res["histogram_plaintext"],
            "histogram_ciphertext": res["histogram_ciphertext"],
            "histogram_base64": res.get("histogram_base64", "")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/enkripsi/file")
@limiter.limit("3/15seconds")
def enkripsi_file(
    request: Request,
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
@limiter.limit("3/15seconds")
def dekripsi_file(
    request: Request,
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
            "histogram_ciphertext": res["histogram_ciphertext"],
            "histogram_base64": res.get("histogram_base64", "")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/visualize-ecb")
@limiter.limit("3/15seconds")
async def visualize_ecb(request: Request, file: UploadFile = File(...)):
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


import io
import base64
from PIL import Image
import xlsxwriter
from typing import List, Dict, Any, Optional
from fastapi.responses import StreamingResponse

def normalize_image_for_excel(b64_str: str, target_size=(150, 150)) -> bytes:
    """Membaca string base64, membuka dengan PIL, resize/thumbnail ke target_size dengan padding seragam, dan mengembalikan bytes PNG."""
    if not b64_str:
        return b""
    try:
        if isinstance(b64_str, str):
            if ',' in b64_str:
                b64_str = b64_str.split(',')[1]
            img_bytes = base64.b64decode(b64_str)
        elif isinstance(b64_str, bytes):
            img_bytes = b64_str
        else:
            return b""
        
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img.thumbnail(target_size, Image.Resampling.LANCZOS)
        
        # Buat background seragam (dark slate #0f172a / RGB 15, 23, 42) untuk kotak excel
        base_img = Image.new("RGB", target_size, (15, 23, 42))
        paste_x = (target_size[0] - img.width) // 2
        paste_y = (target_size[1] - img.height) // 2
        base_img.paste(img, (paste_x, paste_y))
        
        out_io = io.BytesIO()
        base_img.save(out_io, format="PNG")
        out_io.seek(0)
        return out_io.getvalue()
    except Exception as e:
        print(f"Error normalizing image for excel: {e}")
        return b""

def insert_histogram_to_worksheet(worksheet, row, col, b64_str, x_scale=0.85, y_scale=0.85):
    if not b64_str:
        return
    try:
        if isinstance(b64_str, str):
            if ',' in b64_str:
                b64_str = b64_str.split(',')[1]
            img_bytes = base64.b64decode(b64_str)
        elif isinstance(b64_str, bytes):
            img_bytes = b64_str
        else:
            return
        
        image_io = io.BytesIO(img_bytes)
        worksheet.insert_image(row, col, 'histogram.png', {
            'image_data': image_io,
            'x_scale': x_scale,
            'y_scale': y_scale,
            'x_offset': 5,
            'y_offset': 5
        })
    except Exception as e:
        print(f"Error inserting histogram into excel: {e}")

def insert_image_to_worksheet(worksheet, row, col, b64_str, x_scale=0.9, y_scale=0.9):
    if not b64_str:
        return
    try:
        img_bytes = normalize_image_for_excel(b64_str, target_size=(150, 150))
        if not img_bytes:
            return
        image_io = io.BytesIO(img_bytes)
        worksheet.insert_image(row, col, 'image.png', {
            'image_data': image_io,
            'x_scale': x_scale,
            'y_scale': y_scale,
            'x_offset': 5,
            'y_offset': 5
        })
    except Exception as e:
        print(f"Error inserting image into excel: {e}")

def format_file_size(size_bytes: Any) -> str:
    """Mengonversi ukuran file ke satuan MB agar seragam dan mudah dipahami."""
    if size_bytes is None:
        return "0.00 MB"
    
    if isinstance(size_bytes, str):
        size_str = size_bytes.strip()
        if not size_str:
            return "0.00 MB"
        try:
            parts = size_str.split()
            val = float(parts[0])
            unit = parts[1].upper() if len(parts) > 1 else "B"
            if unit == "KB":
                size_bytes = val * 1024
            elif unit == "MB":
                size_bytes = val * 1024 * 1024
            elif unit == "GB":
                size_bytes = val * 1024 * 1024 * 1024
            elif unit == "TB":
                size_bytes = val * 1024 * 1024 * 1024 * 1024
            else:
                size_bytes = val
        except Exception:
            try:
                size_bytes = float(size_str)
            except Exception:
                return size_str
    elif isinstance(size_bytes, (int, float)):
        size_bytes = float(size_bytes)
    else:
        try:
            size_bytes = float(size_bytes)
        except Exception:
            return str(size_bytes)

    if size_bytes <= 0:
        return "0.00 MB"

    size_mb = size_bytes / (1024 * 1024)
    return f"{size_mb:.2f} MB"

@app.post("/api/download-excel/teks")
def download_excel_teks(items: List[Dict[str, Any]]):
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet("Riwayat Enkripsi Teks")

    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#1E293B',
        'font_color': '#FFFFFF',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'left',
        'valign': 'vcenter',
        'text_wrap': True
    })
    center_format = workbook.add_format({
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })

    headers = [
        "ID Uji", "Ciphertext", "Password (Ciphertext)", "Tipe Algoritma",
        "Waktu Komputasi Enkripsi (ms)", "Entropi Shannon", "Avalanche Effect (%)", "Histogram Data"
    ]

    for col_num, header in enumerate(headers):
        worksheet.write(0, col_num, header, header_format)
    worksheet.set_row(0, 30)

    worksheet.set_column(0, 0, 10)
    worksheet.set_column(1, 1, 35)
    worksheet.set_column(2, 2, 25)
    worksheet.set_column(3, 3, 20)
    worksheet.set_column(4, 4, 20)
    worksheet.set_column(5, 5, 18)
    worksheet.set_column(6, 6, 18)
    worksheet.set_column(7, 7, 48)

    for idx, item in enumerate(items):
        row_num = idx + 1
        worksheet.set_row(row_num, 140)

        uji_id = item.get('id', row_num)
        ciphertext = item.get('ciphertext', '-')
        password_cp = item.get('password_ciphertext', '-')
        method = item.get('method', 'AES-GCM')
        waktu = item.get('waktu_komputasi_ms', item.get('execution_time_ms', 0.0))
        entropi = item.get('entropi_shannon', item.get('entropy_ciphertext', 0.0))
        avalanche = item.get('avalanche_effect', item.get('avalanche_percentage', 50.0))
        hist_b64 = item.get('histogram_base64', item.get('histogram_ciphertext', None))

        worksheet.write(row_num, 0, uji_id, center_format)
        worksheet.write(row_num, 1, ciphertext, cell_format)
        worksheet.write(row_num, 2, password_cp, cell_format)
        worksheet.write(row_num, 3, method, center_format)
        worksheet.write(row_num, 4, f"{waktu} ms" if isinstance(waktu, (int, float)) else waktu, center_format)
        worksheet.write(row_num, 5, f"{entropi} bits/byte" if isinstance(entropi, (int, float)) else entropi, center_format)
        worksheet.write(row_num, 6, f"{avalanche}%" if isinstance(avalanche, (int, float)) else avalanche, center_format)
        worksheet.write(row_num, 7, "", center_format)

        if hist_b64 and not isinstance(hist_b64, list):
            insert_histogram_to_worksheet(worksheet, row_num, 7, hist_b64, x_scale=0.85, y_scale=0.85)

    workbook.close()
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=riwayat_enkripsi_teks.xlsx"}
    )

@app.post("/api/download-excel/file")
def download_excel_file(items: List[Dict[str, Any]]):
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet("Riwayat Enkripsi File")

    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#1E293B',
        'font_color': '#FFFFFF',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'left',
        'valign': 'vcenter',
        'text_wrap': True
    })
    center_format = workbook.add_format({
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })

    headers = [
        "ID Uji", "Nama File", "Password (Ciphertext)", "Tipe File", "Ukuran File",
        "Tipe Algoritma", "Waktu Komputasi Enkripsi (ms)", "Entropi Shannon", "Avalanche Effect (%)", "Histogram Data"
    ]

    for col_num, header in enumerate(headers):
        worksheet.write(0, col_num, header, header_format)
    worksheet.set_row(0, 30)

    worksheet.set_column(0, 0, 10)
    worksheet.set_column(1, 1, 25)
    worksheet.set_column(2, 2, 25)
    worksheet.set_column(3, 3, 15)
    worksheet.set_column(4, 4, 15)
    worksheet.set_column(5, 5, 20)
    worksheet.set_column(6, 6, 20)
    worksheet.set_column(7, 7, 18)
    worksheet.set_column(8, 8, 18)
    worksheet.set_column(9, 9, 48)

    for idx, item in enumerate(items):
        row_num = idx + 1
        worksheet.set_row(row_num, 140)

        uji_id = item.get('id', row_num)
        filename = item.get('original_filename', item.get('filename', '-'))
        password_cp = item.get('password_ciphertext', '-')
        file_type = item.get('file_type', filename.split('.')[-1] if '.' in filename else 'bin')
        file_size_bytes = item.get('file_size', 0)
        method = item.get('method', 'AES-GCM')
        waktu = item.get('waktu_komputasi_ms', item.get('execution_time_ms', 0.0))
        entropi = item.get('entropi_shannon', item.get('entropy_ciphertext', 0.0))
        avalanche = item.get('avalanche_effect', item.get('avalanche_percentage', 50.0))
        hist_b64 = item.get('histogram_base64', item.get('histogram_ciphertext', None))

        worksheet.write(row_num, 0, uji_id, center_format)
        worksheet.write(row_num, 1, filename, cell_format)
        worksheet.write(row_num, 2, password_cp, cell_format)
        worksheet.write(row_num, 3, file_type, center_format)
        worksheet.write(row_num, 4, format_file_size(file_size_bytes), center_format)
        worksheet.write(row_num, 5, method, center_format)
        worksheet.write(row_num, 6, f"{waktu} ms" if isinstance(waktu, (int, float)) else waktu, center_format)
        worksheet.write(row_num, 7, f"{entropi} bits/byte" if isinstance(entropi, (int, float)) else entropi, center_format)
        worksheet.write(row_num, 8, f"{avalanche}%" if isinstance(avalanche, (int, float)) else avalanche, center_format)
        worksheet.write(row_num, 9, "", center_format)

        if hist_b64 and not isinstance(hist_b64, list):
            insert_histogram_to_worksheet(worksheet, row_num, 9, hist_b64, x_scale=0.85, y_scale=0.85)

    workbook.close()
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=riwayat_enkripsi_file.xlsx"}
    )

@app.post("/api/download-excel/visualisasi")
def download_excel_visualisasi(payload: Dict[str, Any]):
    output = io.BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet("Visualisasi ECB vs AES-GCM")

    header_format = workbook.add_format({
        'bold': True,
        'bg_color': '#1E293B',
        'font_color': '#FFFFFF',
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })
    cell_format = workbook.add_format({
        'border': 1,
        'align': 'center',
        'valign': 'vcenter'
    })

    headers = [
        "ID Uji", "Nama File", "Ukuran File", "Waktu Komputasi",
        "Gambar Awal (Original)", "Gambar Hasil Mode ECB", "Gambar Hasil Mode AES-GCM"
    ]

    for col_num, header in enumerate(headers):
        worksheet.write(0, col_num, header, header_format)
    worksheet.set_row(0, 30)

    worksheet.set_column(0, 0, 10)
    worksheet.set_column(1, 1, 25)
    worksheet.set_column(2, 2, 18)
    worksheet.set_column(3, 3, 20)
    worksheet.set_column(4, 6, 40)

    row_num = 1
    worksheet.set_row(row_num, 150)

    uji_id = payload.get('id', int(time.time()))
    filename = payload.get('nama_file', payload.get('filename', 'demo.png'))
    file_size = payload.get('ukuran_file', payload.get('file_size', 0))
    waktu = payload.get('waktu_komputasi', payload.get('execution_time_ms', '0 ms'))

    orig_img = payload.get('gambar_original', payload.get('original', None))
    ecb_img = payload.get('gambar_ecb', payload.get('ecb', None))
    gcm_img = payload.get('gambar_gcm', payload.get('secure', payload.get('gcm', None)))

    worksheet.write(row_num, 0, uji_id, cell_format)
    worksheet.write(row_num, 1, filename, cell_format)
    worksheet.write(row_num, 2, format_file_size(file_size), cell_format)
    worksheet.write(row_num, 3, waktu, cell_format)
    worksheet.write(row_num, 4, "", cell_format)
    worksheet.write(row_num, 5, "", cell_format)
    worksheet.write(row_num, 6, "", cell_format)

    if orig_img:
        insert_image_to_worksheet(worksheet, row_num, 4, orig_img, x_scale=0.9, y_scale=0.9)
    if ecb_img:
        insert_image_to_worksheet(worksheet, row_num, 5, ecb_img, x_scale=0.9, y_scale=0.9)
    if gcm_img:
        insert_image_to_worksheet(worksheet, row_num, 6, gcm_img, x_scale=0.9, y_scale=0.9)

    workbook.close()
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=visualisasi_ecb_gcm.xlsx"}
    )

# update 30-09-26