import os
import sys
import time
import math
import base64
from collections import Counter
import matplotlib.pyplot as plt


# Memasukkan direktori induk agar bisa mengimpor logika
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import logika

def calculate_entropy(data: bytes) -> float:
    """Menghitung entropi Shannon dari sekumpulan bytes (maksimal 8.0)."""
    if not data:
        return 0.0
    freq = Counter(data)
    length = len(data)
    entropy = -sum((count / length) * math.log2(count / length) for count in freq.values())
    return entropy

def plot_histogram(plaintext: bytes, ciphertext: bytes, filename: str):
    """Membuat grafik histogram sebaran byte untuk disimpan sebagai PNG."""
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.hist(list(plaintext), bins=256, range=(0, 255), color='blue', alpha=0.7)
    plt.title('Histogram Plaintext')
    plt.xlabel('Nilai Byte (0-255)')
    plt.ylabel('Frekuensi')

    plt.subplot(1, 2, 2)
    plt.hist(list(ciphertext), bins=256, range=(0, 255), color='red', alpha=0.7)
    plt.title('Histogram Ciphertext')
    plt.xlabel('Nilai Byte (0-255)')

    plt.tight_layout()
    plt.savefig(filename)
    plt.close()

def run_tests():
    password = "SuperSecretPassword123"
    algos = ["AES-GCM", "ChaCha20-Poly1305"]
    
    print("="*50)
    print("1. UJI KEBENARAN DEKRIPSI (10 MASUKAN)")
    print("="*50)
    # Mensimulasikan 10 file dengan panjang data yang berbeda
    for i in range(1, 11):
        dummy_data = os.urandom(100 * i) 
        encoded = logika.encrypt_data(dummy_data, password)
        decoded = logika.decrypt_data(encoded, password)
        status = "SUKSES" if dummy_data == decoded else "GAGAL"
        print(f"Uji Masukan {i:02d} (Ukuran: {len(dummy_data)} bytes) -> {status}")
        
    print("\n" + "="*50)
    print("2. UJI WAKTU EKSEKUSI (1KB, 1MB, 10MB)")
    print("="*50)
    sizes = {"1 KB": 1024, "1 MB": 1024 * 1024, "10 MB": 10 * 1024 * 1024}
    for algo in algos:
        print(f"\nAlgoritma: {algo}")
        for label, size in sizes.items():
            test_data = os.urandom(size)
            
            start_enc = time.perf_counter()
            encoded = logika.encrypt_data(test_data, password, algo)
            time_enc = (time.perf_counter() - start_enc) * 1000 # ms
            
            start_dec = time.perf_counter()
            logika.decrypt_data(encoded, password, algo)
            time_dec = (time.perf_counter() - start_dec) * 1000 # ms
            
            print(f"[{label}] Enkripsi: {time_enc:.2f} ms | Dekripsi: {time_dec:.2f} ms")

    print("\n" + "="*50)
    print("3. UJI AVALANCHE EFFECT (Modifikasi 1 bit kunci)")
    print("="*50)
    test_plain = os.urandom(64) # 64 bytes data
    fixed_salt = os.urandom(16)
    fixed_nonce = os.urandom(12)
    
    for algo in algos:
        key1 = logika.derive_key(password, fixed_salt)
        if algo == "AES-GCM":
            c1 = logika.AESGCM(key1)
        else:
            c1 = logika.ChaCha20Poly1305(key1)
        cipher1_bytes = c1.encrypt(fixed_nonce, test_plain, None)
        
        modified_key = bytearray(key1)
        modified_key[0] ^= 0x01
        if algo == "AES-GCM":
            c2 = logika.AESGCM(bytes(modified_key))
        else:
            c2 = logika.ChaCha20Poly1305(bytes(modified_key))
        cipher2_bytes = c2.encrypt(fixed_nonce, test_plain, None)
        
        avalanche = logika.calculate_hamming_distance_percentage(cipher1_bytes, cipher2_bytes)
        print(f"{algo} -> Avalanche Effect: {avalanche:.2f}% (Ideal ~50%)")

    print("\n" + "="*50)
    print("4 & 5. UJI ENTROPI & HISTOGRAM")
    print("="*50)
    plain_data = b"A" * 10000 # Plaintext dengan pola berulang (entropi sangat rendah)
    for algo in algos:
        encrypted_b64 = logika.encrypt_data(plain_data, password, algo)
        cipher_bytes = base64.b64decode(encrypted_b64)[28:]
        
        ent_plain = calculate_entropy(plain_data)
        ent_cipher = calculate_entropy(cipher_bytes)
        
        print(f"{algo} -> Entropi Plaintext: {ent_plain:.4f} | Entropi Ciphertext: {ent_cipher:.4f} / 8.00")
        
        # Simpan grafik
        filename = f"histogram_{algo}.png"
        plot_histogram(plain_data, cipher_bytes, filename)
        print(f"[*] Grafik histogram untuk {algo} telah disimpan sebagai '{filename}'.")

if __name__ == "__main__":
    run_tests()