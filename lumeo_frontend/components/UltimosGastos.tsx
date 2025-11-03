import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUltimosGastos } from '@/hooks/useUltimosGastos';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { formatearCantidad } from '@/lib/currency-utils';

interface UltimosGastosProps {
  usuarioId: number | null | undefined;
}

export default function UltimosGastos({ usuarioId }: UltimosGastosProps) {
  const { gastos, loading, error } = useUltimosGastos(usuarioId);
  const { currencySymbol } = useCurrencySymbol();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  };

  const formatCurrency = (amount: number, posicionSimbolo?: string) => {
    const position = posicionSimbolo || 'DESPUES';
    return formatearCantidad(Math.abs(amount), currencySymbol, position);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Últimos Gastos</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Últimos Gastos</Text>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!gastos || gastos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Últimos Gastos</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>No hay gastos recientes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Últimos Gastos</Text>
        <Ionicons name="receipt-outline" size={24} color="#007AFF" />
      </View>

      <ScrollView 
        style={styles.listContainer}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {gastos.map((gasto) => (
          <View key={gasto.id} style={styles.gastoItem}>
            <View style={styles.gastoLeft}>
              <View style={[styles.iconContainer, { backgroundColor: gasto.categoria?.color || '#007AFF' }]}>
                <Ionicons 
                  name={(gasto.categoria?.icono as any) || 'pricetag-outline'} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.gastoInfo}>
                <Text style={styles.gastoTitulo} numberOfLines={1}>
                  {gasto.titulo}
                </Text>
                <Text style={styles.gastoFecha}>
                  {formatDate(gasto.fechaTransaccion)}
                </Text>
              </View>
            </View>
            <Text style={styles.gastoImporte}>
              -{formatCurrency(gasto.importe, gasto.posicionSimbolo)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  listContainer: {
    maxHeight: 300,
  },
  gastoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  gastoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gastoInfo: {
    flex: 1,
    gap: 4,
  },
  gastoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  gastoFecha: {
    fontSize: 13,
    color: '#999999',
  },
  gastoImporte: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F44336',
    marginLeft: 8,
  },
});
