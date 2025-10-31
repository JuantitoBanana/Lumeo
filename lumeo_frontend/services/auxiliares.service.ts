import { apiClient } from '../lib/api-client';
import { Divisa, TipoTransaccion, EstadoTransaccion, Adjunto } from '../types/api';

/**
 * Servicio para manejar las operaciones de Divisa
 * Endpoints: /api/divisas
 */
export class DivisaService {
  private readonly endpoint = '/divisas';

  async getAll(): Promise<Divisa[]> {
    return apiClient.get<Divisa[]>(this.endpoint);
  }

  async getById(id: number): Promise<Divisa> {
    return apiClient.get<Divisa>(`${this.endpoint}/${id}`);
  }

  async create(divisa: Omit<Divisa, 'id'>): Promise<Divisa> {
    return apiClient.post<Divisa>(this.endpoint, divisa);
  }

  async update(id: number, divisa: Partial<Divisa>): Promise<Divisa> {
    return apiClient.put<Divisa>(`${this.endpoint}/${id}`, divisa);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  async getByCodigo(codigo: string): Promise<Divisa> {
    return apiClient.get<Divisa>(`${this.endpoint}/codigo/${codigo}`);
  }
}

/**
 * Servicio para manejar las operaciones de Tipo de Transacción
 * Endpoints: /api/tipos-transaccion
 */
export class TipoTransaccionService {
  private readonly endpoint = '/tipos-transaccion';

  async getAll(): Promise<TipoTransaccion[]> {
    return apiClient.get<TipoTransaccion[]>(this.endpoint);
  }

  async getById(id: number): Promise<TipoTransaccion> {
    return apiClient.get<TipoTransaccion>(`${this.endpoint}/${id}`);
  }

  async create(tipo: Omit<TipoTransaccion, 'id'>): Promise<TipoTransaccion> {
    return apiClient.post<TipoTransaccion>(this.endpoint, tipo);
  }

  async update(id: number, tipo: Partial<TipoTransaccion>): Promise<TipoTransaccion> {
    return apiClient.put<TipoTransaccion>(`${this.endpoint}/${id}`, tipo);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

/**
 * Servicio para manejar las operaciones de Estado de Transacción
 * Endpoints: /api/estados-transaccion
 */
export class EstadoTransaccionService {
  private readonly endpoint = '/estados-transaccion';

  async getAll(): Promise<EstadoTransaccion[]> {
    return apiClient.get<EstadoTransaccion[]>(this.endpoint);
  }

  async getById(id: number): Promise<EstadoTransaccion> {
    return apiClient.get<EstadoTransaccion>(`${this.endpoint}/${id}`);
  }

  async create(estado: Omit<EstadoTransaccion, 'id'>): Promise<EstadoTransaccion> {
    return apiClient.post<EstadoTransaccion>(this.endpoint, estado);
  }

  async update(id: number, estado: Partial<EstadoTransaccion>): Promise<EstadoTransaccion> {
    return apiClient.put<EstadoTransaccion>(`${this.endpoint}/${id}`, estado);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }
}

/**
 * Servicio para manejar las operaciones de Adjunto
 * Endpoints: /api/adjuntos
 */
export class AdjuntoService {
  private readonly endpoint = '/adjuntos';

  async getAll(): Promise<Adjunto[]> {
    return apiClient.get<Adjunto[]>(this.endpoint);
  }

  async getById(id: number): Promise<Adjunto> {
    return apiClient.get<Adjunto>(`${this.endpoint}/${id}`);
  }

  async create(adjunto: Omit<Adjunto, 'id' | 'fechaSubida'>): Promise<Adjunto> {
    return apiClient.post<Adjunto>(this.endpoint, adjunto);
  }

  async update(id: number, adjunto: Partial<Adjunto>): Promise<Adjunto> {
    return apiClient.put<Adjunto>(`${this.endpoint}/${id}`, adjunto);
  }

  async delete(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.endpoint}/${id}`);
  }

  /**
   * Sube un archivo
   */
  async upload(file: FormData): Promise<Adjunto> {
    return apiClient.post<Adjunto>(`${this.endpoint}/upload`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Descarga un archivo
   */
  async download(id: number): Promise<Blob> {
    return apiClient.get<Blob>(`${this.endpoint}/${id}/download`, {
      responseType: 'blob',
    });
  }
}

// Exportar instancias singleton
export const divisaService = new DivisaService();
export const tipoTransaccionService = new TipoTransaccionService();
export const estadoTransaccionService = new EstadoTransaccionService();
export const adjuntoService = new AdjuntoService();