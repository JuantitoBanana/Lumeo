import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../constants/config';
import { ApiError } from '../types/api';

/**
 * Gestiona el encolado de peticiones HTTP para evitar sobrecarga
 */
class RequestQueue {
  private queue: Array<{ key: string; fn: () => Promise<any> }> = [];
  private pending = 0;
  private maxConcurrent = 3; // Máximo 3 peticiones simultáneas
  private activeRequests = new Set<string>();

  async add<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Solo rechazar si la petición está ACTIVA (en progreso), no si está en cola esperando
    if (this.activeRequests.has(key)) {
      console.log('⏭️ Petición duplicada descartada (ya en ejecución):', key);
      throw new Error('CANCELED');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        key,
        fn: async () => {
          try {
            this.pending++;
            this.activeRequests.add(key);
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.pending--;
            this.activeRequests.delete(key);
            this.processNext();
          }
        }
      });
      
      this.processNext();
    });
  }

  private processNext() {
    if (this.pending < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next.fn();
    }
  }

  clear() {
    this.queue = [];
    this.activeRequests.clear();
  }
}

/**
 * Cliente HTTP base configurado para la API de Lumeo
 */
class ApiClient {
  private client: AxiosInstance;
  private requestQueue = new RequestQueue();
  private pendingRequests = new Map<string, AbortController>();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`✅ ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        // Si fue cancelada, no loguear como error
        if (axios.isCancel(error)) {
          console.log('🔄 Petición cancelada:', error.message);
          return Promise.reject({ message: 'CANCELED', canceled: true });
        }

        console.error('❌ Response error:', error);
        
        const apiError: ApiError = {
          message: error.response?.data?.message || error.message || 'Error de conexión',
          status: error.response?.status || 0,
          error: error.response?.data || error,
        };

        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Cancela peticiones pendientes duplicadas antes de hacer una nueva
   */
  private cancelDuplicateRequest(key: string) {
    const existing = this.pendingRequests.get(key);
    if (existing) {
      console.log('🔄 Cancelando petición duplicada:', key);
      existing.abort();
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Registra una nueva petición con su AbortController
   */
  private registerRequest(key: string, config: AxiosRequestConfig): AxiosRequestConfig {
    this.cancelDuplicateRequest(key);
    
    const controller = new AbortController();
    this.pendingRequests.set(key, controller);
    
    return {
      ...config,
      signal: controller.signal,
    };
  }

  /**
   * Limpia una petición completada
   */
  private cleanupRequest(key: string) {
    this.pendingRequests.delete(key);
  }

  // Métodos HTTP básicos con encolado y cancelación
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = `GET:${url}`;
    
    return this.requestQueue.add(requestKey, async () => {
      try {
        // Para GET no cancelamos duplicados, solo usamos AbortController para timeout
        const controller = new AbortController();
        const requestConfig = {
          ...config,
          signal: controller.signal,
        };
        
        const response = await this.client.get<T>(url, requestConfig);
        return response.data;
      } catch (error: any) {
        if (error.canceled) {
          throw new Error('CANCELED');
        }
        throw error;
      }
    });
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = `POST:${url}`;
    
    return this.requestQueue.add(requestKey, async () => {
      try {
        const requestConfig = this.registerRequest(requestKey, config || {});
        const response = await this.client.post<T>(url, data, requestConfig);
        this.cleanupRequest(requestKey);
        return response.data;
      } catch (error: any) {
        this.cleanupRequest(requestKey);
        if (error.canceled) {
          throw new Error('CANCELED');
        }
        throw error;
      }
    });
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = `PUT:${url}`;
    
    return this.requestQueue.add(requestKey, async () => {
      try {
        const requestConfig = this.registerRequest(requestKey, config || {});
        const response = await this.client.put<T>(url, data, requestConfig);
        this.cleanupRequest(requestKey);
        return response.data;
      } catch (error: any) {
        this.cleanupRequest(requestKey);
        if (error.canceled) {
          throw new Error('CANCELED');
        }
        throw error;
      }
    });
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = `DELETE:${url}`;
    
    return this.requestQueue.add(requestKey, async () => {
      try {
        const requestConfig = this.registerRequest(requestKey, config || {});
        const response = await this.client.delete<T>(url, requestConfig);
        this.cleanupRequest(requestKey);
        return response.data;
      } catch (error: any) {
        this.cleanupRequest(requestKey);
        if (error.canceled) {
          throw new Error('CANCELED');
        }
        throw error;
      }
    });
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const requestKey = `PATCH:${url}`;
    
    return this.requestQueue.add(requestKey, async () => {
      try {
        const requestConfig = this.registerRequest(requestKey, config || {});
        const response = await this.client.patch<T>(url, data, requestConfig);
        this.cleanupRequest(requestKey);
        return response.data;
      } catch (error: any) {
        this.cleanupRequest(requestKey);
        if (error.canceled) {
          throw new Error('CANCELED');
        }
        throw error;
      }
    });
  }

  // Método para establecer el token de autenticación
  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Método para cancelar todas las peticiones pendientes
  cancelAllRequests() {
    console.log('🔄 Cancelando todas las peticiones pendientes');
    this.pendingRequests.forEach((controller) => controller.abort());
    this.pendingRequests.clear();
    this.requestQueue.clear();
  }

  // Método para obtener la instancia de axios si necesitas más control
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Exportar una instancia singleton
export const apiClient = new ApiClient();
export default apiClient;