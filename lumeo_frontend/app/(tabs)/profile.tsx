import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Modal, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useRouter } from 'expo-router';
import { DivisaService, Divisa } from '@/services/divisa.service';
import { usuarioService } from '@/services/usuario.service';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { usuario, loading, refetchUsuario } = useUsuarioApi();
  const scrollViewRef = useRef<ScrollView>(null);

  // Estados para el selector de divisas
  const [showDivisaModal, setShowDivisaModal] = useState(false);
  const [divisas, setDivisas] = useState<Divisa[]>([]);
  const [loadingDivisas, setLoadingDivisas] = useState(false);
  const [selectedDivisa, setSelectedDivisa] = useState<Divisa | null>(null);
  const [divisaActual, setDivisaActual] = useState<Divisa | null>(null);
  const [savingDivisa, setSavingDivisa] = useState(false);

  // Cargar divisas al montar el componente
  useEffect(() => {
    loadDivisas();
  }, []);

  // Cargar divisa actual del usuario
  useEffect(() => {
    if (usuario?.idDivisa) {
      loadDivisaActual(usuario.idDivisa);
    }
  }, [usuario?.idDivisa]);

  const loadDivisas = async () => {
    try {
      setLoadingDivisas(true);
      const divisasData = await DivisaService.getAll();
      setDivisas(divisasData);
    } catch (error) {
      console.error('Error al cargar divisas:', error);
    } finally {
      setLoadingDivisas(false);
    }
  };

  const loadDivisaActual = async (divisaId: number) => {
    try {
      const divisa = await DivisaService.getById(divisaId);
      setDivisaActual(divisa);
    } catch (error: any) {
      // Solo loguear si no fue cancelado
      if (error?.message !== 'CANCELED' && !error?.canceled) {
        console.error('Error al cargar divisa actual:', error);
      }
    }
  };

  const handleOpenDivisaModal = () => {
    setSelectedDivisa(divisaActual);
    setShowDivisaModal(true);
  };

  const handleSelectDivisa = (divisa: Divisa) => {
    setSelectedDivisa(divisa);
  };

  const handleConfirmDivisa = async () => {
    if (!selectedDivisa || !user?.id) return;

    try {
      setSavingDivisa(true);
      console.log('💱 Actualizando divisa del usuario a:', selectedDivisa.iso);
      
      // Actualizar la divisa en el backend (esto también convierte todas las transacciones)
      await usuarioService.updateByUid(user.id, { idDivisa: selectedDivisa.id });
      
      console.log('✅ Divisa actualizada en el backend, esperando conversión...');
      
      // Esperar un momento para que el backend complete la conversión de todas las transacciones
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Conversión completada, actualizando UI...');
      
      setDivisaActual(selectedDivisa);
      setShowDivisaModal(false);
      refetchUsuario();
      
      // Emitir evento de cambio de divisa para que otros componentes se actualicen
      const { eventEmitter, APP_EVENTS } = require('@/lib/event-emitter');
      console.log('📢 Emitiendo evento CURRENCY_CHANGED');
      eventEmitter.emit(APP_EVENTS.CURRENCY_CHANGED);
    } catch (error) {
      console.error('❌ Error al actualizar divisa:', error);
    } finally {
      setSavingDivisa(false);
    }
  };

  const handleCancelDivisa = () => {
    setShowDivisaModal(false);
    setSelectedDivisa(divisaActual);
  };

  // Función para refrescar
  const handleRefresh = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    refetchUsuario();
  };

  const handleSignOut = async () => {
    try {
      // Primero cerrar sesión
      await signOut();
      
      // Después de cerrar sesión, forzar navegación a la pantalla de inicio
      // Usar replace para que no pueda volver atrás con el botón de Android
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const menuItems = [
    {
      id: 'change-email',
      icon: 'mail-outline',
      title: 'Cambiar e-mail',
      subtitle: 'Actualiza tu correo electrónico',
      action: () => console.log('Change Email'),
    },
    {
      id: 'change-password',
      icon: 'lock-closed-outline',
      title: 'Cambiar contraseña',
      subtitle: 'Modifica tu contraseña de acceso',
      action: () => console.log('Change Password'),
    },
    {
      id: 'change-language',
      icon: 'language-outline',
      title: 'Cambiar idioma',
      subtitle: 'Selecciona tu idioma preferido',
      action: () => console.log('Change Language'),
    },
    {
      id: 'notifications',
      icon: 'notifications-outline',
      title: 'Preferencias de notificaciones',
      subtitle: 'Configura tus alertas y avisos',
      action: () => console.log('Notifications'),
    },
  ];

  // Pantalla de carga mientras se obtiene el usuario
  if (loading && !usuario) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingScreenText}>Cargando tu perfil...</Text>
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
        <View style={styles.headerUserContainer}>
          <Text style={styles.headerUsername}>
            @{loading ? '...' : usuario?.nombreUsuario || 'usuario'}
          </Text>
        </View>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileContent}>
            {/* Avatar a la izquierda */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={47.5} color="#007AFF" />
              </View>
            </View>

            {/* Información a la derecha */}
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {loading 
                  ? 'Cargando...' 
                  : usuario?.nombre || 'Usuario'
                }
              </Text>
              {!loading && usuario?.apellido && (
                <Text style={styles.userLastName}>
                  {usuario.apellido}
                </Text>
              )}
              <Text style={styles.userEmail}>
                {user?.email || 'email@ejemplo.com'}
              </Text>
              
              {/* Divisa debajo del email */}
              <TouchableOpacity 
                style={styles.divisaSection}
                onPress={handleOpenDivisaModal}
                activeOpacity={0.7}
              >
                <View style={styles.divisaLeft}>
                  <Ionicons name="cash-outline" size={20} color="#007AFF" />
                  <Text style={styles.divisaText}>Divisa</Text>
                </View>
                <View style={styles.divisaRight}>
                  <Text style={styles.divisaValue}>
                    {divisaActual?.simbolo ? `${divisaActual.simbolo} (${divisaActual.iso})` : divisaActual?.iso || 'EUR'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#CCC" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Miembro desde */}
          {usuario?.fechaCreacion && (
            <View style={styles.memberSince}>
              <Ionicons name="calendar-outline" size={16} color="#999" />
              <Text style={styles.memberSinceText}>
                Miembro desde {formatDate(usuario.fechaCreacion)}
              </Text>
            </View>
          )}
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name={item.icon as any} size={24} color="#007AFF" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* Space for bottom tab bar */}
        <View style={styles.bottomSpace} />
      </ScrollView>

      <BottomTabBar activeTab="profile" onTabRefresh={handleRefresh} />

      {/* Modal de selector de divisas */}
      <Modal visible={showDivisaModal} transparent={true} animationType="fade">
        <Pressable style={styles.divisaModalOverlay} onPress={handleCancelDivisa}>
          <Pressable style={styles.divisaModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.divisaModalHeader}>
              <Text style={styles.divisaModalTitle}>Seleccionar Divisa</Text>
              <TouchableOpacity onPress={handleCancelDivisa}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.divisaList} showsVerticalScrollIndicator={false}>
              {loadingDivisas ? (
                <View style={styles.divisaLoadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.divisaLoadingText}>Cargando divisas...</Text>
                </View>
              ) : (
                divisas.map((divisa) => (
                  <TouchableOpacity
                    key={divisa.id}
                    style={[
                      styles.divisaItem,
                      selectedDivisa?.id === divisa.id && styles.divisaItemSelected
                    ]}
                    onPress={() => handleSelectDivisa(divisa)}
                  >
                    <View style={styles.divisaItemContent}>
                      <Text style={styles.divisaItemISO}>
                        {divisa.simbolo ? `${divisa.simbolo} ${divisa.iso}` : divisa.iso}
                      </Text>
                      <Text style={styles.divisaItemDescripcion}>{divisa.descripcion}</Text>
                    </View>
                    {selectedDivisa?.id === divisa.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.divisaModalButtons}>
              <TouchableOpacity 
                style={styles.divisaCancelButton} 
                onPress={handleCancelDivisa}
              >
                <Text style={styles.divisaCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.divisaConfirmButton, savingDivisa && styles.divisaConfirmButtonDisabled]} 
                onPress={handleConfirmDivisa}
                disabled={savingDivisa}
              >
                {savingDivisa ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.divisaConfirmText}>Confirmar</Text>
                )}
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
  loadingScreen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingScreenText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
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
  headerUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  headerUsername: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 23, // 15% más grande que 20
    fontWeight: '700',
    color: '#000',
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
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  userLastName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  divisaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  divisaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divisaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divisaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  divisaValue: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  memberSinceText: {
    fontSize: 14,
    color: '#999',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  bottomSpace: {
    height: 100,
  },
  // Estilos del modal de divisas
  divisaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divisaModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  divisaModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  divisaModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  divisaList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  divisaLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  divisaLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  divisaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  divisaItemSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  divisaItemContent: {
    flex: 1,
  },
  divisaItemISO: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  divisaItemDescripcion: {
    fontSize: 13,
    color: '#666',
  },
  divisaModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  divisaCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  divisaCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  divisaConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  divisaConfirmButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  divisaConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
