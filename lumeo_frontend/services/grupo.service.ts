import { apiClient } from '../lib/api-client';
import { Grupo } from '../types/api';

/**
 * Servicio para manejar las operaciones de Grupo
 * Endpoints: /api/grupos
 */
export class GrupoService {
  private readonly endpoint = '/grupos';

  /**
   * Obtiene todos los grupos
   */
  async getAll(): Promise<Grupo[]> {
    return apiClient.get<Grupo[]>(this.endpoint);
  }

  /**
   * Obtiene un grupo por ID
   */
  async getById(id: number): Promise<Grupo> {
    return apiClient.get<Grupo>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea un nuevo grupo
   */
  async create(grupo: Omit<Grupo, 'id'>): Promise<Grupo> {
    return apiClient.post<Grupo>(this.endpoint, grupo);
  }

  /**
   * Actualiza un grupo existente
   */
  async update(id: number, grupo: Partial<Grupo>): Promise<Grupo> {
    return apiClient.put<Grupo>(`${this.endpoint}/${id}`, grupo);
  }

  /**
   * Elimina un grupo
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

// Exportar instancia singleton
export const grupoService = new GrupoService();