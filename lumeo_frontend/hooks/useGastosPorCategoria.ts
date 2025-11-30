import { useState, useEffect, useRef } from 'react';
import { GastoPorCategoria, GraficosService } from '@/services/graficos.service';

interface UseGastosPorCategoriaResult {
  gastos: GastoPorCategoria[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Caché global
let cachedGastos: GastoPorCategoria[] = [];
let cachedGastosUsuarioId: number | null = null;

export function useGastosPorCategoria(usuarioId: number | null): UseGastosPorCategoriaResult {
  const [gastos, setGastos] = useState<GastoPorCategoria[]>(() => {
    if (cachedGastos.length > 0 && cachedGastosUsuarioId === usuarioId) {
      return cachedGastos;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchGastos = async () => {
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
      
      // Actualizar caché
      cachedGastos = gastosData;
      cachedGastosUsuarioId = usuarioId;
      
      setGastos(gastosData);
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      // Si fue cancelada, no mostrar error
      if (err.message === 'CANCELED' || err.name === 'AbortError') {
        return;
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener gastos por categoría:', err);
      
      setError(errorMessage);
      // NO limpiar los gastos en caso de error - mantener los datos anteriores
      // setGastos([]);
    } finally {
      fetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (usuarioId && usuarioId > 0) {
      const hasCache = cachedGastos.length > 0 && cachedGastosUsuarioId === usuarioId;
      
      // Solo cargar si no hay caché o cambió el usuario
      if (!hasCache || cachedGastosUsuarioId !== usuarioId) {
        fetchGastos();
      }
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