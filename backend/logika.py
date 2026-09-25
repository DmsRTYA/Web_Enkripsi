import os
import sys
import base64
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM, ChaCha20Poly1305
from cryptography.exceptions import InvalidTag

def derive_key(password: str, salt: bytes) -> bytes:
    """Menurunkan kunci 256-bit (32 bytes) dari password menggunakan PBKDF2."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100_000,
    )
    return kdf.derive(password.encode())

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