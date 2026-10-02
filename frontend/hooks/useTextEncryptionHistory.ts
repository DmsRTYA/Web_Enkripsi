import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface TextEncryptionRecord {
  id: number;
  ciphertext: string;
  password_ciphertext: string;
  method: string;
  created_at: string;
  waktu_komputasi_ms?: number;
  entropi_shannon?: number;
  avalanche_effect?: number;
  histogram_base64?: string;
}

export const useTextEncryptionHistory = () => {
  const [data, setData] = useState<TextEncryptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: result, error: err } = await supabase
        .from('text_encryption_history')
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

export const saveTextEncryptionHistory = async (
  ciphertext: string,
  passwordCiphertext: string,
  method: string,
  waktuKomputasiMs?: number,
  entropiShannon?: number,
  avalancheEffect?: number,
  histogramBase64?: string
) => {
  try {
    const { error } = await supabase.from('text_encryption_history').insert({
      ciphertext,
      password_ciphertext: passwordCiphertext,
      method,
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
