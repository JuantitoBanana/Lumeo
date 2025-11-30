import { useState, useEffect, useRef } from 'react';
import { EvolucionMensual, GraficosService } from '@/services/graficos.service';

interface UseEvolucionMensualResult {
  evolucion: EvolucionMensual[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Caché global
let cachedEvolucion: EvolucionMensual[] = [];
let cachedEvolucionUsuarioId: number | null = null;
let cachedMeses: number = 2;

export function useEvolucionMensual(usuarioId: number | null, meses: number = 2): UseEvolucionMensualResult {
  const [evolucion, setEvolucion] = useState<EvolucionMensual[]>(() => {
    if (cachedEvolucion.length > 0 && cachedEvolucionUsuarioId === usuarioId && cachedMeses === meses) {
      return cachedEvolucion;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const fetchEvolucion = async () => {
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
      
      // Actualizar caché
      cachedEvolucion = evolucionData;
      cachedEvolucionUsuarioId = usuarioId;
      cachedMeses = meses;
      
      setEvolucion(evolucionData);
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }

      // Si fue cancelada, no mostrar error
      if (err.message === 'CANCELED' || err.name === 'AbortError') {
        return;
      }

      const errorMessage = err?.response?.data?.message || err?.message || 'Error desconocido';
      console.error('❌ Error al obtener evolución mensual:', err);
      
      setError(errorMessage);
      // NO limpiar la evolución en caso de error - mantener los datos anteriores
      // setEvolucion([]);
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
      const hasCache = cachedEvolucion.length > 0 && cachedEvolucionUsuarioId === usuarioId && cachedMeses === meses;
      
      // Solo cargar si no hay caché o cambiaron los parámetros
      if (!hasCache || cachedEvolucionUsuarioId !== usuarioId || cachedMeses !== meses) {
        fetchEvolucion();
      }
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