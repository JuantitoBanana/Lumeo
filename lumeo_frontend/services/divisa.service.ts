import apiClient from '@/lib/api-client';

export interface Divisa {
  id: number;
  descripcion: string;
  iso: string;
  simbolo?: string;
  posicionSimbolo?: string; // "ANTES" o "DESPUES"
}

export const DivisaService = {
  /**
   * Obtiene todas las divisas disponibles
   */
  getAll: async (): Promise<Divisa[]> => {
    const response = await apiClient.get<Divisa[]>('/divisas');
    return response;
  },

  /**
   * Obtiene una divisa por su ID
   */
  getById: async (id: number): Promise<Divisa> => {
    const response = await apiClient.get<Divisa>(`/divisas/${id}`);
    return response;
  },
};
