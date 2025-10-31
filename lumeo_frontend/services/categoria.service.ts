import { apiClient } from '../lib/api-client';
import { Categoria } from '../types/api';

/**
 * Servicio para manejar las operaciones de Categoría
 * Endpoints: /api/categorias
 */
export class CategoriaService {
  private readonly endpoint = '/categorias';

  /**
   * Obtiene todas las categorías
   */
  async getAll(): Promise<Categoria[]> {
    return apiClient.get<Categoria[]>(this.endpoint);
  }

  /**
   * Obtiene una categoría por ID
   */
  async getById(id: number): Promise<Categoria> {
    return apiClient.get<Categoria>(`${this.endpoint}/${id}`);
  }

  /**
   * Crea una nueva categoría
   */
  async create(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
    return apiClient.post<Categoria>(this.endpoint, categoria);
  }

  /**
   * Actualiza una categoría existente
   */
  async update(id: number, categoria: Partial<Categoria>): Promise<Categoria> {
    return apiClient.put<Categoria>(`${this.endpoint}/${id}`, categoria);
  }

  /**
   * Elimina una categoría
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Busca categorías por nombre
   */
  async searchByName(nombre: string): Promise<Categoria[]> {
    return apiClient.get<Categoria[]>(`${this.endpoint}?nombre=${encodeURIComponent(nombre)}`);
  }
}

// Exportar instancia singleton
export const categoriaService = new CategoriaService();