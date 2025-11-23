import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api-client';
import { useTranslation } from '../hooks/useTranslation';

export default function CreateSavingsGoalScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [montoObjetivo, setMontoObjetivo] = useState('');
  const [montoActual, setMontoActual] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNumberInput = (value: string, setter: (value: string) => void) => {
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
    
    setter(cleaned);
  };

  const validateForm = () => {
    if (!titulo.trim()) {
      Alert.alert(t('common.error'), t('createSavingsGoal.errors.enterTitle'));
      return false;
    }

    if (!montoObjetivo || parseFloat(montoObjetivo.replace(',', '.')) <= 0) {
      Alert.alert(t('common.error'), t('createSavingsGoal.errors.amountMustBePositive'));
      return false;
    }

    const objetivo = parseFloat(montoObjetivo.replace(',', '.'));
    const actual = montoActual ? parseFloat(montoActual.replace(',', '.')) : 0;

    if (actual < 0) {
      Alert.alert(t('common.error'), t('createSavingsGoal.errors.savedAmountNegative'));
      return false;
    }

    if (actual > objetivo) {
      Alert.alert(t('common.error'), t('createSavingsGoal.errors.savedAmountExceeds'));
      return false;
    }

    return true;
  };

  const handleCreateGoal = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), t('createSavingsGoal.errors.noUser'));
      return;
    }

    setLoading(true);

    try {
      const metaData = {
        titulo: titulo.trim(),
        cantidadObjetivo: parseFloat(montoObjetivo.replace(',', '.')),
        cantidadActual: montoActual ? parseFloat(montoActual.replace(',', '.')) : 0,
      };

      await apiClient.post(
        `/metas-ahorro/usuario/uid/${user.id}`,
        metaData
      );

      router.back();
    } catch (error: any) {
      console.error('Error al crear meta:', error);
      const errorMessage = error?.message || t('createSavingsGoal.errors.failedToCreate');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>{t('createSavingsGoal.title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Campo Título */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('createSavingsGoal.titleLabel')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('createSavingsGoal.titlePlaceholder')}
            placeholderTextColor="#999"
            value={titulo}
            onChangeText={setTitulo}
            maxLength={100}
            autoCapitalize="sentences"
          />
        </View>

        {/* Campo Cantidad Total */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('createSavingsGoal.totalAmountLabel')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="wallet-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder={t('createSavingsGoal.totalAmountPlaceholder')}
              placeholderTextColor="#999"
              value={montoObjetivo}
              onChangeText={(value) => handleNumberInput(value, setMontoObjetivo)}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySymbol}>€</Text>
          </View>
          <Text style={styles.helperText}>{t('createSavingsGoal.totalAmountHelper')}</Text>
        </View>

        {/* Campo Cantidad Ahorrada */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('createSavingsGoal.savedAmountLabel')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder={t('createSavingsGoal.savedAmountPlaceholder')}
              placeholderTextColor="#999"
              value={montoActual}
              onChangeText={(value) => handleNumberInput(value, setMontoActual)}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySymbol}>€</Text>
          </View>
          <Text style={styles.helperText}>{t('createSavingsGoal.savedAmountHelper')}</Text>
        </View>

        {/* Botón Crear Meta */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGoal}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.createButtonText}>{t('createSavingsGoal.creating')}</Text>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.createButtonText}>{t('createSavingsGoal.createButton')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 40,
  },
});
