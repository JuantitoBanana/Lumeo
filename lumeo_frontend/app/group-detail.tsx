import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { grupoService, GrupoConMiembros } from '@/services/grupo.service';
import { transaccionGrupalService, TransaccionGrupal } from '@/services/transaccion-grupal.service';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';
import { formatearCantidad } from '@/lib/currency-utils';
import { useTranslation } from '../hooks/useTranslation';

// Modal de detalle de transacción grupal
interface TransactionGroupDetailModalProps {
  visible: boolean;
  onClose: () => void;
  transactionId: number | null;
  usuarioId: number | undefined;
  currencySymbol: string;
  onDelete: () => void;
}

function TransactionGroupDetailModal({
  visible,
  onClose,
  transactionId,
  usuarioId,
  currencySymbol,
  onDelete,
}: TransactionGroupDetailModalProps) {
  const { t } = useTranslation();
  const [transaccion, setTransaccion] = useState<TransaccionGrupal | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (visible && transactionId && usuarioId) {
      loadTransactionDetail();
    }
  }, [visible, transactionId, usuarioId]);

  const loadTransactionDetail = async () => {
    if (!transactionId || !usuarioId) return;

    setLoading(true);
    try {
      const data = await transaccionGrupalService.getByIdConDetalle(transactionId, usuarioId);
      setTransaccion(data);
    } catch (error) {
      console.error('Error al cargar detalle de transacción grupal:', error);
      Alert.alert('Error', 'No se pudo cargar el detalle de la transacción');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const position = transaccion?.posicionSimbolo || 'DESPUES';
    return formatearCantidad(Math.abs(amount), currencySymbol, position);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const dia = date.getDate().toString().padStart(2, '0');
    const mes = meses[date.getMonth()];
    const año = date.getFullYear();

    return `${dia} de ${mes} de ${año}`;
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Transacción',
      '¿Estás seguro de que deseas eliminar esta transacción grupal?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!transactionId) return;

    setDeleting(true);
    try {
      await transaccionGrupalService.delete(transactionId);
      Alert.alert('Éxito', 'Transacción eliminada correctamente');
      onClose();
      onDelete(); // Refrescar lista
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      Alert.alert('Error', 'No se pudo eliminar la transacción');
    } finally {
      setDeleting(false);
    }
  };

  if (!transaccion && !loading) return null;

  const isIngreso = transaccion?.idTipo === 1;

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
            <Text style={styles.modalTitle}>Detalle de Transacción</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Contenido del modal */}
          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.modalLoadingText}>Cargando...</Text>
            </View>
          ) : transaccion ? (
            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              contentContainerStyle={styles.modalScrollContent}
              bounces={true}
            >
              {/* Título */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Título</Text>
                <Text style={styles.transactionTitleValue}>{transaccion.titulo}</Text>
              </View>

              {/* Tipo */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Tipo</Text>
                <View style={styles.typeBadgeContainer}>
                  <View style={[styles.typeBadge, { backgroundColor: isIngreso ? '#E8F5E9' : '#FFEBEE' }]}>
                    <Text style={[styles.typeText, { color: isIngreso ? '#4CAF50' : '#F44336' }]}>
                      {transaccion.nombreTipo || (isIngreso ? 'Ingreso' : 'Gasto')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Importe Total */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Importe Total</Text>
                <Text style={[styles.totalAmount, { color: isIngreso ? '#4CAF50' : '#F44336' }]}>
                  {isIngreso ? '+' : '-'}{formatCurrency(transaccion.importe)}
                </Text>
                {transaccion.nombreCategoria && (
                  <View style={styles.categoryContainer}>
                    <Ionicons name="pricetag-outline" size={16} color="#666" />
                    <Text style={styles.categoryText}>{transaccion.nombreCategoria}</Text>
                  </View>
                )}
              </View>

              {/* División de Importes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>División por Persona</Text>
                {transaccion.transaccionesIndividuales && transaccion.transaccionesIndividuales.length > 0 ? (
                  <View style={styles.divisionList}>
                    {transaccion.transaccionesIndividuales.map((individual) => {
                      const nombreCompleto = individual.nombre && individual.apellido 
                        ? `${individual.nombre} ${individual.apellido}` 
                        : individual.nombre || 'Usuario';
                      const username = individual.nombreUsuario || `usuario_${individual.idUsuario}`;
                      
                      return (
                        <View key={individual.id} style={styles.divisionItem}>
                          <View style={styles.personInfo}>
                            <View style={styles.personIconContainer}>
                              <Ionicons name="person" size={20} color="#007AFF" />
                            </View>
                            <View style={styles.personNameContainer}>
                              <Text style={styles.personName}>{nombreCompleto}</Text>
                              <Text style={styles.personUsername}>@{username}</Text>
                            </View>
                          </View>
                          <Text style={[styles.personAmount, { color: isIngreso ? '#4CAF50' : '#F44336' }]}>
                            {formatCurrency(individual.importe)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.noDataText}>No hay división de importes disponible</Text>
                )}
              </View>

              {/* Detalles Adicionales */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Información Adicional</Text>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>{formatDate(transaccion.fechaTransaccion)}</Text>
                  </View>
                </View>

                {transaccion.nombreGrupo && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="people-outline" size={20} color="#666" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Grupo</Text>
                      <Text style={styles.detailValue}>{transaccion.nombreGrupo}</Text>
                    </View>
                  </View>
                )}

                {transaccion.nota && (
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Ionicons name="document-text-outline" size={20} color="#666" />
                    </View>
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Nota</Text>
                      <Text style={styles.detailValue}>{transaccion.nota}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.bottomSpace} />
            </ScrollView>
          ) : null}

          {/* Footer con botón de eliminar */}
          {!loading && transaccion && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idGrupo = params.id ? Number(params.id) : null;
  
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const { currencySymbol } = useCurrencySymbol();
  const [grupoData, setGrupoData] = useState<GrupoConMiembros | null>(null);
  const [transacciones, setTransacciones] = useState<TransaccionGrupal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransacciones, setLoadingTransacciones] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el modal de detalle de transacción
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);

  // Estados para el modal de añadir miembro
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [nombreUsuarioNuevo, setNombreUsuarioNuevo] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    if (idGrupo && usuario?.id) {
      fetchGrupoData();
      fetchTransacciones();
    }
  }, [idGrupo, usuario?.id]);

  const fetchGrupoData = async () => {
    if (!idGrupo) return;

    try {
      setLoading(true);
      const data = await grupoService.obtenerGrupoConMiembros(idGrupo);
      setGrupoData(data);
    } catch (err: any) {
      console.error('Error al cargar grupo:', err);
      setError(err.message || 'Error al cargar el grupo');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransacciones = async () => {
    if (!idGrupo || !usuario?.id) return;

    try {
      setLoadingTransacciones(true);
      const data = await transaccionGrupalService.getByGrupo(idGrupo, usuario.id);
      setTransacciones(data);
    } catch (err: any) {
      console.error('Error al cargar transacciones grupales:', err);
    } finally {
      setLoadingTransacciones(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, posicionSimbolo?: string) => {
    const position = posicionSimbolo || 'DESPUES';
    return formatearCantidad(Math.abs(amount), currencySymbol, position);
  };

  const handleAddMembers = () => {
    setNombreUsuarioNuevo('');
    setAddMemberModalVisible(true);
  };

  const handleCancelAddMember = () => {
    setAddMemberModalVisible(false);
    setNombreUsuarioNuevo('');
  };

  const handleConfirmAddMember = async () => {
    if (!nombreUsuarioNuevo.trim()) {
      Alert.alert('Error', 'Por favor, introduce un nombre de usuario');
      return;
    }

    if (!idGrupo) {
      Alert.alert('Error', 'No se puede añadir miembro sin ID de grupo');
      return;
    }

    setAddingMember(true);

    try {
      // Verificar si el usuario existe
      const response = await grupoService.verificarUsuario(nombreUsuarioNuevo.trim());

      if (!response.existe || !response.idUsuario) {
        Alert.alert(
          'Usuario no encontrado',
          `El usuario "${nombreUsuarioNuevo}" no existe en el sistema.`
        );
        setAddingMember(false);
        return;
      }

      // Verificar si el usuario ya es miembro del grupo
      const yaEsMiembro = grupoData?.miembros.some(m => m.idUsuario === response.idUsuario);
      if (yaEsMiembro) {
        Alert.alert('Usuario ya existe', `El usuario ${response.nombreUsuario} ya es miembro de este grupo.`);
        setAddingMember(false);
        return;
      }

      // Añadir el usuario al grupo
      try {
        await grupoService.agregarMiembroAGrupo(idGrupo, nombreUsuarioNuevo.trim());
        Alert.alert('Éxito', `Usuario ${response.nombreUsuario} añadido al grupo correctamente`);
        
        // Recargar datos del grupo
        await fetchGrupoData();
        
        setAddMemberModalVisible(false);
        setNombreUsuarioNuevo('');
      } catch (error: any) {
        // Si el endpoint no está implementado (404), mostrar mensaje temporal
        if (error?.response?.status === 404) {
          Alert.alert(
            'Función en desarrollo',
            'El endpoint para añadir miembros aún no está implementado en el backend.'
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error al añadir miembro:', error);
      Alert.alert('Error', 'No se pudo añadir el miembro al grupo');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCreateGroupTransaction = () => {
    if (idGrupo) {
      router.push(`/register-group-transaction?idGrupo=${idGrupo}`);
    }
  };

  const handleTransactionPress = (transactionId: number) => {
    setSelectedTransactionId(transactionId);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedTransactionId(null), 300);
  };

  const handleDeleteTransaction = () => {
    // Refrescar las transacciones después de eliminar
    fetchTransacciones();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando grupo...</Text>
        </View>
      </View>
    );
  }

  if (error || !grupoData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error || 'Grupo no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {grupoData.grupo.nombre}
        </Text>
        <TouchableOpacity 
          style={styles.membersButton} 
          onPress={() => router.push(`/group-members?idGrupo=${idGrupo}`)}
        >
          <Ionicons name="person" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Descripción del grupo */}
        {grupoData.grupo.descripcion && (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionLabel}>Descripción</Text>
            <Text style={styles.descriptionText}>{grupoData.grupo.descripcion}</Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddMembers}
          >
            <Ionicons name="person-add" size={24} color="#007AFF" />
            <Text style={styles.actionButtonText}>Añadir personas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={handleCreateGroupTransaction}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
              Crear transacción
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sección de transacciones */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Transacciones del grupo</Text>
          
          {loadingTransacciones ? (
            <View style={styles.loadingTransactions}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingTransactionsText}>Cargando...</Text>
            </View>
          ) : transacciones.length === 0 ? (
            <View style={styles.emptyTransactions}>
              <Ionicons name="receipt-outline" size={48} color="#999" />
              <Text style={styles.emptyTransactionsText}>Sin transacciones</Text>
              <Text style={styles.emptyTransactionsSubtext}>
                Aún no hay transacciones en este grupo
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transacciones.map((transaccion) => (
                <TouchableOpacity 
                  key={transaccion.id} 
                  style={styles.transactionCard}
                  onPress={() => handleTransactionPress(transaccion.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: '#007AFF' }
                    ]}>
                      <Text style={styles.transactionIcon}>💰</Text>
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>{transaccion.titulo}</Text>
                      <Text style={styles.transactionCategory}>
                        {transaccion.nombreCategoria || 'Sin categoría'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: transaccion.idTipo === 1 ? '#34C759' : '#FF3B30' }
                    ]}>
                      {transaccion.idTipo === 1 ? '+' : '-'}
                      {formatCurrency(transaccion.importe)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaccion.fechaTransaccion)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal de detalle de transacción grupal */}
      <TransactionGroupDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        transactionId={selectedTransactionId}
        usuarioId={usuario?.id}
        currencySymbol={currencySymbol}
        onDelete={handleDeleteTransaction}
      />

      {/* Modal de añadir miembro */}
      <Modal visible={addMemberModalVisible} transparent={true} animationType="fade" onRequestClose={handleCancelAddMember}>
        <View style={styles.addMemberModalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={handleCancelAddMember}
          />
          <View style={styles.addMemberModalContent}>
            <Text style={styles.addMemberModalTitle}>Añadir Miembro</Text>
            
            <View style={styles.addMemberDivider} />
            
            <View style={styles.addMemberInputContainer}>
              <Text style={styles.addMemberLabel}>Nombre de usuario</Text>
              <TextInput
                style={styles.addMemberInput}
                placeholder="Introduce el nombre de usuario"
                value={nombreUsuarioNuevo}
                onChangeText={setNombreUsuarioNuevo}
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.addMemberButtonsContainer}>
              <TouchableOpacity
                style={[styles.addMemberButton, styles.addMemberCancelButton]}
                onPress={handleCancelAddMember}
                disabled={addingMember}
              >
                <Text style={styles.addMemberCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.addMemberButton, styles.addMemberConfirmButton, addingMember && styles.addMemberButtonDisabled]}
                onPress={handleConfirmAddMember}
                disabled={addingMember}
              >
                {addingMember ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.addMemberConfirmButtonText}>Añadir</Text>
                )}
              </TouchableOpacity>
            </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  membersButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
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
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionButtonTextPrimary: {
    color: '#FFFFFF',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  loadingTransactions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingTransactionsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  emptyTransactions: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyTransactionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptyTransactionsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  bottomSpace: {
    height: 40,
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
    width: '90%',
    maxHeight: '85%',
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
  modalLoadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  modalBody: {
    padding: 20,
    maxHeight: 500,
  },
  modalSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  typeBadgeContainer: {
    alignSelf: 'flex-start',
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  transactionTitleValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  divisionList: {
    gap: 10,
  },
  divisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  personInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  personIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personNameContainer: {
    flex: 1,
  },
  personName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  personUsername: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  personAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIcon: {
    width: 32,
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Estilos del modal de añadir miembro
  addMemberModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemberModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  addMemberModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  addMemberDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 20,
  },
  addMemberInputContainer: {
    marginBottom: 24,
  },
  addMemberLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  addMemberInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addMemberButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  addMemberButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberCancelButton: {
    backgroundColor: '#F0F0F0',
  },
  addMemberConfirmButton: {
    backgroundColor: '#007AFF',
  },
  addMemberButtonDisabled: {
    opacity: 0.6,
  },
  addMemberCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addMemberConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

