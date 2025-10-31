import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { usuario, loading } = useUsuarioApi();

  const handleSignOut = async () => {
    try {
      // Primero navegar a la pantalla de inicio
      router.push('/');
      // Pequeño delay para que la navegación se complete
      setTimeout(async () => {
        await signOut();
      }, 100);
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
                onPress={() => console.log('Divisa')}
                activeOpacity={0.7}
              >
                <View style={styles.divisaLeft}>
                  <Ionicons name="cash-outline" size={20} color="#007AFF" />
                  <Text style={styles.divisaText}>Divisa</Text>
                </View>
                <View style={styles.divisaRight}>
                  <Text style={styles.divisaValue}>
                    {usuario?.idDivisa ? `ID: ${usuario.idDivisa}` : 'EUR'}
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

      <BottomTabBar activeTab="profile" />
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
});
