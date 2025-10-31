import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';

export interface UltimoGasto {
  id: number;
  titulo: string;
  importe: number;
  fechaTransaccion: string;
  nota?: string;
  idCategoria?: number;
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
        console.log('⏭️ UsuarioId no válido para últimos gastos:', usuarioId);
        return;
      }

      // Skip si el usuarioId no ha cambiado
      if (lastUsuarioIdRef.current === usuarioId) {
        console.log('⏭️ UsuarioId no cambió, saltando refetch de últimos gastos');
        return;
      }

      // Prevenir peticiones simultáneas duplicadas
      if (fetchingRef.current) {
        console.log('⏭️ Ya hay una petición de últimos gastos en curso, saltando...');
        return;
      }

      fetchingRef.current = true;
      lastUsuarioIdRef.current = usuarioId;

      console.log('🚀 useUltimosGastos: Obteniendo últimos gastos para usuario', usuarioId);

      if (!isMountedRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.get<UltimoGasto[]>(
          `/transacciones/usuario/${usuarioId}/ultimos-gastos`
        );

        if (isMountedRef.current) {
          setGastos(data);
          console.log('✅ Últimos gastos obtenidos:', data.length);
        }
      } catch (err: any) {
        if (err.message === 'CANCELED') {
          console.log('🔄 Petición de últimos gastos cancelada');
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
