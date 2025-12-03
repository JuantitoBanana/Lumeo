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
  : 'https://original-wallie-lumeo-team-b6b2ddc2.koyeb.app';

// URL base para la API de Java Spring Boot
// Por defecto Spring Boot corre en el puerto 8080
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Detecta el host de desarrollo de forma dinámica
 * - Emulador Android: IP hardcodeada 10.0.2.2
 * - Dispositivos físicos: Usa la IP detectada por Expo
 * - iOS Simulator: Usa localhost
 */
const getDevHost = (): string => {
  // Para emulador Android, usar IP hardcodeada
  if (Platform.OS === 'android') {
    // Verificar si es emulador (los dispositivos físicos tienen hostUri)
    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri || hostUri.includes('localhost')) {
      // Es emulador, usar IP hardcodeada
      return '10.0.2.2';
    }
    // Es dispositivo físico, usar IP detectada
    return hostUri.split(':')[0];
  }
  
  // Para iOS
  if (Platform.OS === 'ios') {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri && !hostUri.includes('localhost')) {
      // Es dispositivo físico, usar IP detectada
      return hostUri.split(':')[0];
    }
    // Es simulador, usar localhost
    return 'localhost';
  }
  
  // Fallback
  return 'localhost';
};

export const API_BASE_URL = __DEV__
  ? `http://${getDevHost()}:8080/api` // URL de desarrollo del backend Java
  : 'https://original-wallie-lumeo-team-b6b2ddc2.koyeb.app/api'; // URL de producción en Koyeb

// Timeout para las peticiones HTTP (en milisegundos)
// Aumentado a 30 segundos para dar más margen a respuestas lentas del backend
export const API_TIMEOUT = 30000;
