import { useState, useEffect, useRef } from 'react';
import { ResumenFinanciero, ResumenFinancieroService } from '@/services/resumen-financiero.service';

interface UseResumenFinancieroResult {
  resumen: ResumenFinanciero | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useResumenFinanciero(usuarioId: number | null): UseResumenFinancieroResult {
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false); // Prevenir peticiones duplicadas

  const fetchResumen = async () => {
    if (!usuarioId) {
      return;
    }

    // Si ya está cargando, no hacer nada
    if (isFetchingRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const resumenData = await ResumenFinancieroService.getResumenFinanciero(usuarioId);
      
      setResumen(resumenData);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener resumen financiero:', err);
      setError(errorMessage);
      setResumen(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (usuarioId) {
      fetchResumen();
    }
  }, [usuarioId]);

  return {
    resumen,
    loading,
    error,
    refetch: fetchResumen
  };
}

export default useResumenFinanciero;