import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import AddTransactionModal from '../app/add-transaction-modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);
const TAB_COUNT = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;
const DOT_SIZE = 6;

export function BottomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const translateX = useSharedValue(0);

  const tabs = [
    { key: 'home', icon: 'home', label: 'Inicio', routeName: 'index' },
    { key: 'coins', icon: 'cash', label: 'Monedas', routeName: 'coins' },
    { key: 'add', icon: 'add-circle', label: 'Añadir', routeName: 'add', isAddButton: true },
    { key: 'stats', icon: 'wallet', label: 'Metas', routeName: 'savings', relatedRoutes: ['budgets'] },
    { key: 'profile', icon: 'person', label: 'Perfil', routeName: 'profile' },
  ];

  // Determinar el índice activo basado en la ruta actual
  const currentRouteName = state.routes[state.index].name;
  const activeTabIndex = tabs.findIndex(tab => 
    tab.routeName === currentRouteName || tab.relatedRoutes?.includes(currentRouteName)
  );

  useEffect(() => {
    if (activeTabIndex !== -1) {
      const targetX = (activeTabIndex * TAB_WIDTH) + (TAB_WIDTH - DOT_SIZE) / 2;
      translateX.value = withSpring(targetX, {
        damping: 25,
        stiffness: 150,
        mass: 1,
      });
    }
  }, [activeTabIndex]);

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: activeTabIndex === -1 ? 0 : 1, // Ocultar punto si no hay tab activo
    };
  });

  return (
    <>
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <Animated.View style={[styles.dot, animatedDotStyle]} />
          
          {tabs.map((tab, index) => {
            const isFocused = index === activeTabIndex;
            const isAddButton = tab.isAddButton;

            const onPress = () => {
              if (isAddButton) {
                setModalVisible(true);
                return;
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: tab.key, // Esto es un poco fake porque no tenemos la key real de la ruta aquí si no la buscamos
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.routeName);
              }
            };

            const onLongPress = () => {
              if (isAddButton) return;
              navigation.emit({
                type: 'tabLongPress',
                target: tab.key,
              });
            };

            return (
              <TouchableOpacity
                key={tab.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                style={[styles.tab, isAddButton && styles.addButton]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={isAddButton ? 40 : 28}
                  color={isFocused ? '#FF6D00' : '#FFB74D'}
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
    bottom: 25,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
    position: 'relative',
  },
  tab: {
    width: TAB_WIDTH,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  addButton: {
    // No special styling needed
  },
  dot: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FF6D00',
    zIndex: 0,
  },
});
