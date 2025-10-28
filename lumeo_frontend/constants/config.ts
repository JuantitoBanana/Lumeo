/**
 * Configuración de URLs para la aplicación
 */

// URL para el reset de contraseña
// En desarrollo: usa localhost con el puerto que uses para web
// En producción: usa tu dominio real
export const RESET_PASSWORD_URL = __DEV__
  ? 'http://localhost:8082/reset-password'  // URL de desarrollo (puerto 8082)
  : 'https://tu-dominio.com/reset-password'; // URL de producción - CAMBIAR ESTO

// URL base de la aplicación
export const APP_URL = __DEV__
  ? 'http://localhost:8082'
  : 'https://tu-dominio.com';
