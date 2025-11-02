import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useTransacciones } from '@/hooks/useTransacciones';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { formatearCantidad } from '@/lib/currency-utils';
import apiClient from '@/lib/api-client';
import { Transaccion } from '@/types/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { eventEmitter, APP_EVENTS } from '@/lib/event-emitter';

// Modal de detalle de transacción
interface TransactionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaccion | null;
  currencySymbol: string;
  onDelete: (transaction: Transaccion) => void;
}

function TransactionDetailModal({ visible, onClose, transaction, currencySymbol, onDelete }: TransactionDetailModalProps) {
  if (!transaction) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Determinar si es ingreso o gasto basado en el tipo de transacción
  const isIncome = transaction.tipoTransaccion?.nombre?.toLowerCase().includes('ingreso') || 
                   transaction.idTipo === 1; // Asumiendo que 1 es ingreso
  
  const formatAmount = (amount: number) => {
    const position = transaction.posicionSimbolo || 'DESPUES';
    return formatearCantidad(Math.abs(amount), currencySymbol, position);
  };

  const handleDelete = () => {
    onDelete(transaction);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle de Transacción</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Contenido del modal */}
          <View style={styles.modalBody}>
            {/* Título y categoría */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Título</Text>
              <Text style={styles.modalValue}>{transaction.titulo}</Text>
            </View>

            {transaction.categoria && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Categoría</Text>
                <View style={styles.categoryBadge}>
                  <Ionicons 
                    name={(transaction.categoria.icono as any) || 'pricetag-outline'} 
                    size={20} 
                    color={transaction.categoria.color || '#007AFF'} 
                  />
                  <Text style={styles.categoryText}>{transaction.categoria.nombre}</Text>
                </View>
              </View>
            )}

            {/* Tipo */}
            {transaction.tipoTransaccion && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Tipo</Text>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE' },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeText,
                      { color: isIncome ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {transaction.tipoTransaccion.nombre}
                  </Text>
                </View>
              </View>
            )}

            {/* Importe */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Importe</Text>
              <Text
                style={[
                  styles.modalAmount,
                  { color: isIncome ? '#4CAF50' : '#F44336' },
                ]}
              >
                {isIncome ? '+' : '-'}{formatAmount(transaction.importe)}
              </Text>
            </View>

            {/* Fecha */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Fecha</Text>
              <Text style={styles.modalValue}>{formatDate(transaction.fechaTransaccion)}</Text>
            </View>

            {/* Nota si existe */}
            {transaction.nota && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Nota</Text>
                <Text style={styles.modalDescription}>{transaction.nota}</Text>
              </View>
            )}

            {/* Estado si existe */}
            {transaction.estadoTransaccion && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Estado</Text>
                <Text style={styles.modalValue}>{transaction.estadoTransaccion.nombre}</Text>
              </View>
            )}

            {/* Grupo si existe */}
            {transaction.grupo && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Grupo</Text>
                <Text style={styles.modalValue}>{transaction.grupo.nombre}</Text>
              </View>
            )}
          </View>

          {/* Botón de eliminar - posicionado absolutamente */}
          <TouchableOpacity 
            style={styles.deleteTransactionButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteTransactionButtonText}>Eliminar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Tipo de transacción para la vista
interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryIcon: string;
  type: 'income' | 'expense';
  amount: string;
  date: string;
  description?: string;
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const { transacciones, loading, error, refetchTransacciones } = useTransacciones(usuario?.id);
  const { currencySymbol } = useCurrencySymbol();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaccion | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Estados para el rango de fechas
  const [fechaInicio, setFechaInicio] = useState<Date | null>(null);
  const [fechaFin, setFechaFin] = useState<Date | null>(null);
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

  // Función para refrescar
  const handleRefresh = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    refetchTransacciones();
  };
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Refrescar transacciones cuando la pantalla recibe el foco
  useFocusEffect(
    React.useCallback(() => {
      if (usuario?.id) {
        refetchTransacciones();
      }
    }, [usuario?.id])
  );

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Función para formatear fecha del selector
  const formatDateSelector = (date: Date | null) => {
    if (!date) return 'Seleccionar fecha';
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handlers para los date pickers
  const handleDateInicioChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const confirmDateInicio = () => {
    setFechaInicio(tempDate);
    setShowDatePickerInicio(false);
  };

  const confirmDateFin = () => {
    setFechaFin(tempDate);
    setShowDatePickerFin(false);
  };

  const cancelDatePicker = () => {
    setShowDatePickerInicio(false);
    setShowDatePickerFin(false);
  };

  const clearDateRange = () => {
    setFechaInicio(null);
    setFechaFin(null);
  };

  // Extraer categorías únicas de las transacciones
  const categories = ['Todas', ...Array.from(new Set(transacciones
    .map(t => t.categoria?.nombre)
    .filter(Boolean) as string[]))];

  const types = ['Todos', 'Ingresos', 'Gastos'];

  const handleTransactionPress = (transaction: Transaccion) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  const handleOpenDeleteModal = (transaction: Transaccion) => {
    setTransactionToDelete(transaction);
    setModalVisible(false); // Cerrar modal de detalle
    setDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalVisible(false);
    setTransactionToDelete(null);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete?.id) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/transacciones/${transactionToDelete.id}`);
      
      // Cerrar modales y refrescar lista
      setDeleteModalVisible(false);
      setTransactionToDelete(null);
      setSelectedTransaction(null);
      refetchTransacciones();
      
      // Emitir evento para actualizar el dashboard
      eventEmitter.emit(APP_EVENTS.TRANSACTION_DELETED);
    } catch (err: any) {
      console.error('Error al eliminar transacción:', err);
      Alert.alert('Error', 'No se pudo eliminar la transacción');
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar transacciones
  const filteredTransactions = transacciones.filter((transaction) => {
    if (selectedCategory && selectedCategory !== 'Todas' && transaction.categoria?.nombre !== selectedCategory) {
      return false;
    }
    if (selectedType && selectedType !== 'Todos') {
      const isIncome = transaction.tipoTransaccion?.nombre?.toLowerCase().includes('ingreso') || 
                       transaction.idTipo === 1;
      if (selectedType === 'Ingresos' && !isIncome) return false;
      if (selectedType === 'Gastos' && isIncome) return false;
    }
    
    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      const transactionDate = new Date(transaction.fechaTransaccion);
      
      if (fechaInicio && fechaFin) {
        // Ambas fechas seleccionadas: mostrar transacciones en el rango
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        inicio.setHours(0, 0, 0, 0);
        fin.setHours(23, 59, 59, 999);
        
        if (transactionDate < inicio || transactionDate > fin) {
          return false;
        }
      } else if (fechaInicio) {
        // Solo fecha inicio: desde esa fecha en adelante
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        
        if (transactionDate < inicio) {
          return false;
        }
      } else if (fechaFin) {
        // Solo fecha fin: hasta esa fecha
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        if (transactionDate > fin) {
          return false;
        }
      }
    }
    
    return true;
  });

  // Determinar si estamos cargando datos esenciales
  const isLoadingEssential = loadingUsuario || loading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Transacciones</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {/* Filtro por categoría */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Categoría</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filtro por tipo */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Tipo</Text>
          <View style={styles.typeFilterContainer}>
            {types.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, selectedType === type && styles.typeChipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    selectedType === type && styles.typeChipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Filtro por rango de fechas */}
        <View style={styles.filterSection}>
          <View style={styles.dateRangeHeader}>
            <Text style={styles.filterLabel}>Rango de fechas</Text>
            {(fechaInicio || fechaFin) && (
              <TouchableOpacity onPress={clearDateRange} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.datePickersContainer}>
            {/* Fecha inicio */}
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                setTempDate(fechaInicio || new Date());
                setShowDatePickerInicio(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>Desde</Text>
                <Text style={[styles.datePickerText, fechaInicio && styles.datePickerTextSelected]}>
                  {formatDateSelector(fechaInicio)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Fecha fin */}
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                setTempDate(fechaFin || new Date());
                setShowDatePickerFin(true);
              }}
            >
              <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerLabel}>Hasta</Text>
                <Text style={[styles.datePickerText, fechaFin && styles.datePickerTextSelected]}>
                  {formatDateSelector(fechaFin)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Lista de transacciones */}
      <ScrollView ref={scrollViewRef} style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {isLoadingEssential ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Cargando transacciones...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
            <Text style={styles.emptyText}>Error al cargar</Text>
            <Text style={styles.emptySubtext}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={refetchTransacciones}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay transacciones</Text>
            <Text style={styles.emptySubtext}>
              {transacciones.length === 0 
                ? 'Añade tu primera transacción'
                : 'Ajusta los filtros para ver más resultados'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => {
            const isIncome = transaction.tipoTransaccion?.nombre?.toLowerCase().includes('ingreso') || 
                             transaction.idTipo === 1;
            const categoryIcon = transaction.categoria?.icono || 'pricetag-outline';
            const categoryColor = transaction.categoria?.color || (isIncome ? '#4CAF50' : '#F44336');
            
            const formatAmount = (amount: number) => {
              const position = transaction.posicionSimbolo || 'DESPUES';
              return formatearCantidad(Math.abs(amount), currencySymbol, position);
            };
            
            return (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIconContainer,
                      {
                        backgroundColor: isIncome ? '#E8F5E9' : '#FFEBEE',
                      },
                    ]}
                  >
                    <Ionicons
                      name={categoryIcon as any}
                      size={24}
                      color={categoryColor}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionTitle}>{transaction.titulo}</Text>
                    <Text style={styles.transactionDate}>{formatDate(transaction.fechaTransaccion)}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      { color: isIncome ? '#4CAF50' : '#F44336' },
                    ]}
                  >
                    {isIncome ? '+' : '-'}{formatAmount(transaction.importe)}
                  </Text>
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => handleTransactionPress(transaction)}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        {/* Espacio para el tab bar */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <BottomTabBar activeTab="coins" onTabRefresh={handleRefresh} />

      {/* Modal de detalle de transacción */}
      <TransactionDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
        currencySymbol={currencySymbol}
        onDelete={handleOpenDeleteModal}
      />

      {/* Modal de confirmación para eliminar transacción */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <Pressable style={styles.deleteModalOverlay} onPress={handleCloseDeleteModal}>
          <Pressable style={styles.deleteModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#FF3B30" />
              <Text style={styles.deleteModalTitle}>Eliminar Transacción</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              ¿Estás seguro de que deseas eliminar la transacción "{transactionToDelete?.titulo}"?
            </Text>
            <Text style={styles.deleteModalWarning}>
              Esta acción no se puede deshacer.
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseDeleteModal}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmDeleteButton, deleting && styles.confirmDeleteButtonDisabled]}
                onPress={handleDeleteTransaction}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Date Picker para Fecha Inicio */}
      <Modal visible={showDatePickerInicio} transparent={true} animationType="fade">
        <Pressable style={styles.datePickerModalOverlay} onPress={cancelDatePicker}>
          <Pressable style={styles.datePickerModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerModalHeader}>
              <Text style={styles.datePickerModalTitle}>Seleccionar Fecha Inicio</Text>
              <TouchableOpacity onPress={cancelDatePicker}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateInicioChange}
              maximumDate={fechaFin || new Date()}
              style={styles.datePicker}
            />
            <View style={styles.datePickerModalButtons}>
              <TouchableOpacity style={styles.datePickerCancelButton} onPress={cancelDatePicker}>
                <Text style={styles.datePickerCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={confirmDateInicio}>
                <Text style={styles.datePickerConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Date Picker para Fecha Fin */}
      <Modal visible={showDatePickerFin} transparent={true} animationType="fade">
        <Pressable style={styles.datePickerModalOverlay} onPress={cancelDatePicker}>
          <Pressable style={styles.datePickerModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerModalHeader}>
              <Text style={styles.datePickerModalTitle}>Seleccionar Fecha Fin</Text>
              <TouchableOpacity onPress={cancelDatePicker}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="spinner"
              onChange={handleDateFinChange}
              minimumDate={fechaInicio || undefined}
              maximumDate={new Date()}
              style={styles.datePicker}
            />
            <View style={styles.datePickerModalButtons}>
              <TouchableOpacity style={styles.datePickerCancelButton} onPress={cancelDatePicker}>
                <Text style={styles.datePickerCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.datePickerConfirmButton} onPress={confirmDateFin}>
                <Text style={styles.datePickerConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
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
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  typeFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#007AFF',
  },
  typeChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  dateRangeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dateRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickersContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  datePickerText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  datePickerTextSelected: {
    color: '#333',
    fontWeight: '600',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
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
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#999',
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSpace: {
    height: 100,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  // Estilos del modal de date picker
  datePickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  datePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  datePicker: {
    width: '100%',
    height: 200,
    marginLeft: -25, // Mover a la izquierda para centrar mejor
  },
  datePickerModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Estilos para el botón de eliminar en el modal de detalle
  deleteTransactionButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
  },
  deleteTransactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Estilos del modal de confirmación de eliminación
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deleteModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  deleteModalWarning: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  confirmDeleteButtonDisabled: {
    opacity: 0.6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
