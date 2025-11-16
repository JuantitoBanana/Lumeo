import { apiClient } from '../lib/api-client';

export interface TransaccionIndividualRequest {
  idUsuario: number;
  importe: number;
}

export interface CrearTransaccionGrupalRequest {
  titulo: string;
  importeTotal: number;
  fechaTransaccion: string; // Format: YYYY-MM-DD
  nota?: string | null;
  idGrupo: number;
  idCategoria?: number | null;
  idTipo: number;
  idAdjunto?: number | null;
  transaccionesIndividuales: TransaccionIndividualRequest[];
}

export interface TransaccionGrupal {
  id: number;
  titulo: string;
  importe: number;
  importeOriginal: number;
  fechaTransaccion: string;
  nota?: string;
  idGrupo: number;
  nombreGrupo?: string;
  idCategoria?: number;
  nombreCategoria?: string;
  idTipo: number;
  nombreTipo?: string;
  idAdjunto?: number;
  idDivisaOriginal?: number;
  codigoDivisaOriginal?: string;
  posicionSimbolo?: string;
  transaccionesIndividuales?: TransaccionIndividual[];
}

export interface TransaccionIndividual {
  id: number;
  titulo: string;
  importe: number;
  fechaTransaccion: string;
  nota?: string;
  idUsuario: number;
  nombreUsuario?: string;
  nombre?: string;
  apellido?: string;
  idCategoria?: number;
  idTipo: number;
  idEstado?: number;
  idAdjunto?: number;
  idDestinatario?: number;
  importeDestinatario?: number;
  posicionSimbolo?: string;
}

/**
 * Servicio para manejar las operaciones de Transacciones Grupales
 * Endpoints: /api/transacciones-grupales
 */
export class TransaccionGrupalService {
  private readonly endpoint = '/transacciones-grupales';

  /**
   * Crea una transacción grupal con las transacciones individuales asociadas
   */
  async crear(data: CrearTransaccionGrupalRequest): Promise<any> {
    return apiClient.post(`${this.endpoint}`, data);
  }

  /**
   * Obtiene todas las transacciones grupales de un grupo
   */
  async getByGrupo(idGrupo: number, idUsuario: number): Promise<TransaccionGrupal[]> {
    return apiClient.get<TransaccionGrupal[]>(`${this.endpoint}/grupo/${idGrupo}?idUsuario=${idUsuario}`);
  }

  /**
   * Obtiene una transacción grupal por ID
   */
  async getById(id: number): Promise<TransaccionGrupal> {
    return apiClient.get<TransaccionGrupal>(`${this.endpoint}/${id}`);
  }

  /**
   * Obtiene el detalle completo de una transacción grupal con las transacciones individuales
   */
  async getByIdConDetalle(id: number, idUsuario: number): Promise<TransaccionGrupal> {
    return apiClient.get<TransaccionGrupal>(`${this.endpoint}/${id}/detalle?idUsuario=${idUsuario}`);
  }

  /**
   * Elimina una transacción grupal
   */
  async delete(id: number): Promise<void> {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

// Exportar instancia singleton
export const transaccionGrupalService = new TransaccionGrupalService();
