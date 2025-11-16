/**
 * Tipos para la API de Lumeo Backend
 */

// Usuario
export interface Usuario {
  id?: number;
  fechaCreacion?: string;
  email: string;
  nombre: string;
  apellido: string;
  idioma?: string;
  fechaModificacion?: string;
  nombreUsuario: string;
  idDivisa?: number;
  uid?: string;
}

// Transacción
export interface Transaccion {
  id?: number;
  titulo: string;
  importe: number;
  fechaTransaccion: string; // Format: YYYY-MM-DD
  nota?: string;
  idUsuario: number;
  idCategoria?: number;
  idGrupo?: number;
  idTipo?: number;
  idEstado?: number;
  idAdjunto?: number;
  idDestinatario?: number;
  importeDestinatario?: number;
  posicionSimbolo?: string; // "ANTES" o "DESPUES"
  // Relationships (populated when fetched from API)
  usuario?: Usuario;
  categoria?: Categoria;
  grupo?: Grupo;
  tipoTransaccion?: TipoTransaccion;
  estadoTransaccion?: EstadoTransaccion;
  adjunto?: Adjunto;
  destinatario?: Usuario;
}

// Categoría
export interface Categoria {
  id?: number;
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
}

// Grupo
export interface Grupo {
  id?: number;
  nombre: string;
  descripcion?: string;
  idCreador?: number;
}

// Tipo de Transacción
export interface TipoTransaccion {
  id?: number;
  nombre: string;
  descripcion?: string;
}

// Estado de Transacción
export interface EstadoTransaccion {
  id?: number;
  nombre: string;
  descripcion?: string;
}

// Divisa
export interface Divisa {
  id?: number;
  nombre: string;
  codigo: string;
  simbolo: string;
  posicionSimbolo?: string; // "ANTES" o "DESPUES"
}

// Meta de Ahorro
export interface MetaAhorro {
  id?: number;
  nombre: string;
  descripcion?: string;
  montoObjetivo: number;
  montoActual?: number;
  fechaInicio: string;
  fechaObjetivo: string;
  idUsuario: number;
}

// Presupuesto
export interface Presupuesto {
  id?: number;
  nombre: string;
  descripcion?: string;
  monto: number;
  periodo: string;
  fechaInicio: string;
  fechaFin?: string;
  idUsuario: number;
  idCategoria?: number;
}

// Adjunto
export interface Adjunto {
  id?: number;
  nombre: string;
  tipo: string;
  tamaño: number;
  ruta: string;
  fechaSubida?: string;
}

// Tipos para respuestas de la API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  error?: any;
}

// Tipos para parámetros de consulta
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface FilterParams {
  [key: string]: any;
}