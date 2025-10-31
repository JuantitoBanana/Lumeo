import { apiClient } from '@/lib/api-client';

export interface GastoPorCategoria {
  idCategoria: number;
  nombreCategoria: string;
  totalGasto: number;
  color: string;
}

export interface EvolucionMensual {
  año: number;
  mes: number;
  nombreMes: string;
  abreviaturaMes: string;
  totalIngresos: number;
  totalGastos: number;
  saldo: number;
}

export class GraficosService {
  private static readonly BASE_PATH = '/usuarios';

  /**
   * Obtiene los gastos del mes actual agrupados por categoría
   */
  static async getGastosPorCategoria(usuarioId: number): Promise<GastoPorCategoria[]> {
    const data = await apiClient.get<GastoPorCategoria[]>(
      `${this.BASE_PATH}/${usuarioId}/gastos-por-categoria`
    );
    console.log('📊 Gastos por categoría recibidos:', data);
    return data;
  }

  /**
   * Obtiene la evolución mensual de ingresos y gastos
   */
  static async getEvolucionMensual(usuarioId: number, meses: number = 2): Promise<EvolucionMensual[]> {
    const data = await apiClient.get<EvolucionMensual[]>(
      `${this.BASE_PATH}/${usuarioId}/evolucion-mensual?meses=${meses}`
    );
    console.log('📈 Evolución mensual recibida:', data);
    return data;
  }
}

export default GraficosService;