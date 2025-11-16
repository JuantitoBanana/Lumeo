/**
 * Servicios para la API de Lumeo
 * 
 * Este archivo exporta todos los servicios disponibles para interactuar
 * con la API del backend de Java Spring Boot.
 */

// Servicios principales
export { usuarioService, UsuarioService } from './usuario.service';
export { transaccionService, TransaccionService } from './transaccion.service';
export { transaccionGrupalService, TransaccionGrupalService } from './transaccion-grupal.service';
export { categoriaService, CategoriaService } from './categoria.service';
export { grupoService, GrupoService } from './grupo.service';
export { metaAhorroService, MetaAhorroService } from './meta-ahorro.service';
export { presupuestoService, PresupuestoService } from './presupuesto.service';

// Servicios auxiliares
export {
  divisaService,
  tipoTransaccionService,
  estadoTransaccionService,
  adjuntoService,
  DivisaService,
  TipoTransaccionService,
  EstadoTransaccionService,
  AdjuntoService,
} from './auxiliares.service';

// Cliente API base
export { apiClient } from '../lib/api-client';

// Importaciones para el objeto services
import { usuarioService } from './usuario.service';
import { transaccionService } from './transaccion.service';
import { transaccionGrupalService } from './transaccion-grupal.service';
import { categoriaService } from './categoria.service';
import { grupoService } from './grupo.service';
import { metaAhorroService } from './meta-ahorro.service';
import { presupuestoService } from './presupuesto.service';
import {
  divisaService,
  tipoTransaccionService,
  estadoTransaccionService,
  adjuntoService,
} from './auxiliares.service';
import { apiClient } from '../lib/api-client';

/**
 * Objeto que contiene todos los servicios para fácil acceso
 */
export const services = {
  usuario: usuarioService,
  transaccion: transaccionService,
  transaccionGrupal: transaccionGrupalService,
  categoria: categoriaService,
  grupo: grupoService,
  metaAhorro: metaAhorroService,
  presupuesto: presupuestoService,
  divisa: divisaService,
  tipoTransaccion: tipoTransaccionService,
  estadoTransaccion: estadoTransaccionService,
  adjunto: adjuntoService,
};

/**
 * Función para configurar la autenticación en todos los servicios
 */
export const setAuthToken = (token: string | null) => {
  apiClient.setAuthToken(token);
};

export default services;