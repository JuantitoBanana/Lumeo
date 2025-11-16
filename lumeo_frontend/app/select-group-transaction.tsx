import React, { useEffect, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useGrupos } from '@/hooks/useGrupos';

export default function SelectGroupTransactionScreen() {
  const router = useRouter();
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const { grupos, loading: loadingGrupos, refetch } = useGrupos();

  useEffect(() => {
    if (usuario) {
      refetch();
    }
  }, [usuario]);

  const handleSelectGroup = (idGrupo: number) => {
    router.push(`/register-group-transaction?idGrupo=${idGrupo}`);
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  if (loadingUsuario || loadingGrupos) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Grupo</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando grupos...</Text>
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
        <Text style={styles.headerTitle}>Seleccionar Grupo</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            Selecciona un grupo para crear una transacción grupal
          </Text>
        </View>

        {/* Lista de grupos */}
        {grupos.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={80} color="#CCC" />
            <Text style={styles.emptyTitle}>No tienes grupos</Text>
            <Text style={styles.emptySubtitle}>
              Crea un grupo para empezar a registrar transacciones grupales
            </Text>
            <TouchableOpacity 
              style={styles.createGroupButton}
              onPress={handleCreateGroup}
            >
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.createGroupButtonText}>Crear Grupo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.groupsContainer}>
            {grupos.map((grupo) => {
              const miembrosSinUsuarioActual = grupo.miembros.filter(
                m => m.idUsuario !== usuario?.id
              );
              const miembrosVisibles = miembrosSinUsuarioActual.slice(0, 3);
              const miembrosRestantes = miembrosSinUsuarioActual.length - 3;

              return (
                <TouchableOpacity
                  key={grupo.grupo.id}
                  style={styles.groupCard}
                  onPress={() => grupo.grupo.id && handleSelectGroup(grupo.grupo.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.groupIconContainer}>
                    <Ionicons name="people" size={32} color="#007AFF" />
                  </View>
                  
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{grupo.grupo.nombre}</Text>
                    
                    <View style={styles.membersRow}>
                      <View style={styles.avatarsContainer}>
                        {miembrosVisibles.map((miembro, index) => (
                          <View
                            key={miembro.idUsuario}
                            style={[
                              styles.avatar,
                              { zIndex: miembrosVisibles.length - index }
                            ]}
                          >
                            <Text style={styles.avatarText}>
                              {miembro.nombreUsuario.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ))}
                        {miembrosRestantes > 0 && (
                          <View style={[styles.avatar, styles.avatarExtra]}>
                            <Text style={styles.avatarExtraText}>+{miembrosRestantes}</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.memberCount}>
                        {miembrosSinUsuarioActual.length} miembro{miembrosSinUsuarioActual.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={24} color="#CCC" />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {grupos.length > 0 && (
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleCreateGroup}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Crear Nuevo Grupo</Text>
          </TouchableOpacity>
        )}
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
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createGroupButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  groupsContainer: {
    gap: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 16,
  },
  groupIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarExtra: {
    backgroundColor: '#666',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  avatarExtraText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  memberCount: {
    fontSize: 13,
    color: '#666',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});
