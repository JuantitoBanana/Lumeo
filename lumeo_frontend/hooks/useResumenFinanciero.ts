import { useState, useEffect, useRef } from 'react';
import { ResumenFinanciero, ResumenFinancieroService } from '@/services/resumen-financiero.service';

interface UseResumenFinancieroResult {
  resumen: ResumenFinanciero | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Caché global para mantener datos entre navegaciones
let cachedResumen: ResumenFinanciero | null = null;
let cachedUsuarioId: number | null = null;

export function useResumenFinanciero(usuarioId: number | null): UseResumenFinancieroResult {
  const [resumen, setResumen] = useState<ResumenFinanciero | null>(() => {
    // Inicializar con caché si existe y es del mismo usuario
    if (cachedResumen && cachedUsuarioId === usuarioId) {
      return cachedResumen;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false); // Prevenir peticiones duplicadas
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchResumen = async () => {
    if (!usuarioId) {
      return;
    }

    // Si ya está cargando, no hacer nada
    if (isFetchingRef.current) {
      return;
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Crear nuevo AbortController
    abortControllerRef.current = new AbortController();

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const resumenData = await ResumenFinancieroService.getResumenFinanciero(usuarioId);
      
      // Actualizar caché
      cachedResumen = resumenData;
      cachedUsuarioId = usuarioId;
      
      setResumen(resumenData);
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err.name === 'AbortError' || err.message === 'CANCELED') {
        return;
      }
      
      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener resumen financiero:', err);
      setError(errorMessage);
      // NO limpiar el resumen en caso de error - mantener los datos anteriores
      // setResumen(null);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (usuarioId) {
      const hasCache = cachedResumen && cachedUsuarioId === usuarioId;
      
      // Solo cargar si:
      // 1. No hay caché disponible, O
      // 2. El usuario cambió
      if (!hasCache || cachedUsuarioId !== usuarioId) {
        fetchResumen();
      }
    }
    
    // Cleanup: cancelar peticiones al desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [usuarioId]);

  return {
    resumen,
    loading,
    error,
    refetch: fetchResumen
  };
}

export default useResumenFinanciero;