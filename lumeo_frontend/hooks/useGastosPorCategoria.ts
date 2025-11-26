import { useState, useEffect, useRef } from 'react';
import { GastoPorCategoria, GraficosService } from '@/services/graficos.service';

interface UseGastosPorCategoriaResult {
  gastos: GastoPorCategoria[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGastosPorCategoria(usuarioId: number | null): UseGastosPorCategoriaResult {
  const [gastos, setGastos] = useState<GastoPorCategoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const lastUsuarioIdRef = useRef<number | null>(null);
  const fetchingRef = useRef(false);

  const fetchGastos = async (retryCount = 0) => {
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
      
      const gastosData = await GraficosService.getGastosPorCategoria(usuarioId);
      
      // Verificar si el componente sigue montado
      if (!isMountedRef.current) {
        return;
      }
      
      setGastos(gastosData);
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      // Si fue cancelada, no mostrar error
      if (err.message === 'CANCELED') {
        return;
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener gastos por categoría:', err);
      
      // Solo reintentar en errores de red, no errores del servidor
      const isNetworkError = !err?.response;
      
      if (isNetworkError && retryCount < 1 && isMountedRef.current) {
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchGastos(retryCount + 1);
          }
        }, 3000);
        return;
      }
      
      setError(errorMessage);
      setGastos([]);
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Evitar refetch si el usuarioId no cambió
    if (usuarioId === lastUsuarioIdRef.current) {
      return;
    }
    
    lastUsuarioIdRef.current = usuarioId;
    
    if (usuarioId && usuarioId > 0) {
      fetchGastos();
    } else {
      // Limpiar estado si no hay usuario válido
      setGastos([]);
      setError(null);
      setLoading(false);
    }

    // Cleanup: marcar como desmontado
    return () => {
      isMountedRef.current = false;
      fetchingRef.current = false;
    };
  }, [usuarioId]);

  return {
    gastos,
    loading,
    error,
    refetch: fetchGastos
  };
}

export default useGastosPorCategoria;