/**
 * Formatea una cantidad monetaria con el símbolo de divisa en la posición correcta
 * @param cantidad - La cantidad numérica a formatear
 * @param simbolo - El símbolo de la divisa (€, $, £, etc.)
 * @param posicion - "ANTES" para símbolos antes de la cantidad (ej: $100), "DESPUES" para después (ej: 100€)
 * @param decimales - Número de decimales a mostrar (por defecto 2)
 * @returns String formateado con la cantidad y símbolo en la posición correcta
 */
export function formatearCantidad(
  cantidad: number,
  simbolo: string,
  posicion: string = 'DESPUES',
  decimales: number = 2
): string {
  const cantidadFormateada = cantidad.toFixed(decimales);
  
  if (posicion === 'ANTES') {
    // Símbolo antes: $100.00, £50.00, etc.
    return `${simbolo}${cantidadFormateada}`;
  } else {
    // Símbolo después: 100.00€, 50.00€, etc.
    return `${cantidadFormateada}${simbolo}`;
  }
}

/**
 * Configuración de posición de símbolo por código de divisa
 * Esto sirve como fallback si no tenemos la información de la base de datos
 */
export const POSICION_SIMBOLO_POR_DIVISA: Record<string, 'ANTES' | 'DESPUES'> = {
  // Divisas con símbolo antes
  'USD': 'ANTES',  // Dólar estadounidense
  'GBP': 'ANTES',  // Libra esterlina
  'CAD': 'ANTES',  // Dólar canadiense
  'AUD': 'ANTES',  // Dólar australiano
  'NZD': 'ANTES',  // Dólar neozelandés
  'HKD': 'ANTES',  // Dólar de Hong Kong
  'SGD': 'ANTES',  // Dólar de Singapur
  'CNY': 'ANTES',  // Yuan chino
  'JPY': 'ANTES',  // Yen japonés
  'INR': 'ANTES',  // Rupia india
  'MXN': 'ANTES',  // Peso mexicano
  'BRL': 'ANTES',  // Real brasileño
  
  // Divisas con símbolo después
  'EUR': 'DESPUES', // Euro
  'CHF': 'DESPUES', // Franco suizo
  'SEK': 'DESPUES', // Corona sueca
  'NOK': 'DESPUES', // Corona noruega
  'DKK': 'DESPUES', // Corona danesa
  'PLN': 'DESPUES', // Zloty polaco
  'CZK': 'DESPUES', // Corona checa
  'HUF': 'DESPUES', // Forinto húngaro
  'RON': 'DESPUES', // Leu rumano
  'BGN': 'DESPUES', // Lev búlgaro
  'HRK': 'DESPUES', // Kuna croata
  'RUB': 'DESPUES', // Rublo ruso
  'TRY': 'DESPUES', // Lira turca
  'ZAR': 'DESPUES', // Rand sudafricano
};

/**
 * Obtiene la posición del símbolo para un código de divisa
 * @param codigoDivisa - Código ISO de la divisa (EUR, USD, GBP, etc.)
 * @returns "ANTES" o "DESPUES"
 */
export function obtenerPosicionSimbolo(codigoDivisa: string): 'ANTES' | 'DESPUES' {
  return POSICION_SIMBOLO_POR_DIVISA[codigoDivisa] || 'DESPUES';
}
