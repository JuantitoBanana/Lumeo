import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { eventEmitter, APP_EVENTS } from '@/lib/event-emitter';

export interface UltimoGasto {
  id: number;
  titulo: string;
  importe: number;
  fechaTransaccion: string;
  nota?: string;
  idCategoria?: number;
  nombreCategoria?: string;
  iconoCategoria?: string;
  colorCategoria?: string;
  posicionSimbolo?: string; // "ANTES" o "DESPUES"
  // Objeto de categoría para compatibilidad
  categoria?: {
    nombre: string;
    icono?: string;
    color?: string;
  };
}

// Caché global
let cachedUltimosGastos: UltimoGasto[] = [];
let cachedUltimosGastosUsuarioId: number | null = null;

export const useUltimosGastos = (usuarioId: number | null | undefined) => {
  const [gastos, setGastos] = useState<UltimoGasto[]>(() => {
    if (cachedUltimosGastos.length > 0 && cachedUltimosGastosUsuarioId === usuarioId) {
      return cachedUltimosGastos;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastUsuarioIdRef = useRef<number | null | undefined>(null);
  const fetchingRef = useRef(false);
  const hasInitialFetchRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUltimosGastos = async () => {
      // Validar usuarioId
      if (!usuarioId) {
        return;
      }

      // Prevenir peticiones simultáneas duplicadas
      if (fetchingRef.current) {
        return;
      }
      
      // Si hay caché del mismo usuario, no recargar
      const hasCache = cachedUltimosGastos.length > 0 && cachedUltimosGastosUsuarioId === usuarioId;
      if (hasCache) {
        return;
      }

      fetchingRef.current = true;
      lastUsuarioIdRef.current = usuarioId;

      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<UltimoGasto[]>(
          `/transacciones/usuario/${usuarioId}/ultimos-gastos`
        );

        if (isMountedRef.current) {
          // Transformar los datos para que tengan el objeto categoria
          const gastosTransformados = data.map(gasto => ({
            ...gasto,
            categoria: {
              nombre: gasto.nombreCategoria || 'Sin categoría',
              icono: gasto.iconoCategoria || 'pricetag-outline',
              color: gasto.colorCategoria || '#FF9500'
            }
          }));
          
          // Actualizar caché
          cachedUltimosGastos = gastosTransformados;
          cachedUltimosGastosUsuarioId = usuarioId;
          
          setGastos(gastosTransformados);
          hasInitialFetchRef.current = true;
        }
      } catch (err: any) {
        if (err.message === 'CANCELED') {
          return;
        }

        console.error('❌ Error obteniendo últimos gastos:', err);
        if (isMountedRef.current) {
          setError(err.response?.data?.message || 'Error al cargar últimos gastos');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        fetchingRef.current = false;
      }
    };

    fetchUltimosGastos();
  }, [usuarioId]);
  
  // Escuchar evento de refresh del dashboard
  useEffect(() => {
    const unsubscribe = eventEmitter.on(APP_EVENTS.DASHBOARD_REFRESH, () => {
      refetch();
    });
    
    return () => {
      unsubscribe();
    };
  }, [usuarioId]);
  
  const refetch = async () => {
    if (usuarioId) {
      hasInitialFetchRef.current = false;
      fetchingRef.current = false;
      lastUsuarioIdRef.current = null;
      
      // Forzar recarga
      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);
      
      try {
        const data = await apiClient.get<UltimoGasto[]>(
          `/transacciones/usuario/${usuarioId}/ultimos-gastos`
        );

        if (isMountedRef.current) {
          const gastosTransformados = data.map(gasto => ({
            ...gasto,
            categoria: {
              nombre: gasto.nombreCategoria || 'Sin categoría',
              icono: gasto.iconoCategoria || 'pricetag-outline',
              color: gasto.colorCategoria || '#FF9500'
            }
          }));
          
          cachedUltimosGastos = gastosTransformados;
          cachedUltimosGastosUsuarioId = usuarioId;
          
          setGastos(gastosTransformados);
        }
      } catch (err: any) {
        if (err.message !== 'CANCELED' && isMountedRef.current) {
          setError(err.response?.data?.message || 'Error al cargar últimos gastos');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }
  };

  return { gastos, loading, error, refetch };
};
