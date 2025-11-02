import { apiClient } from '../lib/api-client';
import { Transaccion } from '../types/api';

/**
 * Servicio para manejar las operaciones de Transacción
 * Endpoints: /api/transacciones
 */
export class TransaccionService {
  private readonly endpoint = '/transacciones';

  /**
   * Obtiene todas las transacciones
   */
  async getAll(): Promise<Transaccion[]> {
    return apiClient.get<Transaccion[]>(this.endpoint);
  }

  /**
   * Obtiene una transacción por ID
   */
  async getById(id: number): Promise<Transaccion> {
    return apiClient.get<Transaccion>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea una nueva transacción
   */
  async create(transaccion: Omit<Transaccion, 'id'>): Promise<Transaccion> {
    return apiClient.post<Transaccion>(this.endpoint, transaccion);
  }

  /**
   * Actualiza una transacción existente
   */
  async update(id: number, transaccion: Partial<Transaccion>): Promise<Transaccion> {
    return apiClient.put<Transaccion>(`${this.endpoint}/${id}`, transaccion);
  }

  /**
   * Elimina una transacción
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene transacciones por usuario
   */
  async getByUsuario(idUsuario: number): Promise<Transaccion[]> {
    return apiClient.get<Transaccion[]>(`${this.endpoint}/usuario/${idUsuario}`);
  }

  /**
   * Obtiene transacciones por categoría
   */
  async getByCategoria(idCategoria: number): Promise<Transaccion[]> {
    return apiClient.get<Transaccion[]>(`${this.endpoint}?idCategoria=${idCategoria}`);
  }

  /**
   * Obtiene transacciones por rango de fechas
   */
  async getByDateRange(fechaInicio: string, fechaFin: string): Promise<Transaccion[]> {
    return apiClient.get<Transaccion[]>(
      `${this.endpoint}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
  }

  /**
   * Obtiene transacciones por tipo
   */
  async getByTipo(idTipo: number): Promise<Transaccion[]> {
    return apiClient.get<Transaccion[]>(`${this.endpoint}?idTipo=${idTipo}`);
  }

  /**
   * Obtiene el resumen de transacciones por usuario
   */
  async getResumenByUsuario(idUsuario: number): Promise<{
    totalIngresos: number;
    totalGastos: number;
    balance: number;
    cantidadTransacciones: number;
  }> {
    return apiClient.get(`${this.endpoint}/resumen/${idUsuario}`);
  }
}

// Exportar instancia singleton
export const transaccionService = new TransaccionService();