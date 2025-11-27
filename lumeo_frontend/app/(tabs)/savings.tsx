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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useMetasAhorro } from '@/hooks/useMetasAhorro';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { formatearCantidad } from '@/lib/currency-utils';
import apiClient from '@/lib/api-client';
import AddMoneyModal from '@/app/add-money-modal';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from '../../hooks/useTranslation';

export default function SavingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { metas, loading, error, refetch } = useMetasAhorro();
  const { currencySymbol } = useCurrencySymbol();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMeta, setSelectedMeta] = useState<{
    id: number;
    titulo: string;
    cantidadActual: number;
    cantidadObjetivo: number;
  } | null>(null);
  const [metaToDelete, setMetaToDelete] = useState<{
    id: number;
    titulo: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'metas' | 'presupuestos'>('metas');

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

  const handleOpenDeleteModal = (meta: any) => {
    setMetaToDelete({
      id: meta.id,
      titulo: meta.titulo,
    });
    setDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalVisible(false);
    setMetaToDelete(null);
  };

  const handleDeleteMeta = async () => {
    if (!metaToDelete) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/metas-ahorro/${metaToDelete.id}`);
      
      // Cerrar modal y refrescar lista
      setDeleteModalVisible(false);
      setMetaToDelete(null);
      refetch();
    } catch (err: any) {
      console.error('Error al eliminar meta:', err);
      Alert.alert('Error', t('savings.deleteError'));
    } finally {
      setDeleting(false);
    }
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
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>{t('savings.loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.emptyText}>{t('savings.errorLoading')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>{t('savings.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (metas.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="wallet-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>{t('savings.noGoals')}</Text>
          <Text style={styles.emptySubtext}>
            {t('savings.noGoalsText')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.metasList} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
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
                    <Ionicons name="add-circle" size={32} color="#FF9500" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleOpenDeleteModal(meta)}
                  >
                    <Ionicons name="trash-outline" size={28} color="#FF3B30" />
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

  const handleNavigate = () => {
    setPickerModalVisible(false);
    if (selectedOption === 'metas') {
      router.push('/(tabs)/savings');
    } else if (selectedOption === 'presupuestos') {
      router.push('/(tabs)/budgets');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTitleButton}
          onPress={() => setPickerModalVisible(true)}
        >
          <Ionicons name="chevron-down" size={20} color="#000" />
          <Text style={styles.headerTitle}>{t('savingsScreen.title')}</Text>
        </TouchableOpacity>
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

      {/* Modal de confirmación para eliminar */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseDeleteModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseDeleteModal}>
          <Pressable style={styles.deleteModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.deleteModalHeader}>
              <Ionicons name="warning" size={48} color="#FF3B30" />
              <Text style={styles.deleteModalTitle}>{t('savingsScreen.deleteGoalTitle')}</Text>
            </View>
            
            <Text style={styles.deleteModalMessage}>
              {t('savingsScreen.deleteGoalMessage', { title: metaToDelete?.titulo || '' })}
            </Text>
            <Text style={styles.deleteModalWarning}>
              {t('savingsScreen.deleteGoalWarning')}
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
                onPress={handleDeleteMeta}
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

      {/* Modal para seleccionar navegación */}
      <Modal
        visible={pickerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={() => setPickerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('savingsScreen.selectOption')}</Text>
            
            <TouchableOpacity 
              style={[styles.optionCard, styles.optionCardSelected]}
              onPress={() => setPickerModalVisible(false)}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="wallet" size={24} color="#34C759" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{t('savingsScreen.savingsGoals')}</Text>
                <Text style={styles.optionDescription}>{t('savingsScreen.savingsDescription')}</Text>
              </View>
              <View style={styles.activeIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionCard}
              onPress={() => {
                setPickerModalVisible(false);
                router.push('/(tabs)/budgets');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="pie-chart" size={24} color="#FF9500" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>{t('savingsScreen.budgets')}</Text>
                <Text style={styles.optionDescription}>{t('savingsScreen.budgetsDescription')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerCancelButton}
              onPress={() => setPickerModalVisible(false)}
            >
              <Text style={styles.pickerCancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#FF9500',
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
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
  },
  addButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    backgroundColor: '#FF9500',
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
    backgroundColor: '#FF9500',
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
  // Estilos del modal de confirmación de eliminación
  modalOverlay: {
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
  // Estilos para el modal de selección de navegación
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: '85%',
    maxWidth: 340,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#F1F8E9',
    borderColor: '#34C759',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  activeIndicator: {
    marginLeft: 8,
  },
  pickerCancelButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
