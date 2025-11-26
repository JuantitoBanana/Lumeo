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
  TextInput,
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
import { useTranslation } from '../../hooks/useTranslation';
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
  onSave: (transaction: Transaccion) => void;
  onOpenDatePicker: () => void;
  fechaTransaccion: Date;
  onFechaTransaccionChange: (date: Date) => void;
  usuarioId: number | undefined; // ID del usuario actual para determinar rol
}

function TransactionDetailModal({ visible, onClose, transaction, currencySymbol, onDelete, onSave, onOpenDatePicker, fechaTransaccion, onFechaTransaccionChange, usuarioId }: TransactionDetailModalProps) {
  const { t, language } = useTranslation();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<'gasto' | 'ingreso'>('gasto');
  const [importe, setImporte] = useState('');
  const [saving, setSaving] = useState(false);

  // Determinar si el usuario actual es el creador o el destinatario
  const isCreador = transaction?.idUsuario === usuarioId;
  const isDestinatario = transaction?.idDestinatario === usuarioId;
  const isEditable = isCreador && !(transaction?.idEstado === 3 && transaction?.idDestinatario !== null); // El creador no puede editar si está pagada y tiene destinatario

  // Estado para controlar si ya se inicializaron los campos
  const [initialized, setInitialized] = useState(false);

  // Inicializar campos cuando se abre el modal con una transacción
  React.useEffect(() => {
    if (transaction && visible && !initialized) {
      setTitulo(transaction.titulo || '');
      
      // Si es destinatario, usar importe_destinatario, si es creador usar importe normal
      const importeAMostrar = isDestinatario && transaction.importeDestinatario 
        ? transaction.importeDestinatario 
        : transaction.importe;
      setImporte(Math.abs(importeAMostrar).toString());
      
      onFechaTransaccionChange(new Date(transaction.fechaTransaccion));

      // Determinar tipo basado en idTipo o nombre del tipo
      const isIncome = transaction.tipoTransaccion?.nombre?.toLowerCase().includes('ingreso') ||
        transaction.idTipo === 1;
      setTipo(isIncome ? 'ingreso' : 'gasto');
      
      setInitialized(true);
    }
  }, [transaction, visible, initialized]);

  // Resetear el estado de inicialización cuando cambia la transacción
  React.useEffect(() => {
    if (transaction) {
      setInitialized(false);
    }
  }, [transaction?.id]);

  const formatDateDisplay = (date: Date) => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mesKey = meses[date.getMonth()];
    const mesTraducido = t(`registerTransaction.months.${mesKey}`);
    const año = date.getFullYear();
    
    // Use different format for English vs Spanish
    return language === 'en' 
      ? `${mesTraducido} ${date.getDate()}, ${año}` 
      : `${dia} de ${mesTraducido} de ${año}`;
  };

  const handleImporteChange = (text: string) => {
    // Permitir solo números y comas/puntos decimales
    const cleaned = text.replace(/[^0-9.,]/g, '');

    // Validar formato: permitir una coma O un punto como separador decimal
    const parts = cleaned.split(/[.,]/);
    if (parts.length > 2) {
      return; // No permitir más de un separador decimal
    }
    if (parts[1] && parts[1].length > 2) {
      return; // Máximo 2 decimales
    }

    setImporte(cleaned);
  };

  const handleSave = async () => {
    if (!transaction?.id) return;

    // Si es destinatario, no puede editar campos, solo cambiar estados
    if (isDestinatario) {
      return; // El cambio de estado se maneja en handleAceptar y handlePagar
    }

    // Validación básica (solo para creadores)
    if (!titulo.trim()) {
      Alert.alert(t('common.error'), t('coinsScreen.errors.titleRequired'));
      return;
    }
    if (!importe || parseFloat(importe.replace(',', '.')) <= 0) {
      Alert.alert(t('common.error'), t('coinsScreen.errors.amountRequired'));
      return;
    }

    setSaving(true);

    try {
      // Crear objeto de transacción actualizado
      const updatedTransaction = {
        ...transaction,
        titulo: titulo.trim(),
        importe: parseFloat(importe.replace(',', '.')),
        fechaTransaccion: fechaTransaccion.toISOString().split('T')[0], // Formato: YYYY-MM-DD
        idTipo: tipo === 'ingreso' ? 1 : 2, // 1 = Ingreso, 2 = Gasto
      };

      // Actualizar en la API
      await apiClient.put(`/transacciones/${transaction.id}`, updatedTransaction);

      // Llamar al callback onSave
      onSave(updatedTransaction);

      // Cerrar modal
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar transacción:', error);
      Alert.alert(
        t('common.error'),
        t('coinsScreen.errors.saveError')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (transaction) {
      onDelete(transaction);
    }
  };

  const handleAceptar = async () => {
    if (!transaction?.id) return;

    setSaving(true);
    try {
      // Actualizar estado a "Aceptada" (id=2)
      const updatedTransaction = {
        ...transaction,
        idEstado: 2,
      };

      await apiClient.put(`/transacciones/${transaction.id}`, updatedTransaction);
      onSave(updatedTransaction);
      onClose();
    } catch (error: any) {
      console.error('Error al aceptar transacción:', error);
      Alert.alert(t('common.error'), t('coinsScreen.errors.updateStateError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePagar = async () => {
    if (!transaction?.id) return;

    setSaving(true);
    try {
      // Actualizar estado a "Pagada" (id=3)
      const updatedTransaction = {
        ...transaction,
        idEstado: 3,
      };

      await apiClient.put(`/transacciones/${transaction.id}`, updatedTransaction);
      onSave(updatedTransaction);
      onClose();
    } catch (error: any) {
      console.error('Error al marcar como pagada:', error);
      Alert.alert(t('common.error'), t('coinsScreen.errors.markPaidError'));
    } finally {
      setSaving(false);
    }
  };

  if (!transaction) return null;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditable ? t('coinsScreen.editTransaction') : t('coinsScreen.transactionDetail')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Contenido del modal */}
          <ScrollView 
            style={styles.modalBody} 
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            bounces={true}
          >
            {/* Título */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                {t('coinsScreen.title')} {isEditable && <Text style={styles.required}>{t('coinsScreen.required')}</Text>}
              </Text>
              {isEditable ? (
                <TextInput
                  style={styles.input}
                  placeholder={t('coinsScreen.titlePlaceholder')}
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.modalValue}>{titulo}</Text>
              )}
            </View>

            {/* Selector de tipo */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                {t('coinsScreen.type')} {isEditable && <Text style={styles.required}>{t('coinsScreen.required')}</Text>}
              </Text>
              {isEditable ? (
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      styles.typeButtonLeft,
                      tipo === 'gasto' && styles.typeButtonActive,
                    ]}
                    onPress={() => setTipo('gasto')}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={20}
                      color={tipo === 'gasto' ? '#fff' : '#FF6B6B'}
                    />
                    <Text style={[
                      styles.typeButtonText,
                      tipo === 'gasto' && styles.typeButtonTextActive,
                    ]}>
                      {t('coinsScreen.expense')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      styles.typeButtonRight,
                      tipo === 'ingreso' && styles.typeButtonActiveIngreso,
                    ]}
                    onPress={() => setTipo('ingreso')}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={20}
                      color={tipo === 'ingreso' ? '#fff' : '#4CAF50'}
                    />
                    <Text style={[
                      styles.typeButtonText,
                      tipo === 'ingreso' && styles.typeButtonTextActive,
                    ]}>
                      {t('coinsScreen.income')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.typeBadge, { backgroundColor: tipo === 'ingreso' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.typeText, { color: tipo === 'ingreso' ? '#4CAF50' : '#F44336' }]}>
                    {tipo === 'ingreso' ? t('coinsScreen.income') : t('coinsScreen.expense')}
                  </Text>
                </View>
              )}
            </View>

            {/* Importe */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                {t('coinsScreen.amount')} {isEditable && <Text style={styles.required}>{t('coinsScreen.required')}</Text>}
              </Text>
              {isEditable ? (
                <View style={styles.importeContainer}>
                  <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                  <TextInput
                    style={styles.importeInput}
                    placeholder="0,00"
                    value={importe}
                    onChangeText={handleImporteChange}
                    keyboardType="decimal-pad"
                    placeholderTextColor="#999"
                  />
                </View>
              ) : (
                <Text style={[styles.modalAmount, { color: tipo === 'ingreso' ? '#4CAF50' : '#F44336' }]}>
                  {currencySymbol}{importe}
                </Text>
              )}
            </View>

            {/* Fecha de transacción */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t('coinsScreen.date')} {isEditable && <Text style={styles.required}>*</Text>}
              </Text>
              {isEditable ? (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={onOpenDatePicker}
                >
                  <Ionicons name="calendar-outline" size={24} color="#007AFF" />
                  <View style={styles.datePickerTextContainer}>
                    <Text style={styles.datePickerTextSelected}>
                      {formatDateDisplay(fechaTransaccion)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </TouchableOpacity>
              ) : (
                <Text style={styles.modalValue}>{formatDateDisplay(fechaTransaccion)}</Text>
              )}
            </View>

            {/* Categoría (solo lectura) */}
            {transaction.categoria && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('coinsScreen.category')}</Text>
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

            {/* Nota si existe */}
            {transaction.nota && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('coinsScreen.note')}</Text>
                <Text style={styles.modalDescription}>{transaction.nota}</Text>
              </View>
            )}

            {/* Estado - Siempre mostrar para destinatarios, opcional para creadores */}
            {(isDestinatario || transaction.estadoTransaccion) && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('coinsScreen.state')}</Text>
                <Text style={styles.modalValue}>
                  {transaction.estadoTransaccion?.descripcion || transaction.estadoTransaccion?.nombre || t('coinsScreen.unknown')}
                </Text>
              </View>
            )}

            {/* Grupo si existe */}
            {transaction.grupo && (
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>{t('registerGroupTransaction.groupInfo')}</Text>
                <Text style={styles.modalValue}>{transaction.grupo.nombre}</Text>
              </View>
            )}

            <View style={styles.bottomSpace} />
          </ScrollView>

          {/* Botones de acción */}
          <View style={[
            styles.modalFooter,
            // Ocultar la línea divisoria cuando la transacción esté pagada y el usuario sea destinatario
            isDestinatario && transaction.idEstado === 3 && { borderTopWidth: 0 }
          ]}>
            {isEditable ? (
              // Botones para el creador de la transacción (puede editar)
              <>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>{t('coinsScreen.save')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteTransactionButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteTransactionButtonText}>{t('coinsScreen.delete')}</Text>
                </TouchableOpacity>
              </>
            ) : isCreador ? (
              // Botones para el creador cuando NO puede editar (transacción pagada con destinatario)
              <TouchableOpacity
                style={styles.deleteTransactionButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteTransactionButtonText}>{t('coinsScreen.delete')}</Text>
              </TouchableOpacity>
            ) : isDestinatario ? (
              // Botones para el destinatario
              <>
                {transaction.idEstado === 1 && ( // Pendiente -> Mostrar botón Aceptar
                  <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleAceptar}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>{t('coinsScreen.accept')}</Text>
                    )}
                  </TouchableOpacity>
                )}
                {transaction.idEstado === 2 && ( // Aceptada -> Mostrar botón Pagar
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: '#4CAF50' }, saving && styles.saveButtonDisabled]}
                    onPress={handlePagar}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>{t('coinsScreen.markAsPaid')}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : null}
          </View>
        </View>
      </View>
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
  const { t } = useTranslation();
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

  // Estados para el date picker del modal de transacción
  const [showTransactionDatePicker, setShowTransactionDatePicker] = useState(false);
  const [transactionDateTemp, setTransactionDateTemp] = useState<Date>(new Date());
  const [editingTransactionDate, setEditingTransactionDate] = useState<Date>(new Date());

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
    if (!date) return t('registerTransaction.selectDate');
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Handlers para los date pickers
  const handleDateInicioChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerInicio(false);
      if (event.type === 'set' && selectedDate) {
        setFechaInicio(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePickerFin(false);
      if (event.type === 'set' && selectedDate) {
        setFechaFin(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
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

  const handleOpenTransactionDatePicker = () => {
    // Cerrar el modal de detalle temporalmente
    setModalVisible(false);
    // Esperar a que se cierre antes de abrir el date picker
    setTimeout(() => {
      setTransactionDateTemp(editingTransactionDate);
      setShowTransactionDatePicker(true);
    }, 100);
  };

  const handleTransactionDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTransactionDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setEditingTransactionDate(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTransactionDateTemp(selectedDate);
      }
    }
  };

  const confirmTransactionDate = () => {
    setEditingTransactionDate(transactionDateTemp);
    setShowTransactionDatePicker(false);
    // Reabrir el modal de detalle después de confirmar
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
  };

  const cancelTransactionDatePicker = () => {
    setShowTransactionDatePicker(false);
    // Reabrir el modal de detalle después de cancelar
    setTimeout(() => {
      setModalVisible(true);
    }, 100);
  };

  const clearDateRange = () => {
    setFechaInicio(null);
    setFechaFin(null);
  };

  // Extraer categorías únicas de las transacciones
  const categories = ['Todas', ...Array.from(new Set(transacciones
    .map(t => t.categoria?.nombre)
    .filter(Boolean) as string[]))];

  const types = [t('coinsScreen.all'), t('coinsScreen.incomeType'), t('coinsScreen.expensesType')];

  const handleTransactionPress = (transaction: Transaccion) => {
    setSelectedTransaction(transaction);
    setEditingTransactionDate(new Date(transaction.fechaTransaccion));
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

  const handleSaveTransaction = (updatedTransaction: Transaccion) => {
    // Refrescar la lista de transacciones para obtener los datos actualizados
    refetchTransacciones();

    // Cerrar modal
    setModalVisible(false);
    setTimeout(() => setSelectedTransaction(null), 300);
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
      Alert.alert(t('common.error'), t('coinsScreen.errors.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  // Filtrar transacciones
  const filteredTransactions = transacciones.filter((transaction) => {
    if (selectedCategory && selectedCategory !== 'Todas' && transaction.categoria?.nombre !== selectedCategory) {
      return false;
    }
    if (selectedType && selectedType !== t('coinsScreen.all')) {
      const isIncome = transaction.tipoTransaccion?.nombre?.toLowerCase().includes('ingreso') ||
        transaction.idTipo === 1;
      if (selectedType === t('coinsScreen.incomeType') && !isIncome) return false;
      if (selectedType === t('coinsScreen.expensesType') && isIncome) return false;
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
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>{t('transactions.title')}</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {/* Filtro por categoría */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>{t('coinsScreen.category')}</Text>
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
          <Text style={styles.filterLabel}>{t('coinsScreen.type')}</Text>
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
            <Text style={styles.filterLabel}>{t('coins.dateRange')}</Text>
            {(fechaInicio || fechaFin) && (
              <TouchableOpacity onPress={clearDateRange} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>{t('coins.clear')}</Text>
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
                <Text style={styles.datePickerLabel}>{t('coins.from')}</Text>
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
                <Text style={styles.datePickerLabel}>{t('coins.to')}</Text>
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
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
            <Text style={styles.emptyText}>{t('common.error')}</Text>
            <Text style={styles.emptySubtext}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={refetchTransacciones}
            >
              <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>{t('coinsScreen.noTransactions')}</Text>
            <Text style={styles.emptySubtext}>
              {t('coinsScreen.noTransactionsSubtext')}
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
        onSave={handleSaveTransaction}
        onOpenDatePicker={handleOpenTransactionDatePicker}
        fechaTransaccion={editingTransactionDate}
        onFechaTransaccionChange={setEditingTransactionDate}
        usuarioId={usuario?.id}
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
              <Text style={styles.deleteModalTitle}>{t('transactions.deleteTransaction')}</Text>
            </View>

            <Text style={styles.deleteModalMessage}>
              {t('coinsScreen.deleteConfirm', { title: transactionToDelete?.titulo || '' })}
            </Text>
            <Text style={styles.deleteModalWarning}>
              {t('coinsScreen.deleteWarning')}
            </Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCloseDeleteModal}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmDeleteButton, deleting && styles.confirmDeleteButtonDisabled]}
                onPress={handleDeleteTransaction}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>{t('common.delete')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker para Fecha Inicio - Android usa picker nativo, iOS usa modal */}
      {Platform.OS === 'android' ? (
        showDatePickerInicio && (
          <DateTimePicker
            value={fechaInicio || new Date()}
            mode="date"
            display="default"
            onChange={handleDateInicioChange}
            maximumDate={fechaFin || undefined}
            locale="es"
          />
        )
      ) : (
        <Modal visible={showDatePickerInicio} transparent={true} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cancelDatePicker}>
            <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>{t('coins.selectStartDate')}</Text>
                <TouchableOpacity onPress={cancelDatePicker}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateInicioChange}
                  maximumDate={fechaFin || undefined}
                  locale="es"
                  textColor="#000000"
                />
              </View>
              <View style={styles.datePickerButtons}>
                <TouchableOpacity style={styles.datePickerCancelButton} onPress={cancelDatePicker}>
                  <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePickerConfirmButton} onPress={confirmDateInicio}>
                  <Text style={styles.datePickerConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Date Picker para Fecha Fin - Android usa picker nativo, iOS usa modal */}
      {Platform.OS === 'android' ? (
        showDatePickerFin && (
          <DateTimePicker
            value={fechaFin || new Date()}
            mode="date"
            display="default"
            onChange={handleDateFinChange}
            minimumDate={fechaInicio || undefined}
            locale="es"
          />
        )
      ) : (
        <Modal visible={showDatePickerFin} transparent={true} animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={cancelDatePicker}>
            <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>{t('coins.selectEndDate')}</Text>
                <TouchableOpacity onPress={cancelDatePicker}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateFinChange}
                  minimumDate={fechaInicio || undefined}
                  locale="es"
                  textColor="#000000"
                />
              </View>
              <View style={styles.datePickerButtons}>
                <TouchableOpacity style={styles.datePickerCancelButton} onPress={cancelDatePicker}>
                  <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.datePickerConfirmButton} onPress={confirmDateFin}>
                  <Text style={styles.datePickerConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Date Picker para Transacción - Android usa picker nativo, iOS usa modal */}
      {Platform.OS === 'android' ? (
        showTransactionDatePicker && (
          <DateTimePicker
            value={transactionDateTemp}
            mode="date"
            display="default"
            onChange={handleTransactionDateChange}
            locale="es"
          />
        )
      ) : (
        <Modal visible={showTransactionDatePicker} transparent={true} animationType="fade" onRequestClose={cancelTransactionDatePicker}>
          <Pressable style={styles.modalOverlay} onPress={cancelTransactionDatePicker}>
            <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>{t('registerTransaction.selectDate')}</Text>
              </View>

              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={transactionDateTemp}
                  mode="date"
                  display="spinner"
                  onChange={handleTransactionDateChange}
                  locale="es"
                  textColor="#000000"
                />
              </View>

              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={styles.datePickerCancelButton}
                  onPress={cancelTransactionDatePicker}
                >
                  <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.datePickerConfirmButton}
                  onPress={confirmTransactionDate}
                >
                  <Text style={styles.datePickerConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
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
    paddingVertical: 8,
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
  datePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  datePickerHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  datePickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePicker: {
    width: '100%',
    height: 200,
    marginLeft: -25, // Mover a la izquierda para centrar mejor
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
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
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteTransactionButtonText: {
    fontSize: 16,
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
  // Estilos para el modal editable
  required: {
    color: '#FF6B6B',
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  typeButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#E0E0E0',
  },
  typeButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  typeButtonActiveIngreso: {
    backgroundColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  importeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  importeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'flex-end',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
