import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { GastoPorCategoria } from '@/services/graficos.service';

interface GraficoCategoriaProps {
  gastos: GastoPorCategoria[];
  loading?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const GraficoCategoria: React.FC<GraficoCategoriaProps> = ({ gastos, loading }) => {
  // Configuración del gráfico
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  // Transformar datos para el gráfico (sin leyenda en el gráfico)
  const chartData = gastos.map((gasto) => ({
    name: gasto.nombreCategoria,
    population: gasto.totalGasto,
    color: gasto.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 0, // Ocultar leyenda en el gráfico
  }));

  // Datos para la leyenda separada
  const legendData = gastos.map((gasto) => ({
    name: gasto.nombreCategoria,
    color: gasto.color,
    amount: gasto.totalGasto,
  }));

  // Si no hay datos o hay error
  if (!loading && gastos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Gastos por Categoría</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {loading ? 'Cargando...' : 'No hay gastos'}
          </Text>
          {!loading && (
            <Text style={styles.emptyText}>este mes</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos por Categoría</Text>
      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <PieChart
              data={chartData}
              width={150} // Ancho fijo para mejor control
              height={130} // Ajustado para mejor proporción
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="0" // Sin padding para centrado perfecto
              center={[37.5, 0]} // Ajuste fino hacia la derecha
              absolute
              hasLegend={false} // Desactivar leyenda integrada
            />
          </View>
          {/* Leyenda personalizada debajo */}
          <View style={styles.legendContainer}>
            {legendData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>
                  {item.name}: {item.amount.toFixed(0)}€
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center', // Mantener centrado
    justifyContent: 'flex-start',
    // Removido paddingHorizontal que causaba descentrado
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    width: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    height: 130,
    width: 150, // Ancho fijo en lugar de screenWidth
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  loadingState: {
    height: 130,
    width: 150, // Ancho fijo en lugar de screenWidth
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10, // Reducido de 12 a 10
    color: '#666',
  },
  // Estilos para la leyenda personalizada
  legendContainer: {
    marginTop: 8,
    alignItems: 'center', // Centrar la leyenda
    maxWidth: 150,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    justifyContent: 'center', // Centrar cada item de la leyenda
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 9,
    color: '#333',
    textAlign: 'center',
  },
});

export default GraficoCategoria;