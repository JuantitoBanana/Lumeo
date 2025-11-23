import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useTranslation } from '../hooks/useTranslation';

interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  metaId: number;
  metaTitulo: string;
  cantidadActual: number;
  cantidadObjetivo: number;
  onSuccess: () => void;
}

export default function AddMoneyModal({
  visible,
  onClose,
  metaId,
  metaTitulo,
  cantidadActual,
  cantidadObjetivo,
  onSuccess,
}: AddMoneyModalProps) {
  const { t } = useTranslation();
  const [cantidad, setCantidad] = useState('');
  const [loading, setLoading] = useState(false);
  const { usuario, loading: loadingUsuario } = useUsuarioApi();

  useEffect(() => {
    if (visible) {
      setCantidad('');
    }
  }, [visible]);

  const handleNumberInput = (value: string) => {
    // Solo permitir números, punto y coma
    const cleaned = value.replace(/[^0-9.,]/g, '');
    
    // Contar separadores decimales (punto o coma)
    const pointCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    
    // Evitar más de un separador decimal
    if (pointCount + commaCount > 1) {
      return;
    }
    
    // Evitar números negativos
    if (cleaned.startsWith('-')) {
      return;
    }
    
    // Limitar a 2 decimales
    const parts = cleaned.split(/[.,]/);
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    setCantidad(cleaned);
  };

  const handleAgregarDinero = async () => {
    if (!cantidad || cantidad.trim() === '') {
      Alert.alert(t('common.error'), t('addMoneyModal.errors.enterAmount'));
      return;
    }

    const cantidadNum = parseFloat(cantidad.replace(',', '.'));

    if (cantidadNum <= 0) {
      Alert.alert(t('common.error'), t('addMoneyModal.errors.amountMustBePositive'));
      return;
    }

    const nuevaCantidad = cantidadActual + cantidadNum;
    if (nuevaCantidad > cantidadObjetivo) {
      Alert.alert(
        t('common.error'),
        t('addMoneyModal.errors.maxAmountExceeded', { maxAmount: formatCurrency(cantidadObjetivo - cantidadActual) })
      );
      return;
    }

    if (!usuario?.id) {
      Alert.alert(t('common.error'), t('addMoneyModal.errors.noUser'));
      return;
    }

    setLoading(true);

    try {
      await apiClient.put(`/metas-ahorro/${metaId}/agregar-cantidad`, cantidadNum);
      // Crear transacción de tipo gasto
      await apiClient.post('/transacciones', {
        titulo: t('addMoneyModal.contributionLabel', { metaTitle: metaTitulo }),
        importe: cantidadNum,
        fechaTransaccion: new Date().toISOString().split('T')[0],
        nota: null,
        idUsuario: usuario.id,
        idTipo: 2, // 2 = Gasto
        idEstado: 2, // 2 = Completado
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al agregar dinero:', error);
      const errorMessage = error?.message || t('addMoneyModal.errors.failedToAdd');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <Pressable style={styles.overlay} onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <Pressable style={styles.modalContent} onPress={(e) => { e.stopPropagation(); Keyboard.dismiss(); }}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('addMoneyModal.title')}</Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <Text style={styles.metaTitulo}>{metaTitulo}</Text>
            <Text style={styles.metaProgreso}>
              {formatCurrency(cantidadActual)} / {formatCurrency(cantidadObjetivo)}
            </Text>
            <Text style={styles.metaRestante}>
              {t('addMoneyModal.remaining', { amount: formatCurrency(cantidadObjetivo - cantidadActual) })}
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addMoneyModal.amountLabel')}</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="cash-outline" size={24} color="#007AFF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('addMoneyModal.amountPlaceholder')}
                placeholderTextColor="#999"
                value={cantidad}
                onChangeText={handleNumberInput}
                keyboardType="decimal-pad"
                autoFocus={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
              <Text style={styles.currencySymbol}>€</Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>{t('addMoneyModal.cancelButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={handleAgregarDinero}
              disabled={loading}
            >
              <Text style={styles.confirmButtonText}>
                {loading ? t('addMoneyModal.adding') : t('addMoneyModal.confirmButton')}
              </Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '85%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  metaInfo: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  metaTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  metaProgreso: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  metaRestante: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1a1a1a',
    fontWeight: '600',
    padding: 0,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
});
