import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useMetasAhorro } from '@/hooks/useMetasAhorro';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { formatearCantidad } from '@/lib/currency-utils';
import AddMoneyModal from '@/app/add-money-modal';

export default function SavingsScreen() {
  const router = useRouter();
  const { metas, loading, error, refetch } = useMetasAhorro();
  const { currencySymbol } = useCurrencySymbol();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<{
    id: number;
    titulo: string;
    cantidadActual: number;
    cantidadObjetivo: number;
  } | null>(null);

  // Recargar metas cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // Función para refrescar
  const handleRefresh = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    refetch();
  };

  const handleOpenModal = (meta: any) => {
    setSelectedMeta({
      id: meta.id,
      titulo: meta.titulo,
      cantidadActual: meta.cantidadActual,
      cantidadObjetivo: meta.cantidadObjetivo,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedMeta(null);
  };

  const handleSuccess = () => {
    refetch();
  };

  const formatCurrency = (amount: number, posicionSimbolo?: string) => {
    const position = posicionSimbolo || 'DESPUES';
    return formatearCantidad(Math.abs(amount), currencySymbol, position);
  };

  const calculatePercentage = (current: number, goal: number) => {
    if (goal === 0) return 0;
    const percentage = (current / goal) * 100;
    return Math.min(Math.round(percentage), 100);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando metas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.emptyText}>Error al cargar</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (metas.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>Sin metas de ahorro</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primera meta para comenzar a ahorrar
          </Text>
        </View>
      );
    }

    return (
      <ScrollView ref={scrollViewRef} style={styles.metasList} showsVerticalScrollIndicator={false}>
        {metas.map((meta) => {
          const percentage = calculatePercentage(meta.cantidadActual, meta.cantidadObjetivo);
          
          return (
            <View key={meta.id} style={styles.metaCard}>
              {/* Header de la meta */}
              <View style={styles.metaHeader}>
                <Text style={styles.metaTitle} numberOfLines={1}>
                  {meta.titulo}
                </Text>
                <View style={styles.metaHeaderRight}>
                  <View style={styles.percentageBadge}>
                    <Text style={styles.percentageText}>{percentage}%</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => handleOpenModal(meta)}
                  >
                    <Ionicons name="add-circle" size={32} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Barra de progreso */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
              </View>

              {/* Montos */}
              <View style={styles.metaFooter}>
                <Text style={styles.amountText}>
                  {formatCurrency(meta.cantidadActual, meta.posicionSimbolo)} / {formatCurrency(meta.cantidadObjetivo, meta.posicionSimbolo)}
                </Text>
              </View>
            </View>
          );
        })}
        <View style={styles.bottomSpace} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Metas de ahorro</Text>
      </View>

      {/* Contenido */}
      {renderContent()}

      {/* Botón flotante para crear nueva meta */}
      {!loading && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => router.push('/create-savings-goal')}
        >
          <Ionicons name="add" size={36} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="stats" onTabRefresh={handleRefresh} />

      {/* Modal para agregar dinero */}
      {selectedMeta && (
        <AddMoneyModal
          visible={modalVisible}
          onClose={handleCloseModal}
          metaId={selectedMeta.id}
          metaTitulo={selectedMeta.titulo}
          cantidadActual={selectedMeta.cantidadActual}
          cantidadObjetivo={selectedMeta.cantidadObjetivo}
          onSuccess={handleSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  metasList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 12,
  },
  metaHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  percentageBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  addButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  metaFooter: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomSpace: {
    height: 100,
  },
});
