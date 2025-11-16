import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { grupoService, GrupoConMiembros, MiembroGrupo } from '@/services/grupo.service';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';

export default function GroupMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idGrupo = params.idGrupo ? Number(params.idGrupo) : null;
  const { usuario } = useUsuarioApi();
  
  const [grupoData, setGrupoData] = useState<GrupoConMiembros | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);

  // Verificar si el usuario actual es el creador del grupo
  const isCreador = grupoData?.grupo.idCreador === usuario?.id;

  useEffect(() => {
    if (idGrupo) {
      fetchGrupoData();
    }
  }, [idGrupo]);

  const fetchGrupoData = async () => {
    if (!idGrupo) return;

    try {
      setLoading(true);
      const data = await grupoService.obtenerGrupoConMiembros(idGrupo);
      setGrupoData(data);
    } catch (error) {
      console.error('Error al cargar grupo:', error);
      Alert.alert('Error', 'No se pudo cargar la información del grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = (miembro: MiembroGrupo) => {
    Alert.alert(
      'Eliminar miembro',
      `¿Estás seguro de que deseas eliminar a ${miembro.nombre} ${miembro.apellido} del grupo?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => confirmDeleteMember(miembro.idUsuario),
        },
      ]
    );
  };

  const confirmDeleteMember = async (idUsuario: number) => {
    if (!idGrupo) return;

    setDeletingMemberId(idUsuario);

    try {
      // TODO: Implementar endpoint para eliminar miembro del grupo
      await grupoService.eliminarMiembroDeGrupo(idGrupo, idUsuario);
      Alert.alert('Éxito', 'Miembro eliminado del grupo correctamente');
      await fetchGrupoData();
    } catch (error: any) {
      console.error('Error al eliminar miembro:', error);
      if (error?.response?.status === 404) {
        Alert.alert(
          'Función en desarrollo',
          'El endpoint para eliminar miembros aún no está implementado en el backend.'
        );
      } else {
        Alert.alert('Error', 'No se pudo eliminar el miembro del grupo');
      }
    } finally {
      setDeletingMemberId(null);
    }
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
          <Text style={styles.headerTitle}>Miembros del Grupo</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando miembros...</Text>
        </View>
      </View>
    );
  }

  if (!grupoData) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Miembros del Grupo</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>No se pudo cargar el grupo</Text>
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
        <Text style={styles.headerTitle}>Miembros del Grupo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Información del grupo */}
        <View style={styles.groupInfoCard}>
          <Text style={styles.groupName}>{grupoData.grupo.nombre}</Text>
          <Text style={styles.memberCount}>
            {grupoData.miembros.length} {grupoData.miembros.length === 1 ? 'miembro' : 'miembros'}
          </Text>
        </View>

        {/* Lista de miembros */}
        <View style={styles.membersSection}>
          {grupoData.miembros.map((miembro) => {
            // Mostrar botón de eliminar solo si el usuario actual es el creador
            // y el miembro no es el creador
            const showDeleteButton = isCreador && miembro.idUsuario !== grupoData.grupo.idCreador;
            
            return (
              <View key={miembro.idUsuario} style={styles.memberCard}>
                <View style={styles.memberLeft}>
                  <View style={styles.memberIconContainer}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {miembro.nombre} {miembro.apellido}
                    </Text>
                    <Text style={styles.memberUsername}>@{miembro.nombreUsuario}</Text>
                  </View>
                </View>
                {showDeleteButton && (
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      deletingMemberId === miembro.idUsuario && styles.deleteButtonDisabled
                    ]}
                    onPress={() => handleDeleteMember(miembro)}
                    disabled={deletingMemberId === miembro.idUsuario}
                  >
                    {deletingMemberId === miembro.idUsuario ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
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
    paddingTop: 60,
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
  groupInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
  },
  membersSection: {
    gap: 12,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  memberLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  memberUsername: {
    fontSize: 14,
    color: '#007AFF',
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  bottomSpace: {
    height: 40,
  },
});
