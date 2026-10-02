import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface FileEncryptionRecord {
  id: number;
  original_filename: string;
  password_ciphertext: string;
  method: string;
  encrypted_filename: string | null;
  file_size: number | null;
  created_at: string;
  waktu_komputasi_ms?: number;
  entropi_shannon?: number;
  avalanche_effect?: number;
  histogram_base64?: string;
}

export const useFileEncryptionHistory = () => {
  const [data, setData] = useState<FileEncryptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase
        .from('file_encryption_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (err) throw new Error(err.message);
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, mutate: fetchHistory };
};

export const saveFileEncryptionHistory = async (
  originalFilename: string,
  passwordCiphertext: string,
  method: string,
  encryptedFilename?: string,
  fileSize?: number,
  waktuKomputasiMs?: number,
  entropiShannon?: number,
  avalancheEffect?: number,
  histogramBase64?: string
) => {
  try {
    const { error } = await supabase.from('file_encryption_history').insert({
      original_filename: originalFilename,
      password_ciphertext: passwordCiphertext,
      method,
      encrypted_filename: encryptedFilename,
      file_size: fileSize,
      waktu_komputasi_ms: waktuKomputasiMs || 0,
      entropi_shannon: entropiShannon || 0,
      avalanche_effect: avalancheEffect || 0,
      histogram_base64: histogramBase64 || '',
    });
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Insert failed' };
  }
};
