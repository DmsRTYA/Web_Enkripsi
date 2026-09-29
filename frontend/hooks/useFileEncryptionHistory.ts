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
  fileSize?: number
) => {
  try {
    const { error } = await supabase.from('file_encryption_history').insert({
      original_filename: originalFilename,
      password_ciphertext: passwordCiphertext,
      method,
      encrypted_filename: encryptedFilename,
      file_size: fileSize,
    });
    return { error };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Insert failed' };
  }
};