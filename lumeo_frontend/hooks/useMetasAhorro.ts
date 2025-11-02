import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api-client';

export interface MetaAhorro {
  id: number;
  titulo: string;
  cantidadObjetivo: number;
  cantidadActual: number;
  idUsuario: number;
  fechaCreacion: string;
  fechaModificacion: string;
}

export function useMetasAhorro() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<MetaAhorro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetas = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<MetaAhorro[]>(
        `/metas-ahorro/usuario/uid/${user.id}`
      );

      setMetas(response);
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err?.message === 'CANCELED' || err?.canceled) {
        console.log('Petición de metas cancelada (es normal)');
        setLoading(false);
        return;
      }
      
      console.error('Error al cargar metas de ahorro:', err);
      setError('No se pudieron cargar las metas de ahorro');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetas();
  }, [user?.id]);

  return {
    metas,
    loading,
    error,
    refetch: fetchMetas,
  };
}
