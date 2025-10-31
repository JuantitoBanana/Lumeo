import { apiClient } from '../lib/api-client';
import { MetaAhorro } from '../types/api';

/**
 * Servicio para manejar las operaciones de Meta de Ahorro
 * Endpoints: /api/metas-ahorro
 */
export class MetaAhorroService {
  private readonly endpoint = '/metas-ahorro';

  /**
   * Obtiene todas las metas de ahorro
   */
  async getAll(): Promise<MetaAhorro[]> {
    return apiClient.get<MetaAhorro[]>(this.endpoint);
  }

  /**
   * Obtiene una meta de ahorro por ID
   */
  async getById(id: number): Promise<MetaAhorro> {
    return apiClient.get<MetaAhorro>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea una nueva meta de ahorro
   */
  async create(meta: Omit<MetaAhorro, 'id' | 'montoActual'>): Promise<MetaAhorro> {
    return apiClient.post<MetaAhorro>(this.endpoint, meta);
  }

  /**
   * Actualiza una meta de ahorro existente
   */
  async update(id: number, meta: Partial<MetaAhorro>): Promise<MetaAhorro> {
    return apiClient.put<MetaAhorro>(`${this.endpoint}/${id}`, meta);
  }

  /**
   * Elimina una meta de ahorro
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene metas de ahorro por usuario
   */
  async getByUsuario(idUsuario: number): Promise<MetaAhorro[]> {
    return apiClient.get<MetaAhorro[]>(`${this.endpoint}?idUsuario=${idUsuario}`);
  }

  /**
   * Obtiene metas de ahorro activas
   */
  async getActivas(): Promise<MetaAhorro[]> {
    const now = new Date().toISOString().split('T')[0];
    return apiClient.get<MetaAhorro[]>(`${this.endpoint}?fechaObjetivo_gte=${now}`);
  }

  /**
   * Actualiza el progreso de una meta de ahorro
   */
  async actualizarProgreso(id: number, montoActual: number): Promise<MetaAhorro> {
    return apiClient.patch<MetaAhorro>(`${this.endpoint}/${id}/progreso`, { montoActual });
  }
}

// Exportar instancia singleton
export const metaAhorroService = new MetaAhorroService();