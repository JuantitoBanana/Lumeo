import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import AddTransactionModal from '../app/add-transaction-modal';

export type TabRoute = 'home' | 'coins' | 'add' | 'stats' | 'profile';

interface BottomTabBarProps {
  activeTab?: TabRoute;
  onTabRefresh?: () => void; // Callback para refrescar la pantalla activa
}

export function BottomTabBar({ activeTab = 'home', onTabRefresh }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [modalVisible, setModalVisible] = useState(false);

  const tabs = [
    { id: 'home' as TabRoute, icon: 'home', label: 'Inicio', route: '/(tabs)' },
    { id: 'coins' as TabRoute, icon: 'cash', label: 'Monedas', route: '/(tabs)/coins' },
    { id: 'add' as TabRoute, icon: 'add-circle', label: 'Añadir', route: '/(tabs)/add' },
    { id: 'stats' as TabRoute, icon: 'wallet', label: 'Metas', route: '/(tabs)/savings' },
    { id: 'profile' as TabRoute, icon: 'person', label: 'Perfil', route: '/(tabs)/profile' },
  ];

  const handleTabPress = (route: string, tabId: TabRoute) => {
    // Si es el botón de añadir, abrir el modal
    if (tabId === 'add') {
      setModalVisible(true);
    } else if (activeTab === tabId && onTabRefresh) {
      // Si ya estamos en este tab, ejecutar refresh
      onTabRefresh();
    } else {
      router.push(route as any);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const isAddButton = tab.id === 'add';

            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isAddButton && styles.addButton]}
                onPress={() => handleTabPress(tab.route, tab.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={isAddButton ? 40 : 33}
                  color={isActive ? '#000' : '#666'}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: Platform.OS === 'ios' ? 80 : 70,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 25 : 0,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  addButton: {
    // Eliminar el marginTop negativo para mejor alineación
  },
});
