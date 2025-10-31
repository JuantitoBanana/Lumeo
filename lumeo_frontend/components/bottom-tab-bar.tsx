import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export type TabRoute = 'home' | 'coins' | 'add' | 'stats' | 'profile';

interface BottomTabBarProps {
  activeTab?: TabRoute;
}

export function BottomTabBar({ activeTab = 'home' }: BottomTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'home' as TabRoute, icon: 'home', label: 'Inicio', route: '/(tabs)' },
    { id: 'coins' as TabRoute, icon: 'cash', label: 'Monedas', route: '/(tabs)/coins' },
    { id: 'add' as TabRoute, icon: 'add-circle', label: 'Añadir', route: '/(tabs)/add' },
    { id: 'stats' as TabRoute, icon: 'stats-chart', label: 'Estadísticas', route: '/(tabs)/stats' },
    { id: 'profile' as TabRoute, icon: 'person', label: 'Perfil', route: '/(tabs)/profile' },
  ];

  const handleTabPress = (route: string, tabId: TabRoute) => {
    // Si es el botón de añadir, podrías abrir un modal o navegar a una pantalla especial
    if (tabId === 'add') {
      // Aquí puedes agregar lógica especial para el botón de añadir
      router.push(route as any);
    } else {
      router.push(route as any);
    }
  };

  return (
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
