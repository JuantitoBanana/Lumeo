import { useState, useEffect } from 'react';
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

  const fetchResumen = async () => {
    if (!usuarioId) {
      console.log('❌ No hay usuarioId, no se puede obtener resumen');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Obteniendo resumen financiero para usuario:', usuarioId);
      
      const resumenData = await ResumenFinancieroService.getResumenFinanciero(usuarioId);
      
      console.log('✅ Resumen financiero obtenido:', resumenData);
      setResumen(resumenData);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener resumen financiero:', err);
      console.error('❌ Detalles del error:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message
      });
      setError(errorMessage);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 useResumenFinanciero useEffect ejecutado con usuarioId:', usuarioId);
    if (usuarioId) {
      console.log('✅ usuarioId válido, llamando fetchResumen...');
      fetchResumen();
    } else {
      console.log('❌ usuarioId no válido:', usuarioId);
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