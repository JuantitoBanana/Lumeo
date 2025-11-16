import { useState, useEffect, useRef } from 'react';
import { grupoService, GrupoConMiembros } from '../services/grupo.service';
import { useUsuarioApi } from './useUsuarioApi';

export function useGrupos() {
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const [grupos, setGrupos] = useState<GrupoConMiembros[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchGrupos = async () => {
    if (!usuario?.id) {
      setGrupos([]);
      return;
    }

    if (!isMountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const data = await grupoService.obtenerGruposDeUsuario(usuario.id);
      
      if (!isMountedRef.current) return;
      
      setGrupos(data);
    } catch (err: any) {
      console.error('Error al cargar grupos:', err);
      
      if (!isMountedRef.current) return;
      
      setError(err.message || 'Error al cargar los grupos');
      setGrupos([]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    // Solo intentar cargar si tenemos usuario y no está cargando
    if (usuario?.id && !loadingUsuario) {
      fetchGrupos();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [usuario?.id, loadingUsuario]);

  const refetch = () => {
    if (usuario?.id) {
      fetchGrupos();
    }
  };

  return {
    grupos,
    loading: loading || loadingUsuario,
    error,
    refetch,
  };
}
