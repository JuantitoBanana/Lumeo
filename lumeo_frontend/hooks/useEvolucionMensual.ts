import { useState, useEffect, useRef } from 'react';
import { EvolucionMensual, GraficosService } from '@/services/graficos.service';

interface UseEvolucionMensualResult {
  evolucion: EvolucionMensual[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useEvolucionMensual(usuarioId: number | null, meses: number = 2): UseEvolucionMensualResult {
  const [evolucion, setEvolucion] = useState<EvolucionMensual[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const lastUsuarioIdRef = useRef<number | null>(null);
  const lastMesesRef = useRef<number>(meses);
  const fetchingRef = useRef(false);

  const fetchEvolucion = async (retryCount = 0) => {
    if (!usuarioId || usuarioId <= 0) {
      return;
    }

    if (!isMountedRef.current) {
      return;
    }

    // Evitar peticiones duplicadas simultáneas
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      const evolucionData = await GraficosService.getEvolucionMensual(usuarioId, meses);
      
      // Verificar si el componente sigue montado
      if (!isMountedRef.current) {
        return;
      }
      
      setEvolucion(evolucionData);
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      // Si fue cancelada, no mostrar error
      if (err.message === 'CANCELED') {
        return;
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener evolución mensual:', err);
      
      // Solo reintentar en errores de red, no errores del servidor
      const isNetworkError = !err?.response;
      
      if (isNetworkError && retryCount < 1 && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchEvolucion(retryCount + 1);
          }
        }, 3000);
        return;
      }
      
      setError(errorMessage);
      setEvolucion([]);
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Evitar refetch si los parámetros no cambiaron
    if (usuarioId === lastUsuarioIdRef.current && meses === lastMesesRef.current) {
      return;
    }
    
    lastUsuarioIdRef.current = usuarioId;
    lastMesesRef.current = meses;
    
    if (usuarioId && usuarioId > 0) {
      fetchEvolucion();
    } else {
      // Limpiar estado si no hay usuario válido
      setEvolucion([]);
      setError(null);
      setLoading(false);
    }

    // Cleanup: marcar como desmontado
    return () => {
      isMountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [usuarioId, meses]);

  return {
    evolucion,
    loading,
    error,
    refetch: fetchEvolucion
  };
}

export default useEvolucionMensual;