import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { services } from '../services';
import { Usuario } from '../types/api';

/**
 * Hook personalizado para obtener el usuario completo desde la API de Java
 * usando el UID de Supabase como referencia
 */
export function useUsuarioApi() {
  const { user, session } = useAuth();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Inicializar loading en true si hay un usuario autenticado, ya que vamos a cargar sus datos
  const [loading, setLoading] = useState(!!user?.id);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (user?.id) {
      // Si el loading estaba en false (por ejemplo, al cambiar de usuario), lo ponemos en true
      if (!loading) setLoading(true);
      fetchUsuario();
    } else {
      setUsuario(null);
      setError(null);
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user?.id]);

  const fetchUsuario = async () => {
    if (!user?.id || !isMountedRef.current) return;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      // Opción 1: Buscar por UID de Supabase
      const usuarios = await services.usuario.getAll();
      
      if (!isMountedRef.current) return;
      
      const usuarioEncontrado = usuarios.find(u => u.uid === user.id);

      if (usuarioEncontrado) {
        if (isMountedRef.current) {
          setUsuario(usuarioEncontrado);
        }
      } else {
        // Opción 2: Buscar por email si no se encuentra por UID
        const usuariosPorEmail = await services.usuario.findByEmail(user.email!);
        
        if (!isMountedRef.current) return;
        
        if (usuariosPorEmail.length > 0) {
          if (isMountedRef.current) {
            setUsuario(usuariosPorEmail[0]);
          }
        } else {
          // Opción 3: Crear el usuario en la API de Java si no existe
          await crearUsuarioEnApi();
        }
      }
    } catch (err: any) {
      // No procesar si fue cancelada - pero NO retornar, seguir con el flujo
      if (err.message === 'CANCELED') {
        // Reintentar después de un pequeño delay
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchUsuario();
          }
        }, 100);
        return;
      }
      
      // Si es timeout, reintentar una vez más con delay mayor
      if (err.message?.includes('timeout')) {
        setTimeout(() => {
          if (isMountedRef.current) {
            fetchUsuario();
          }
        }, 2000);
        return;
      }
      
      console.error('Error al obtener usuario de la API:', err);
      
      if (!isMountedRef.current) return;
      
      // Verificar si es error 500 (backend)
      const isServerError = err.status === 500 || err.error?.status === 500;
      
      if (isServerError) {
        if (isMountedRef.current) {
          setError('Error del servidor. Por favor, reinicia el backend.');
        }
        console.error('❌ Error 500: El backend necesita reiniciarse');
      } else {
        if (isMountedRef.current) {
          setError(err.message || 'Error al cargar usuario');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const crearUsuarioEnApi = async () => {
    if (!user || !isMountedRef.current) return;

    try {
      const nuevoUsuario = await services.usuario.create({
        email: user.email!,
        nombre: user.user_metadata?.nombre || 'Usuario',
        apellido: user.user_metadata?.apellido || '',
        nombreUsuario: user.user_metadata?.nombre_usuario || user.email!.split('@')[0],
        idioma: user.user_metadata?.idioma || 'es',
        uid: user.id,
      });

      if (isMountedRef.current) {
        setUsuario(nuevoUsuario);
      }
    } catch (err: any) {
      console.error('Error al crear usuario en la API:', err);
      
      if (isMountedRef.current) {
        setError('Error al crear usuario');
      }
    }
  };

  const refetchUsuario = () => {
    if (user?.id) {
      fetchUsuario();
    }
  };

  return {
    usuario,
    loading,
    error,
    refetchUsuario,
  };
}