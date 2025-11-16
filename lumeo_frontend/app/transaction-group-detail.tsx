import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { transaccionGrupalService, TransaccionGrupal } from '@/services/transaccion-grupal.service';
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol';

export default function TransactionGroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idTransaccion = params.idTransaccion ? parseInt(params.idTransaccion as string) : null;
  
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const [transaccion, setTransaccion] = useState<TransaccionGrupal | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const currencySymbol = useCurrencySymbol();

  useEffect(() => {
    if (idTransaccion && usuario?.id) {
      loadTransaccion();
    }
  }, [idTransaccion, usuario?.id]);

  const loadTransaccion = async () => {
    if (!idTransaccion || !usuario?.id) return;
    
    setLoading(true);
    try {
      const data = await transaccionGrupalService.getByIdConDetalle(idTransaccion, usuario.id);
      setTransaccion(data);
    } catch (error) {
      console.error('Error al cargar transacción grupal:', error);
      Alert.alert('Error', 'No se pudo cargar la transacción');
      router.back();
    } finally {
      setLoading(false);
    }
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
    if (!idTransaccion) return;
    
    setDeleting(true);
    try {
      await transaccionGrupalService.delete(idTransaccion);
      Alert.alert('Éxito', 'Transacción eliminada correctamente');
      router.back();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      Alert.alert('Error', 'No se pudo eliminar la transacción');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = amount.toFixed(2);
    return transaccion?.posicionSimbolo === 'ANTES' 
      ? `${currencySymbol}${formatted}` 
      : `${formatted} ${currencySymbol}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading || loadingUsuario) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando transacción...</Text>
      </View>
    );
  }

  if (!transaccion) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se pudo cargar la transacción</Text>
        </View>
      </View>
    );
  }

  const isIngreso = transaccion.idTipo === 1;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Transacción</Text>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Título y Tipo */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.transactionTitle}>{transaccion.titulo}</Text>
            <View style={[styles.typeBadge, { backgroundColor: isIngreso ? '#34C759' : '#FF3B30' }]}>
              <Text style={styles.typeBadgeText}>{transaccion.nombreTipo || (isIngreso ? 'Ingreso' : 'Gasto')}</Text>
            </View>
          </View>
        </View>

        {/* Importe Total */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Importe Total</Text>
          <Text style={[styles.totalAmount, { color: isIngreso ? '#34C759' : '#FF3B30' }]}>
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
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>División por Persona</Text>
          {transaccion.transaccionesIndividuales && transaccion.transaccionesIndividuales.length > 0 ? (
            <View style={styles.divisionList}>
              {transaccion.transaccionesIndividuales.map((individual, index) => (
                <View key={individual.id} style={styles.divisionItem}>
                  <View style={styles.personInfo}>
                    <View style={styles.personIconContainer}>
                      <Ionicons name="person" size={20} color="#007AFF" />
                    </View>
                    <Text style={styles.personName}>
                      {individual.nombreUsuario || `Usuario ${individual.idUsuario}`}
                    </Text>
                  </View>
                  <Text style={[styles.personAmount, { color: isIngreso ? '#34C759' : '#FF3B30' }]}>
                    {formatCurrency(individual.importe)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>No hay división de importes disponible</Text>
          )}
        </View>

        {/* Detalles Adicionales */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>
          
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
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  transactionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
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
    gap: 12,
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
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  personAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailIcon: {
    width: 40,
    paddingTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  bottomSpace: {
    height: 40,
  },
});
