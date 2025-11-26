import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api-client';

export interface Presupuesto {
  id: number;
  mes: string;
  anio: string;
  cantidad: number;
  totalGastos?: number;
  idUsuario: number;
  fechaCreacion: string;
  fechaModificacion: string;
}

export function usePresupuestos() {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPresupuestos = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<Presupuesto[]>(
        `/presupuestos/usuario/uid/${user.id}`
      );

      setPresupuestos(response);
    } catch (err: any) {
      // Ignorar errores de cancelación
      if (err?.message === 'CANCELED' || err?.canceled) {
        setLoading(false);
        return;
      }
      
      console.error('Error al cargar presupuestos:', err);
      setError('No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresupuestos();
  }, [user?.id]);

  return {
    presupuestos,
    loading,
    error,
    refetch: fetchPresupuestos,
  };
}
