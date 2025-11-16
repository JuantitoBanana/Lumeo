import { apiClient } from '../lib/api-client';
import { Grupo } from '../types/api';

export interface VerificarUsuarioResponse {
  nombreUsuario: string;
  existe: boolean;
  idUsuario: number | null;
  nombre: string | null;
  apellido: string | null;
}

export interface CrearGrupoRequest {
  nombre: string;
  descripcion: string;
  nombresUsuarios: string[];
}

export interface MiembroGrupo {
  idUsuario: number;
  nombreUsuario: string;
  nombre: string;
  apellido: string;
  email: string;
}

export interface GrupoConMiembros {
  grupo: Grupo;
  miembros: MiembroGrupo[];
}

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

  /**
   * Verifica si un usuario existe por nombre de usuario
   */
  async verificarUsuario(nombreUsuario: string): Promise<VerificarUsuarioResponse> {
    return apiClient.get<VerificarUsuarioResponse>(`${this.endpoint}/verificar-usuario/${nombreUsuario}`);
  }

  /**
   * Crea un grupo con usuarios
   */
  async crearGrupoConUsuarios(
    crearGrupoRequest: CrearGrupoRequest,
    idUsuarioCreador: number
  ): Promise<GrupoConMiembros> {
    return apiClient.post<GrupoConMiembros>(
      `${this.endpoint}/crear-con-usuarios?idUsuarioCreador=${idUsuarioCreador}`,
      crearGrupoRequest
    );
  }

  /**
   * Obtiene un grupo con sus miembros
   */
  async obtenerGrupoConMiembros(id: number): Promise<GrupoConMiembros> {
    return apiClient.get<GrupoConMiembros>(`${this.endpoint}/${id}/con-miembros`);
  }

  /**
   * Obtiene todos los grupos de un usuario
   */
  async obtenerGruposDeUsuario(idUsuario: number): Promise<GrupoConMiembros[]> {
    return apiClient.get<GrupoConMiembros[]>(`${this.endpoint}/usuario/${idUsuario}`);
  }

  /**
   * Añade un miembro a un grupo existente
   * TODO: Implementar endpoint en el backend
   */
  async agregarMiembroAGrupo(idGrupo: number, nombreUsuario: string): Promise<void> {
    return apiClient.post<void>(`${this.endpoint}/${idGrupo}/agregar-miembro`, { nombreUsuario });
  }

  /**
   * Elimina un miembro de un grupo
   * TODO: Implementar endpoint en el backend
   */
  async eliminarMiembroDeGrupo(idGrupo: number, idUsuario: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${idGrupo}/miembro/${idUsuario}`);
  }
}

// Exportar instancia singleton
export const grupoService = new GrupoService();