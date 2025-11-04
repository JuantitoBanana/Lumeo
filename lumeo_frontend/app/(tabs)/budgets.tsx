import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { Picker } from '@react-native-picker/picker';
import { usePresupuestos, Presupuesto } from '@/hooks/usePresupuestos';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import apiClient from '@/lib/api-client';

interface Transaccion {
  id: number;
  titulo: string;
  importe: number;
  fechaTransaccion: string;
  idTipo: number;
  categoria?: {
    id: number;
    nombre: string;
    icono?: string;
    color?: string;
  };
  tipoTransaccion?: {
    id: number;
    nombre: string;
  };
}

export default function BudgetsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { presupuestos, loading, error, refetch } = usePresupuestos();
  const { currencySymbol } = useCurrencySymbol();
  const { user } = useAuth();
  const { usuario } = useUsuarioApi();
  
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'presupuestos' | 'metas'>('presupuestos');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loadingTransacciones, setLoadingTransacciones] = useState(false);

  // Recargar presupuestos cuando la pantalla recibe foco
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

  const handleNavigate = () => {
    setPickerModalVisible(false);
    if (selectedOption === 'presupuestos') {
      router.push('/(tabs)/budgets');
    } else if (selectedOption === 'metas') {
      router.push('/(tabs)/savings');
    }
  };

  const handleShowDetail = async (presupuesto: Presupuesto) => {
    if (!usuario?.id) {
      console.error('Usuario no encontrado');
      return;
    }
    
    console.log('Abriendo modal para presupuesto:', presupuesto);
    console.log('Usuario ID:', usuario.id);
    
    // Convert Spanish month to month number
    const monthNumber = getMonthNumber(presupuesto.mes);
    const yearNumber = parseInt(presupuesto.anio);
    console.log('Original month:', presupuesto.mes);
    console.log('Month number:', monthNumber);
    console.log('Year:', yearNumber);
    
    setSelectedPresupuesto(presupuesto);
    setDetailModalVisible(true);
    
    // Cargar transacciones del presupuesto seleccionado
    try {
      setLoadingTransacciones(true);
      const response = await apiClient.get<Transaccion[]>(
        `/transacciones/usuario/${usuario.id}/mes/${monthNumber}/anio/${yearNumber}`
      );
      console.log('Respuesta del API:', response);
      console.log('Total de transacciones:', response.length);
      console.log('Transacciones por tipo:', response.reduce((acc, t) => {
        const tipo = t.idTipo || t.tipoTransaccion?.id || 'sin_tipo';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string | number, number>));
      
      setTransacciones(response);
    } catch (err: any) {
      console.error('Error al cargar transacciones:', err);
      setTransacciones([]);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const handleCloseDetail = () => {
    setDetailModalVisible(false);
    setSelectedPresupuesto(null);
    setTransacciones([]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMonthNumber = (spanishMonth: string): number => {
    const monthMap: Record<string, number> = {
      'Enero': 1,
      'Febrero': 2,
      'Marzo': 3,
      'Abril': 4,
      'Mayo': 5,
      'Junio': 6,
      'Julio': 7,
      'Agosto': 8,
      'Septiembre': 9,
      'Octubre': 10,
      'Noviembre': 11,
      'Diciembre': 12
    };
    return monthMap[spanishMonth] || 1;
  };

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toFixed(2)}`;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando presupuestos...</Text>
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

    if (presupuestos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>Sin presupuestos</Text>
          <Text style={styles.emptySubtext}>
            Crea tu primer presupuesto para gestionar tus finanzas
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.presupuestosList} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {presupuestos.map((presupuesto) => (
          <View key={presupuesto.id} style={styles.presupuestoCard}>
            {/* Header con título y cantidades */}
            <View style={styles.presupuestoHeader}>
              <Text style={styles.presupuestoTitle}>
                {presupuesto.mes} {presupuesto.anio}
              </Text>
              <Text style={styles.comparisonText}>
                <Text style={[styles.comparisonAmount, { 
                  color: (presupuesto.totalGastos || 0) < presupuesto.cantidad 
                    ? '#34C759' 
                    : (presupuesto.totalGastos || 0) === presupuesto.cantidad 
                      ? '#999' 
                      : '#FF3B30' 
                }]}>
                  {formatCurrency(presupuesto.totalGastos || 0)}
                </Text>
                <Text style={styles.comparisonSeparator}> / </Text>
                <Text style={styles.comparisonBudget}>
                  {formatCurrency(presupuesto.cantidad)}
                </Text>
              </Text>
            </View>

            {/* Icono de ojo para ver detalles */}
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => handleShowDetail(presupuesto)}
            >
              <Ionicons name="eye-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ))}
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
        <TouchableOpacity
          style={styles.headerTitleButton}
          onPress={() => setPickerModalVisible(true)}
        >
          <Ionicons name="chevron-down" size={20} color="#000" />
          <Text style={styles.headerTitle}>Presupuestos</Text>
        </TouchableOpacity>
      </View>

      {/* Contenido */}
      {renderContent()}

      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab="stats" onTabRefresh={handleRefresh} />

      {/* Botón flotante para crear nuevo presupuesto */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push('/create-budget')}
      >
        <Ionicons name="add" size={36} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal para seleccionar navegación */}
      <Modal
        visible={pickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={() => setPickerModalVisible(false)}
        >
          <View style={[styles.modalContent, Platform.OS === 'ios' && styles.modalContentIOS, Platform.OS === 'android' && styles.modalContentAndroid]}>
            <Pressable style={{ width: '100%' }} onPress={() => {}}>
              <Text style={styles.modalTitle}>Selecciona una opción</Text>
              <Picker
                selectedValue={selectedOption}
                onValueChange={(itemValue: string) => setSelectedOption(itemValue as 'presupuestos' | 'metas')}
                style={[styles.picker, Platform.OS === 'android' && styles.pickerAndroid]}
                itemStyle={{ color: '#000' }}
              >
                <Picker.Item label="Metas de ahorro" value="metas" />
                <Picker.Item label="Presupuestos" value="presupuestos" />
              </Picker>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleNavigate}
              >
                <Text style={styles.modalButtonText}>Ir</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Modal de detalle de presupuesto */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseDetail}
      >
        <View style={styles.detailModalOverlay}>
          <Pressable 
            style={StyleSheet.absoluteFill}
            onPress={handleCloseDetail}
          />
          <View 
            style={styles.detailModalContent}
            pointerEvents="box-none"
          >
            {/* Header del modal - Fixed height */}
            <View style={styles.detailModalHeader} pointerEvents="auto">
              <TouchableOpacity
                style={styles.detailModalCloseButton}
                onPress={handleCloseDetail}
              >
                <Ionicons name="arrow-back" size={24} color="#666" />
              </TouchableOpacity>
              <View style={styles.detailModalTitleContainer}>
                <Text style={styles.detailModalTitle}>Presupuesto</Text>
                <Text style={styles.detailModalSubtitle}>
                  {selectedPresupuesto?.mes} {selectedPresupuesto?.anio}
                </Text>
              </View>
            </View>

            {/* Contenido del modal - Flexible height */}
            <View style={styles.detailModalBody} pointerEvents="box-none">
              {loadingTransacciones ? (
                <View style={styles.detailModalLoading}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.detailModalLoadingText}>Cargando gastos...</Text>
                </View>
              ) : transacciones.filter(t => t.idTipo === 2).length === 0 ? (
                <View style={styles.detailModalEmpty}>
                  <Ionicons name="receipt-outline" size={64} color="#999" />
                  <Text style={styles.detailModalEmptyText}>Sin gastos</Text>
                  <Text style={styles.detailModalEmptySubtext}>
                    No hay gastos registrados para {selectedPresupuesto?.mes} {selectedPresupuesto?.anio}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={transacciones.filter(transaccion => transaccion.idTipo === 2)}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.detailModalList}
                  contentContainerStyle={styles.detailModalScrollContent}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={false}
                  renderItem={({ item: transaccion }) => (
                    <View style={styles.detailModalTransactionCard}>
                      <View style={styles.detailModalTransactionLeft}>
                        <View style={[styles.detailModalIconContainer, { backgroundColor: transaccion.categoria?.color || '#007AFF' }]}>
                          <Text style={styles.detailModalIconText}>
                            {transaccion.categoria?.icono || '💰'}
                          </Text>
                        </View>
                        <View style={styles.detailModalTransactionInfo}>
                          <Text style={styles.detailModalTransactionTitle}>{transaccion.titulo}</Text>
                          <Text style={styles.detailModalTransactionCategory}>
                            {transaccion.categoria?.nombre || 'Sin categoría'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.detailModalTransactionRight}>
                        <Text style={[styles.detailModalTransactionAmount, {
                          color: '#FF3B30' // Siempre rojo para gastos en presupuesto
                        }]}>
                          {formatCurrency(transaccion.importe)}
                        </Text>
                        <Text style={styles.detailModalTransactionDate}>
                          {formatDate(transaccion.fechaTransaccion)}
                        </Text>
                      </View>
                    </View>
                  )}
                />
              )}
            </View>

            {/* Footer con totales - Fixed height */}
            {selectedPresupuesto && (
              <View style={styles.detailModalFooter} pointerEvents="auto">
                <View style={styles.detailModalTotalContainer}>
                  <Text style={[styles.detailModalTotalExpenses, {
                    color: (selectedPresupuesto.totalGastos || 0) < selectedPresupuesto.cantidad
                      ? '#34C759'
                      : (selectedPresupuesto.totalGastos || 0) === selectedPresupuesto.cantidad
                        ? '#999'
                        : '#FF3B30'
                  }]}>
                    {formatCurrency(selectedPresupuesto.totalGastos || 0)}
                  </Text>
                  <Text style={styles.detailModalTotalSeparator}> / </Text>
                  <Text style={styles.detailModalTotalBudget}>
                    {formatCurrency(selectedPresupuesto.cantidad)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitleButton: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
  presupuestosList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  presupuestoCard: {
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
  presupuestoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  presupuestoHeaderLeft: {
    flex: 1,
  },
  presupuestoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  presupuestoSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  comparisonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  comparisonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  comparisonAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonSeparator: {
    fontSize: 16,
    color: '#999',
  },
  comparisonBudget: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  eyeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
  },
  presupuestoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  montoLabel: {
    fontSize: 14,
    color: '#666',
  },
  montoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  bottomSpace: {
    height: 100,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para el modal de selección de navegación
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalContentIOS: {
    width: '90%',
    padding: 30,
  },
  modalContentAndroid: {
    width: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 200,
    backgroundColor: 'transparent',
    color: '#000',
  },
  pickerAndroid: {
    height: 100,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignSelf: 'flex-end',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
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
  // Estilos para el modal de detalle de presupuesto
  detailModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  detailModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    flex: 1,
    maxHeight: '70%', // Reducido de 85% a 70%
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  detailModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16, // Reducido de 20 a 16
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 70, // Reducido de 80 a 70
  },
  detailModalCloseButton: {
    padding: 8,
  },
  detailModalTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  detailModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  detailModalBody: {
    flex: 1,
    overflow: 'hidden',
  },
  detailModalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30, // Reducido de 40 a 30
  },
  detailModalLoadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  detailModalEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30, // Reducido de 40 a 30
  },
  detailModalEmptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  detailModalEmptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  detailModalList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  detailModalScrollContent: {
    paddingBottom: 16,
  },
  detailModalTransactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14, // Aumentado de 10 a 14 para más altura
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 4, // Reducido de 6 a 4 para compensar
  },
  detailModalTransactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailModalIconContainer: {
    width: 44, // Aumentado de 40 a 44
    height: 44, // Aumentado de 40 a 44
    borderRadius: 22, // Ajustado para mantener proporción
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailModalIconText: {
    fontSize: 20, // Aumentado de 18 a 20 para mejor proporción con contenedor más grande
  },
  detailModalTransactionInfo: {
    flex: 1,
  },
  detailModalTransactionTitle: {
    fontSize: 17, // Aumentado de 16 a 17 para mejor proporción
    fontWeight: '600',
    color: '#1a1a1a',
  },
  detailModalTransactionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  detailModalTransactionRight: {
    alignItems: 'flex-end',
  },
  detailModalTransactionAmount: {
    fontSize: 17, // Aumentado de 16 a 17 para mantener proporción
    fontWeight: '700',
    color: '#FF3B30',
  },
  detailModalTransactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  detailModalFooter: {
    padding: 16, // Reducido de 20 a 16
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#F8F9FA',
    minHeight: 60, // Reducido de 70 a 60
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detailModalTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  detailModalTotalExpenses: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailModalTotalSeparator: {
    fontSize: 18,
    color: '#999',
    marginHorizontal: 8,
  },
  detailModalTotalBudget: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
});