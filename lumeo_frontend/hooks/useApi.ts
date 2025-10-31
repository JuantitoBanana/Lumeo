import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '../types/api';

/**
 * Hook personalizado para manejar operaciones de API con estado de carga y errores
 */
export function useApi<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const execute = useCallback(async (apiCall: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Error desconocido',
        status: err.status || 0,
        error: err,
      };
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook para manejar listas de datos con operaciones CRUD
 */
export function useApiList<T extends { id?: number }>() {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const setItemsData = useCallback((data: T[]) => {
    setItems(data);
  }, []);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: number, updatedItem: T) => {
    setItems(prev => prev.map(item => 
      item.id === id ? updatedItem : item
    ));
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const execute = useCallback(async (apiCall: () => Promise<T[]>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      setItems(result);
      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Error desconocido',
        status: err.status || 0,
        error: err,
      };
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeAction = useCallback(async <R>(
    apiCall: () => Promise<R>,
    onSuccess?: (result: R) => void
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall();
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err: any) {
      const apiError: ApiError = {
        message: err.message || 'Error desconocido',
        status: err.status || 0,
        error: err,
      };
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    items,
    loading,
    error,
    execute,
    executeAction,
    addItem,
    updateItem,
    removeItem,
    setItems: setItemsData,
    reset,
  };
}

/**
 * Hook específico para usuarios
 */
export function useUsuarios() {
  const api = useApiList<any>();
  
  return {
    ...api,
    // Aquí puedes agregar métodos específicos para usuarios
  };
}

/**
 * Hook específico para transacciones
 */
export function useTransacciones() {
  const api = useApiList<any>();
  
  return {
    ...api,
    // Aquí puedes agregar métodos específicos para transacciones
  };
}