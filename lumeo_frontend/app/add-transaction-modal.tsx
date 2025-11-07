import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const router = useRouter();

  const options = [
    {
      id: 'individual-expense',
      icon: 'wallet-outline',
      title: 'Registrar gasto / ingreso',
      subtitle: 'Añade un gasto o ingreso personal',
      color: '#FF6B6B',
      action: () => {
        onClose();
        router.push('/register-transaction');
      },
    },
    {
      id: 'individual-transaction',
      icon: 'swap-horizontal-outline',
      title: 'Transacción individual',
      subtitle: 'Ingreso o gasto con otra persona',
      color: '#4ECDC4',
      action: () => {
        onClose();
        router.push('/register-shared-transaction');
      },
    },
    {
      id: 'group-transaction',
      icon: 'people-outline',
      title: 'Transacción grupal',
      subtitle: 'Gasto compartido con otros',
      color: '#FFE66D',
      action: () => {
        onClose();
        console.log('Transacción grupal');
        // router.push('/group-transaction');
      },
    },
    {
      id: 'create-group',
      icon: 'add-circle-outline',
      title: 'Crear Grupo',
      subtitle: 'Nuevo grupo de gastos',
      color: '#95E1D3',
      action: () => {
        onClose();
        console.log('Crear Grupo');
        // router.push('/create-group');
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Opciones */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  index === options.length - 1 && styles.lastOptionCard,
                ]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={32} color={option.color} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>{option.title}</Text>
                  <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#CCC" />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 24,
    marginBottom: 16,
  },
  optionsContainer: {
    paddingHorizontal: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastOptionCard: {
    marginBottom: 0,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
