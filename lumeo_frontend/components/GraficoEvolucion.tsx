import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { EvolucionMensual } from '@/services/graficos.service';

interface GraficoEvolucionProps {
  evolucion: EvolucionMensual[];
  loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const GraficoEvolucion: React.FC<GraficoEvolucionProps> = ({ evolucion, loading }) => {
  // Configuración del gráfico
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForLabels: {
      fontSize: 12,
      fontWeight: '600',
    },
    barPercentage: 0.5, // Reducir ancho de barras al 50%
  };

  // Transformar datos para el gráfico (solo últimos 2 meses)
  const ultimos2Meses = evolucion.slice(-2); // Tomar solo los últimos 2 elementos
  
  // Crear arrays intercalados para mostrar barras lado a lado
  const ingresosYGastos: number[] = [];
  const labels: string[] = [];
  
  ultimos2Meses.forEach((mes, index) => {
    ingresosYGastos.push(mes.totalIngresos);
    ingresosYGastos.push(mes.totalGastos);
    // Agregar etiqueta con espacios para centrarla visualmente
    labels.push(`  ${mes.abreviaturaMes}`);
    labels.push('');
  });
  
  const chartData = {
    labels: labels,
    datasets: [{
      data: ingresosYGastos,
      colors: ultimos2Meses.flatMap(() => [
        (opacity = 1) => `rgba(76, 175, 80, 0.4)`, // Verde para ingresos con menor opacidad
        (opacity = 1) => `rgba(244, 67, 54, 0.4)`, // Rojo para gastos con menor opacidad
      ]),
    }],
  };

  // Si no hay datos o hay error
  if (!loading && (evolucion.length === 0 || !ultimos2Meses.length)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Evolución Mensual</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {loading ? 'Cargando...' : 'No hay datos disponibles'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evolución Mensual</Text>
      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <BarChart
          style={styles.chart}
          data={chartData}
          width={screenWidth * 0.42}
          height={160}
          yAxisLabel=""
          yAxisSuffix="€"
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero={true}
          showBarTops={false}
          showValuesOnTopOfBars={false}
          withCustomBarColorFromData={true}
          flatColor={true}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 15, // Agregar padding izquierdo al contenedor
    // Removido: backgroundColor, borderRadius, padding, shadows
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    height: 160, // Aumentado para coincidir con el gráfico
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10, // Reducido de 12 a 10
    color: '#666',
    textAlign: 'center',
  },
  loadingState: {
    height: 160, // Aumentado para coincidir con el gráfico
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10, // Reducido de 12 a 10
    color: '#666',
  },
});

export default GraficoEvolucion;