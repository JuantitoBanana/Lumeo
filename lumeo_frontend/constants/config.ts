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

// Detecta el host de desarrollo cuando se usa Expo.
// - Si estás usando Expo Go en un dispositivo físico, `debuggerHost` suele contener la IP del PC.
// - Si usas el emulador Android (AVD), usa 10.0.2.2 para alcanzar `localhost` del host.
const manifestAny: any = (Constants as any).manifest || (Constants as any).expoConfig || {};
const debuggerHost: string | undefined =
  manifestAny.debuggerHost ||
  // algunas versiones de expo ponen la info en expoConfig.extra
  (manifestAny.packagerOpts && (manifestAny.packagerOpts as any).debuggerHost);

let devHost = 'localhost';
if (debuggerHost) {
  // Expo detectó la IP automáticamente (dispositivo físico o emulador)
  devHost = debuggerHost.split(':')[0];
} else if (Platform.OS === 'android') {
  // Para dispositivo físico Android, usar la IP local del PC
  // Para emulador Android, usar 10.0.2.2
  devHost = '192.168.1.136'; // Cambiar por tu IP local si es diferente
} else if (Platform.OS === 'ios') {
  // iOS Simulator necesita la IP real de la máquina host
  devHost = '192.168.1.136';
}

export const API_BASE_URL = __DEV__
  ? `http://${devHost}:8080/api` // URL de desarrollo del backend Java (auto-detect)
  : 'https://original-wallie-lumeo-team-b6b2ddc2.koyeb.app/api'; // URL de producción en Koyeb

// Log para debugging
console.log('🔍 API Configuration:', {
  devHost,
  debuggerHost,
  platform: Platform.OS,
  isDev: __DEV__,
  API_BASE_URL
});

// Timeout para las peticiones HTTP (en milisegundos)
// Aumentado a 15 segundos para dar más margen a respuestas lentas
export const API_TIMEOUT = 15000;
