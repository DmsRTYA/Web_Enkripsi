import os
import sys
import base64
import io
import math
import random
from collections import Counter
import time
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.exceptions import InvalidTag
from PIL import Image

def derive_key(password: str, salt: bytes) -> bytes:
    """Menurunkan kunci 256-bit (32 bytes) dari password menggunakan PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return kdf.derive(password.encode())

def calculate_shannon_entropy(data: bytes) -> float:
    """Menghitung tingkat keacakan data (Shannon Entropy)."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    counts = Counter(data)
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 4)

def calculate_histogram(data: bytes) -> list[int]:
    """Menghitung frekuensi setiap byte (0-255)."""
    counts = [0] * 256
    for b in data:
        counts[b] += 1
    return counts

def calculate_hamming_distance_percentage(b1: bytes, b2: bytes) -> float:
    """Menghitung persentase perubahan bit (Avalanche Effect) menggunakan Hamming Distance."""
    min_len = min(len(b1), len(b2))
    diff_bits = 0
    for i in range(min_len):
        diff_bits += bin(b1[i] ^ b2[i]).count('1')
    length_diff_bits = abs(len(b1) - len(b2)) * 8
    total_bits_all = max(len(b1), len(b2)) * 8
    if total_bits_all == 0:
        return 0.0
    diff_bits += length_diff_bits
    return round((diff_bits / total_bits_all) * 100.0, 2)

def encrypt_data(plaintext: bytes, password: str, algo: str = "AES-GCM", 
                 provided_salt: bytes = None, provided_nonce: bytes = None) -> str:
    """Mengenkripsi data, membangkitkan salt & nonce acak, lalu mengembalikan format Base64."""
    salt = provided_salt if provided_salt else os.urandom(16)
    key = derive_key(password, salt)
    nonce = provided_nonce if provided_nonce else os.urandom(12)

    if algo == "AES-GCM":
        cipher = AESGCM(key)
    elif algo == "ChaCha20-Poly1305":
        cipher = ChaCha20Poly1305(key)
    else:
        raise ValueError("Algoritma tidak didukung")

    ciphertext = cipher.encrypt(nonce, plaintext, None)
    payload = salt + nonce + ciphertext
    return base64.b64encode(payload).decode('utf-8')

def decrypt_data(base64_payload: str, password: str, algo: str = "AES-GCM") -> bytes:
    """Mendekripsi data Base64 kembali menjadi bytes asli."""
    try:
        payload = base64.b64decode(base64_payload)
        salt = payload[:16]
        nonce = payload[16:28]
        ciphertext = payload[28:]

        key = derive_key(password, salt)

        if algo == "AES-GCM":
            cipher = AESGCM(key)
        elif algo == "ChaCha20-Poly1305":
            cipher = ChaCha20Poly1305(key)
        else:
            raise ValueError("Algoritma tidak didukung")

        plaintext = cipher.decrypt(nonce, ciphertext, None)
        return plaintext
    except InvalidTag:
        raise ValueError("Gagal! Kata sandi salah atau ciphertext telah diubah.")
    except Exception as e:
        raise ValueError(f"Format data tidak valid: {str(e)}")

def encrypt_data_with_metrics(plaintext: bytes, password: str, algo: str = "AES-GCM"):
    """Mengenkripsi data beserta metrik performa, entropi, avalanche effect, dan histogram."""
    start_time = time.perf_counter()
    
    salt = os.urandom(16)
    key = derive_key(password, salt)
    nonce = os.urandom(12)

    if algo == "AES-GCM":
        cipher = AESGCM(key)
    elif algo == "ChaCha20-Poly1305":
        cipher = ChaCha20Poly1305(key)
    else:
        raise ValueError("Algoritma tidak didukung")

    ciphertext_raw = cipher.encrypt(nonce, plaintext, None)
    payload = salt + nonce + ciphertext_raw
    ciphertext_b64 = base64.b64encode(payload).decode('utf-8')
    
    end_time = time.perf_counter()
    execution_time_ms = round((end_time - start_time) * 1000.0, 3)
    
    entropy = calculate_shannon_entropy(ciphertext_raw)
    hist_plaintext = calculate_histogram(plaintext)
    hist_ciphertext = calculate_histogram(ciphertext_raw)
    
    # Avalanche Effect simulation (flip 1 bit in Key)
    avalanche_pct = 50.0
    if len(plaintext) > 0:
        try:
            modified_key = bytearray(key)
            modified_key[0] ^= 0x01
            
            if algo == "AES-GCM":
                mod_cipher = AESGCM(bytes(modified_key))
            elif algo == "ChaCha20-Poly1305":
                mod_cipher = ChaCha20Poly1305(bytes(modified_key))
            else:
                mod_cipher = cipher
                
            mod_ciphertext_raw = mod_cipher.encrypt(nonce, plaintext, None)
            avalanche_pct = calculate_hamming_distance_percentage(ciphertext_raw, mod_ciphertext_raw)
        except Exception:
            avalanche_pct = 50.0

    return {
        "ciphertext": ciphertext_b64,
        "execution_time_ms": execution_time_ms,
        "entropy_ciphertext": entropy,
        "avalanche_percentage": avalanche_pct,
        "histogram_plaintext": hist_plaintext,
        "histogram_ciphertext": hist_ciphertext
    }

def decrypt_data_with_metrics(base64_payload: str, password: str, algo: str = "AES-GCM"):
    """Mendekripsi data beserta metrik performa, entropi, dan histogram."""
    start_time = time.perf_counter()
    try:
        payload = base64.b64decode(base64_payload)
        salt = payload[:16]
        nonce = payload[16:28]
        ciphertext_raw = payload[28:]

        key = derive_key(password, salt)

        if algo == "AES-GCM":
            cipher = AESGCM(key)
        elif algo == "ChaCha20-Poly1305":
            cipher = ChaCha20Poly1305(key)
        else:
            raise ValueError("Algoritma tidak didukung")

        plaintext = cipher.decrypt(nonce, ciphertext_raw, None)
        
        end_time = time.perf_counter()
        execution_time_ms = round((end_time - start_time) * 1000.0, 3)
        
        entropy = calculate_shannon_entropy(ciphertext_raw)
        hist_plaintext = calculate_histogram(plaintext)
        hist_ciphertext = calculate_histogram(ciphertext_raw)

        return {
            "plaintext": plaintext,
            "execution_time_ms": execution_time_ms,
            "entropy_ciphertext": entropy,
            "histogram_plaintext": hist_plaintext,
            "histogram_ciphertext": hist_ciphertext
        }
    except InvalidTag:
        raise ValueError("Gagal! Kata sandi salah atau ciphertext telah diubah.")
    except Exception as e:
        raise ValueError(f"Format data tidak valid: {str(e)}")

def visualize_ecb_vs_secure(image_bytes: bytes):
    """
    Membandingkan visualisasi enkripsi ECB vs Mode Aman (AES-GCM).
    Mengembalikan tuple (ecb_b64, secure_b64).
    """
    # 1. Load image and extract pixels
    img = Image.open(io.BytesIO(image_bytes))
    img = img.convert("RGB")
    width, height = img.size
    pixel_data = img.tobytes()

    # Kunci statis untuk demo (bisa random juga)
    demo_key = b"12345678901234567890123456789012" # 32 bytes

    # --- PROSES 1: AES-ECB ---
    # ECB butuh padding jika data bukan kelipatan 16
    padder = padding.PKCS7(128).padder()
    padded_pixels = padder.update(pixel_data) + padder.finalize()
    
    cipher_ecb = Cipher(algorithms.AES(demo_key), modes.ECB())
    encryptor_ecb = cipher_ecb.encryptor()
    encrypted_ecb_full = encryptor_ecb.update(padded_pixels) + encryptor_ecb.finalize()
    
    # Ambil seukuran pixel asli agar bisa dirender ulang jadi image
    encrypted_ecb_pixels = encrypted_ecb_full[:len(pixel_data)]
    img_ecb = Image.frombytes("RGB", (width, height), encrypted_ecb_pixels)
    
    # --- PROSES 2: AES-GCM (Mode Aman) ---
    nonce = os.urandom(12)
    cipher_gcm = AESGCM(demo_key)
    # GCM mengembalikan ciphertext + tag
    encrypted_gcm_full = cipher_gcm.encrypt(nonce, pixel_data, None)
    
    # GCM ciphertext memiliki panjang yang sama dengan plaintext
    encrypted_gcm_pixels = encrypted_gcm_full[:len(pixel_data)]
    img_secure = Image.frombytes("RGB", (width, height), encrypted_gcm_pixels)

    # Convert ke Base64
    def img_to_b64(image):
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')

    return img_to_b64(img_ecb), img_to_b64(img_secure)

# =========================================================================
# ANTARMUKA TERMINAL INTERAKTIF (CLI)
# =========================================================================

def pilih_algoritma():
    print("\nPilih Algoritma Kriptografi:")
    print("1. AES-GCM (Standar Industri)")
    print("2. ChaCha20-Poly1305 (Sangat Cepat)")
    while True:
        pilihan = input("Masukkan pilihan (1/2): ")
        if pilihan == '1':
            return "AES-GCM"
        elif pilihan == '2':
            return "ChaCha20-Poly1305"
        else:
            print("Pilihan tidak valid, silakan ketik 1 atau 2.")

def menu_interaktif():
    while True:
        print("\n" + "="*45)
        print(" PORTAL AGEN RAHASIA (MODUL KRIPTOGRAFI)")
        print("="*45)
        print("1. Enkripsi Text")
        print("2. Dekripsi Text")
        print("3. Enkripsi File/Gambar")
        print("4. Dekripsi File/Gambar")
        print("5. Keluar")
        print("="*45)
        
        pilihan = input("Pilih menu aksi (1-5): ")
        
        if pilihan == '5':
            print("\n[INFO] Keluar dari terminal. Pastikan Anda telah menghapus jejak!\n")
            sys.exit(0)
            
        if pilihan not in ['1', '2', '3', '4']:
            print("\n[!] ERROR: Input tidak valid. Pilih angka 1 sampai 5.")
            continue
            
        algo = pilih_algoritma()
        
        try:
            # MENU 1: ENKRIPSI TEXT
            if pilihan == '1':
                pesan = input("\nMasukkan pesan teks rahasia: ").encode('utf-8')
                password = input("Masukkan kata sandi (password): ")
                hasil_b64 = encrypt_data(pesan, password, algo)
                
                print("\n[+] BERHASIL: Berikut adalah Ciphertext Base64 Anda:")
                print("-" * 50)
                print(hasil_b64)
                print("-" * 50)
                
            # MENU 2: DEKRIPSI TEXT
            elif pilihan == '2':
                cipher_b64 = input("\nTempelkan (Paste) Ciphertext Base64 di sini: ").strip()
                password = input("Masukkan kata sandi (password): ")
                pesan_asli_bytes = decrypt_data(cipher_b64, password, algo)
                
                print("\n[+] BERHASIL: Pesan berhasil didekripsi!")
                print("-" * 50)
                print(pesan_asli_bytes.decode('utf-8'))
                print("-" * 50)
                
            # MENU 3: ENKRIPSI FILE
            elif pilihan == '3':
                path_in = input("\nMasukkan lokasi/nama file asli (contoh: rahasia.pdf): ").strip()
                with open(path_in, 'rb') as f:
                    file_data = f.read()
                    
                password = input("Masukkan kata sandi (password): ")
                hasil_b64 = encrypt_data(file_data, password, algo)
                
                path_out = input("Masukkan nama file untuk menyimpan kode rahasia (contoh: data.enc): ").strip()
                with open(path_out, 'w') as f:
                    f.write(hasil_b64)
                print(f"\n[+] BERHASIL: File telah dienkripsi dan disimpan ke '{path_out}'")
                
            # MENU 4: DEKRIPSI FILE
            elif pilihan == '4':
                path_in = input("\nMasukkan lokasi/nama file enkripsi (contoh: data.enc): ").strip()
                with open(path_in, 'r') as f:
                    cipher_b64 = f.read().strip()
                    
                password = input("Masukkan kata sandi (password): ")
                file_asli_bytes = decrypt_data(cipher_b64, password, algo)
                
                path_out = input("Masukkan nama file untuk menyimpan wujud aslinya (contoh: asli.pdf): ").strip()
                with open(path_out, 'wb') as f:
                    f.write(file_asli_bytes)
                print(f"\n[+] BERHASIL: File telah dikembalikan ke wujud asli dan disimpan ke '{path_out}'")

        except ValueError as ve:
            print(f"\n[!] ERROR: {str(ve)}")
        except FileNotFoundError:
            print("\n[!] ERROR: Berkas tidak ditemukan. Pastikan nama berkas atau lokasi (*path*) sudah benar.")
        except Exception as e:
            print(f"\n[!] ERROR SISTEM: Terjadi kegagalan -> {str(e)}")

if __name__ == "__main__":
    menu_interaktif()