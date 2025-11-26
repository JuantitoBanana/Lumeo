import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

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

export const useUltimosGastos = (usuarioId: number | null | undefined) => {
  const [gastos, setGastos] = useState<UltimoGasto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastUsuarioIdRef = useRef<number | null | undefined>(null);
  const fetchingRef = useRef(false);

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

      // Skip si el usuarioId no ha cambiado
      if (lastUsuarioIdRef.current === usuarioId) {
        return;
      }

      // Prevenir peticiones simultáneas duplicadas
      if (fetchingRef.current) {
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
              color: gasto.colorCategoria || '#007AFF'
            }
          }));
          
          setGastos(gastosTransformados);
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

  return { gastos, loading, error };
};
