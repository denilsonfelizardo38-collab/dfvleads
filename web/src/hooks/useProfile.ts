import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import type { Profile } from '../types.ts';

/**
 * Carrega /api/me (plano, buscas e sites restantes, validade) e expõe
 * recarga para atualizar após buscas, gerações e pagamentos.
 */
export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getMe();
      setProfile(data);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'Falha ao carregar perfil.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, loading, error, refresh, setProfile };
}
