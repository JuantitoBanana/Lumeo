import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { APP_URL } from '../constants/config';
import { apiClient } from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  checkUsernameExists: (username: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
  signUp: (email: string, password: string, userData: UserMetadata) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

interface UserMetadata {
  firstName: string;
  lastName: string;
  username: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Check if a username already exists in the database
   */
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      console.log('🔍 Verificando username en backend:', username);
      const response: any = await apiClient.get(`/public/check-username/${username}`);
      console.log('📦 Respuesta del backend:', response.data);
      
      if (response.data && typeof response.data.exists === 'boolean') {
        console.log(`✅ Username "${username}" existe: ${response.data.exists}`);
        return response.data.exists;
      }
      
      console.warn('⚠️ Respuesta del backend no válida, asumiendo que NO existe');
      return false;
    } catch (error: any) {
      console.error('❌ Error al conectar con el backend:', error?.response?.status || error.message);
      console.error('💡 Tip: Verifica que el backend esté corriendo en el puerto correcto');
      // IMPORTANTE: Si hay error de conexión, retornamos false
      // Pero el trigger de Supabase será la última línea de defensa
      return false;
    }
  };

  /**
   * Check if an email already exists in the database
   */
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      console.log('🔍 Verificando email en backend:', email);
      const response: any = await apiClient.get(`/public/check-email/${email}`);
      console.log('📦 Respuesta del backend:', response.data);
      
      if (response.data && typeof response.data.exists === 'boolean') {
        console.log(`✅ Email "${email}" existe: ${response.data.exists}`);
        return response.data.exists;
      }
      
      console.warn('⚠️ Respuesta del backend no válida, asumiendo que NO existe');
      return false;
    } catch (error: any) {
      console.error('❌ Error al conectar con el backend:', error?.response?.status || error.message);
      // IMPORTANTE: Si hay error de conexión, retornamos false
      // Pero el trigger de Supabase será la última línea de defensa
      return false;
    }
  };

  /**
   * Sign Up Function
   * Creates a new user in Supabase Auth (auth.users table)
   * The trigger will automatically create the record in public.usuario
   * 
   * NOTE: Uses Spanish field names to match your existing database schema:
   * - nombre (first name)
   * - apellido (last name)
   * - nombre_usuario (username)
   * - idioma (language)
   */
  const signUp = async (email: string, password: string, userData: UserMetadata) => {
    try {
      const { data, error} = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${APP_URL}/public/email-success`,
          data: {
            nombre: userData.firstName,           // Spanish: first name
            apellido: userData.lastName,          // Spanish: last name
            nombre_usuario: userData.username,    // Spanish: username
            idioma: 'es',                         // Spanish: language (default to Spanish)
          },
        },
      });

      console.log('📦 Respuesta completa de signUp:', JSON.stringify(data));
      
      // IMPORTANTE: Supabase NO lanza error cuando el email ya existe por seguridad
      // En su lugar, retorna user con identities vacío
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        console.warn('⚠️ Usuario ya existe - identities está vacío');
        return { error: { message: 'Este correo electrónico ya está registrado. Por favor, usa otro o inicia sesión.' } };
      }

      if (error) {
        console.error('❌ Error de Supabase:', error.message);
        console.error('❌ Error completo:', JSON.stringify(error));
        
        // Detectar errores específicos del trigger de Supabase
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('nombre de usuario') || errorMsg.includes('username')) {
          return { error: { message: 'Este nombre de usuario ya está en uso. Por favor, elige otro.' } };
        }
        
        if (errorMsg.includes('correo') || errorMsg.includes('email')) {
          return { error: { message: 'Este correo electrónico ya está registrado. Por favor, usa otro.' } };
        }
        
        if (errorMsg.includes('database error') || errorMsg.includes('saving new user')) {
          return { error: { message: 'El nombre de usuario o correo electrónico ya están en uso. Por favor, verifica los datos.' } };
        }
        
        throw error;
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ Error en catch:', error.message);
      
      // Detectar errores de duplicados
      if (error.message) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('nombre de usuario') || errorMsg.includes('username')) {
          return { error: { message: 'Este nombre de usuario ya está en uso. Por favor, elige otro.' } };
        }
        
        if (errorMsg.includes('correo') || errorMsg.includes('email')) {
          return { error: { message: 'Este correo electrónico ya está registrado. Por favor, usa otro.' } };
        }
        
        if (errorMsg.includes('database error') || errorMsg.includes('saving new user')) {
          return { error: { message: 'El nombre de usuario o correo electrónico ya están en uso. Por favor, verifica los datos.' } };
        }
      }
      
      return { error };
    }
  };

  /**
   * Sign In Function
   * Authenticates an existing user with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      return { error };
    }
  };

  /**
   * Sign Out Function
   * Logs out the current user
   */
  const signOut = async () => {
    try {
      console.log('🚪 [Auth] Iniciando signOut...');
      
      // Limpiar estado local PRIMERO (para evitar bloqueos si Supabase falla)
      setUser(null);
      setSession(null);
      console.log('✅ [Auth] Estado local limpiado');
      
      // Intentar logout en Supabase (puede fallar si hay problemas de red)
      await supabase.auth.signOut();
      console.log('✅ [Auth] SignOut de Supabase completado');
    } catch (error: any) {
      // Aunque falle el logout en Supabase, el estado local ya está limpio
      console.warn('⚠️ [Auth] Error en signOut de Supabase (estado local ya limpiado):', error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    checkUsernameExists,
    checkEmailExists,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the auth context
 * Use this in your components to access auth functions and state
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
