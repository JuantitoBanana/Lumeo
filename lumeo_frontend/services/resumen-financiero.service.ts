import { apiClient } from '@/lib/api-client';

export interface ResumenFinanciero {
  totalIngresos: number;
  totalGastos: number;
  saldoTotal: number;
  codigoDivisa: string;
  simboloDivisa: string;
  posicionSimbolo: string; // "ANTES" o "DESPUES"
  // Datos mensuales
  ingresosMensuales: number;
  gastosMensuales: number;
  ahorroMensual: number;
}

export class ResumenFinancieroService {
  private static readonly BASE_PATH = '/usuarios';

  /**
   * Obtiene el resumen financiero de un usuario
   */
  static async getResumenFinanciero(usuarioId: number): Promise<ResumenFinanciero> {
    const data = await apiClient.get<ResumenFinanciero>(
      `${this.BASE_PATH}/${usuarioId}/resumen-financiero`
    );
    console.log('📊 Datos del resumen financiero recibidos:', data);
    return data;
  }
}

export default ResumenFinancieroService;