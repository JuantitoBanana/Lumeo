import { apiClient } from '../lib/api-client';
import { Presupuesto } from '../types/api';

/**
 * Servicio para manejar las operaciones de Presupuesto
 * Endpoints: /api/presupuestos
 */
export class PresupuestoService {
  private readonly endpoint = '/presupuestos';

  /**
   * Obtiene todos los presupuestos
   */
  async getAll(): Promise<Presupuesto[]> {
    return apiClient.get<Presupuesto[]>(this.endpoint);
  }

  /**
   * Obtiene un presupuesto por ID
   */
  async getById(id: number): Promise<Presupuesto> {
    return apiClient.get<Presupuesto>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea un nuevo presupuesto
   */
  async create(presupuesto: Omit<Presupuesto, 'id'>): Promise<Presupuesto> {
    return apiClient.post<Presupuesto>(this.endpoint, presupuesto);
  }

  /**
   * Actualiza un presupuesto existente
   */
  async update(id: number, presupuesto: Partial<Presupuesto>): Promise<Presupuesto> {
    return apiClient.put<Presupuesto>(`${this.endpoint}/${id}`, presupuesto);
  }

  /**
   * Elimina un presupuesto
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene presupuestos por usuario
   */
  async getByUsuario(idUsuario: number): Promise<Presupuesto[]> {
    return apiClient.get<Presupuesto[]>(`${this.endpoint}?idUsuario=${idUsuario}`);
  }

  /**
   * Obtiene presupuestos activos
   */
  async getActivos(): Promise<Presupuesto[]> {
    const now = new Date().toISOString().split('T')[0];
    return apiClient.get<Presupuesto[]>(`${this.endpoint}?fechaInicio_lte=${now}&fechaFin_gte=${now}`);
  }

  /**
   * Obtiene presupuestos por categoría
   */
  async getByCategoria(idCategoria: number): Promise<Presupuesto[]> {
    return apiClient.get<Presupuesto[]>(`${this.endpoint}?idCategoria=${idCategoria}`);
  }
}

// Exportar instancia singleton
export const presupuestoService = new PresupuestoService();