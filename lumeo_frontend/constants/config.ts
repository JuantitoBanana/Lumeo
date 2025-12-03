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

const getDevHost = () => {
  // 1. Intentamos obtener la IP desde el manifiesto de Expo
  // Esto funciona genial en Expo Go
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // 2. Fallback para emulador de Android (siempre es esta IP)
  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  // 3. Fallback para iOS Simulator
  // En el simulador iOS, 'localhost' suele funcionar bien porque comparte red con el host
  if (Platform.OS === 'ios') {
    return 'localhost';
  }

  // Último recurso (puedes dejar localhost o manejar un error)
  return 'localhost';
};

export const API_BASE_URL = __DEV__
  ? `http://${getDevHost()}:8080/api` // URL de desarrollo del backend Java (auto-detect)
  : 'https://original-wallie-lumeo-team-b6b2ddc2.koyeb.app/api'; // URL de producción en Koyeb

// Timeout para las peticiones HTTP (en milisegundos)
// Aumentado a 30 segundos para dar más margen a respuestas lentas del backend
export const API_TIMEOUT = 30000;
