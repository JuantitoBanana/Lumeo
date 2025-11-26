import apiClient from '@/lib/api-client';

export interface Divisa {
  id: number;
  descripcion: string;
  iso: string;
  simbolo?: string;
  posicionSimbolo?: string; // "ANTES" o "DESPUES"
}

// Caché en memoria para divisas (no cambian frecuentemente)
let divisasCache: Divisa[] | null = null;
let divisaCacheById: Map<number, Divisa> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const DivisaService = {
  /**
   * Obtiene todas las divisas disponibles (con caché)
   */
  getAll: async (): Promise<Divisa[]> => {
    const now = Date.now();
    
    // Si hay caché válida, retornarla inmediatamente
    if (divisasCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return divisasCache;
    }
    
    const response = await apiClient.get<Divisa[]>('/divisas');
    
    // Actualizar caché
    divisasCache = response;
    cacheTimestamp = now;
    
    // Actualizar caché por ID
    response.forEach(divisa => {
      divisaCacheById.set(divisa.id, divisa);
    });
    
    return response;
  },

  /**
   * Obtiene una divisa por su ID (con caché)
   */
  getById: async (id: number): Promise<Divisa> => {
    const now = Date.now();
    
    // Si hay caché válida para este ID, retornarla
    if (divisaCacheById.has(id) && (now - cacheTimestamp) < CACHE_DURATION) {
      return divisaCacheById.get(id)!;
    }
    
    const response = await apiClient.get<Divisa>(`/divisas/${id}`);
    
    // Actualizar caché
    divisaCacheById.set(id, response);
    cacheTimestamp = now;
    
    return response;
  },

  /**
   * Limpia el caché de divisas
   */
  clearCache: () => {
    divisasCache = null;
    divisaCacheById.clear();
    cacheTimestamp = 0;
  }
};
