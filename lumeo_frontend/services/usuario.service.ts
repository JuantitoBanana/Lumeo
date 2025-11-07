import { apiClient } from '../lib/api-client';
import { Usuario } from '../types/api';

/**
 * Servicio para manejar las operaciones de Usuario
 * Endpoints: /api/usuarios
 */
export class UsuarioService {
  private readonly endpoint = '/usuarios';

  /**
   * Obtiene todos los usuarios
   */
  async getAll(): Promise<Usuario[]> {
    return apiClient.get<Usuario[]>(this.endpoint);
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(id: number): Promise<Usuario> {
    return apiClient.get<Usuario>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene un usuario por UID (Supabase UUID)
   */
  async getByUid(uid: string): Promise<Usuario> {
    return apiClient.get<Usuario>(`${this.endpoint}/uid/${uid}`);
  }

  /**
   * Crea un nuevo usuario
   */
  async create(usuario: Omit<Usuario, 'id' | 'fechaCreacion' | 'fechaModificacion'>): Promise<Usuario> {
    return apiClient.post<Usuario>(this.endpoint, usuario);
  }

  /**
   * Actualiza un usuario existente
   */
  async update(id: number, usuario: Partial<Usuario>): Promise<Usuario> {
    return apiClient.put<Usuario>(`${this.endpoint}/${id}`, usuario);
  }

  /**
   * Actualiza un usuario existente por UID
   */
  async updateByUid(uid: string, usuario: Partial<Usuario>): Promise<Usuario> {
    return apiClient.put<Usuario>(`${this.endpoint}/uid/${uid}`, usuario);
  }

  /**
   * Elimina un usuario
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Busca usuarios por email
   */
  async findByEmail(email: string): Promise<Usuario[]> {
    return apiClient.get<Usuario[]>(`${this.endpoint}?email=${encodeURIComponent(email)}`);
  }

  /**
   * Busca usuarios por nombre de usuario
   */
  async findByUsername(username: string): Promise<Usuario[]> {
    return apiClient.get<Usuario[]>(`${this.endpoint}?nombreUsuario=${encodeURIComponent(username)}`);
  }

  /**
   * Busca un usuario por su nombre de usuario exacto
   */
  async getByNombreUsuario(nombreUsuario: string): Promise<Usuario> {
    return apiClient.get<Usuario>(`${this.endpoint}/nombre-usuario/${encodeURIComponent(nombreUsuario)}`);
  }
}

// Exportar instancia singleton
export const usuarioService = new UsuarioService();