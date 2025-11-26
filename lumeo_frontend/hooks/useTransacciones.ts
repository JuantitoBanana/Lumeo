import { useState, useEffect, useRef } from 'react';
import { services } from '../services';
import { Transaccion } from '../types/api';

/**
 * Hook personalizado para obtener las transacciones de un usuario
 */
export function useTransacciones(idUsuario: number | null | undefined) {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (idUsuario) {
      fetchTransacciones();
    } else {
      setTransacciones([]);
      setError(null);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [idUsuario]);

  const fetchTransacciones = async () => {
    if (!idUsuario || !isMountedRef.current) return;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = await services.transaccion.getByUsuario(idUsuario);

      if (!isMountedRef.current) return;

      // Ordenar por fecha (más recientes primero)
      const transaccionesOrdenadas = data.sort((a, b) => {
        return new Date(b.fechaTransaccion).getTime() - new Date(a.fechaTransaccion).getTime();
      });

      if (isMountedRef.current) {
        setTransacciones(transaccionesOrdenadas);
      }
    } catch (err: any) {
      // No procesar si fue cancelada
      if (err.message === 'CANCELED') {
        return;
      }

      console.error('Error al obtener transacciones:', err);

      if (!isMountedRef.current) return;

      const isServerError = err.status === 500 || err.error?.status === 500;

      if (isServerError) {
        if (isMountedRef.current) {
          setError('Error del servidor. Por favor, reinicia el backend.');
        }
      } else {
        if (isMountedRef.current) {
          setError(err.message || 'Error al cargar transacciones');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refetchTransacciones = () => {
    if (idUsuario) {
      fetchTransacciones();
    }
  };

  return {
    transacciones,
    loading,
    error,
    refetchTransacciones,
  };
}
