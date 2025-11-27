import React, { useRef } from 'react';
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
import { useGrupos } from '@/hooks/useGrupos';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useTranslation } from '../hooks/useTranslation';

export default function GroupsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { usuario } = useUsuarioApi();
  const { grupos, loading, error, refetch } = useGrupos();
  const scrollViewRef = useRef<ScrollView>(null);

  // Recargar grupos cuando la pantalla recibe foco
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

  // Función para renderizar avatares de miembros
  const renderMemberAvatars = (miembros: any[], idUsuarioActual: number | undefined) => {
    // Mostrar todos los miembros (incluyendo creador, ya viene del backend)
    const miembrosVisibles = miembros.slice(0, 3);
    const miembrosRestantes = miembros.length - 3;

    return (
      <View style={styles.membersContainer}>
        <View style={styles.avatarsRow}>
          {miembrosVisibles.map((miembro, index) => (
            <View 
              key={miembro.idUsuario} 
              style={[
                styles.memberAvatar,
                { marginLeft: index > 0 ? -12 : 0 }
              ]}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {miembro.nombre ? miembro.nombre.charAt(0).toUpperCase() : 
                   miembro.nombreUsuario ? miembro.nombreUsuario.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            </View>
          ))}
          
          {miembrosRestantes > 0 && (
            <View style={[styles.memberAvatar, styles.moreAvatar, { marginLeft: -12 }]}>
              <View style={[styles.avatarCircle, styles.moreAvatarCircle]}>
                <Text style={styles.moreAvatarText}>+{miembrosRestantes}</Text>
              </View>
            </View>
          )}
        </View>
        
        <Text style={styles.membersCount}>
          {miembros.length === 1 
            ? `1 ${t('groups.member')}` 
            : `${miembros.length} ${t('groups.members')}`}
        </Text>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9500" />
          <Text style={styles.loadingText}>{t('groups.loading')}</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.emptyText}>{t('groups.errorLoading')}</Text>
          <Text style={styles.emptySubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>{t('groups.retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (grupos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#999" />
          <Text style={styles.emptyText}>{t('groups.noGroups')}</Text>
          <Text style={styles.emptySubtext}>
            {t('groups.noGroupsText')}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.groupsList} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {grupos.map((grupoData) => (
          <TouchableOpacity 
            key={grupoData.grupo.id} 
            style={styles.groupCard}
            activeOpacity={0.7}
            onPress={() => {
              router.push(`/group-detail?id=${grupoData.grupo.id}`);
            }}
          >
            {/* Header del grupo */}
            <View style={styles.groupHeader}>
              <View style={styles.groupIconContainer}>
                <Ionicons name="people" size={24} color="#FF9500" />
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupTitle} numberOfLines={1}>
                  {grupoData.grupo.nombre}
                </Text>
              </View>
            </View>

            {/* Miembros del grupo */}
            {renderMemberAvatars(grupoData.miembros, usuario?.id)}
          </TouchableOpacity>
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
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>{t('groups.title')}</Text>
      </View>

      {/* Contenido */}
      {renderContent()}

      {/* Bottom Tab Bar - Sin tab activo ya que no estamos en una pestaña principal */}
      <BottomTabBar onTabRefresh={handleRefresh} />
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
  groupsList: {
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
  groupCard: {
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
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  membersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    position: 'relative',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreAvatar: {
    // Estilos adicionales si es necesario
  },
  moreAvatarCircle: {
    backgroundColor: '#E0E0E0',
  },
  moreAvatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  membersCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  bottomSpace: {
    height: 100,
  },
});
