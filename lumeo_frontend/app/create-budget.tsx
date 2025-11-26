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
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api-client';
import { Picker } from '@react-native-picker/picker';
import { useTranslation } from '../hooks/useTranslation';

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 126 }, (_, i) => (currentYear - 25 + i).toString());

export default function CreateBudgetScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [monto, setMonto] = useState('');
  const [loading, setLoading] = useState(false);
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [tempSelectedMonth, setTempSelectedMonth] = useState(months[new Date().getMonth()]);
  const [tempSelectedYear, setTempSelectedYear] = useState(currentYear.toString());

  const openMonthModal = () => {
    setTempSelectedMonth(selectedMonth);
    setMonthModalVisible(true);
  };

  const confirmMonthSelection = () => {
    setSelectedMonth(tempSelectedMonth);
    setMonthModalVisible(false);
  };

  const cancelMonthSelection = () => {
    setMonthModalVisible(false);
  };

  const openYearModal = () => {
    setTempSelectedYear(selectedYear);
    setYearModalVisible(true);
  };

  const confirmYearSelection = () => {
    setSelectedYear(tempSelectedYear);
    setYearModalVisible(false);
  };

  const cancelYearSelection = () => {
    setYearModalVisible(false);
  };

  const handleNumberInput = (value: string) => {
    // Solo permitir números, coma
    const cleaned = value.replace(/[^0-9,]/g, '');
    
    // Contar comas
    const commaCount = (cleaned.match(/,/g) || []).length;
    
    // Evitar más de una coma
    if (commaCount > 1) {
      return;
    }
    
    // Evitar números negativos
    if (cleaned.startsWith('-')) {
      return;
    }
    
    // Limitar a 2 decimales después de la coma
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    setMonto(cleaned);
  };

  const validateForm = () => {
    if (!monto || parseFloat(monto.replace(',', '.')) <= 0) {
      Alert.alert(t('common.error'), t('budget.createBudget.errors.amountMustBePositive'));
      return false;
    }
    return true;
  };

  const handleCreateBudget = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert(t('common.error'), t('budget.createBudget.errors.noUser'));
      return;
    }

    setLoading(true);

    try {
      const budgetData = {
        mes: selectedMonth,
        anio: selectedYear,
        cantidad: parseFloat(monto.replace(',', '.')),
      };

      await apiClient.post(`/presupuestos/usuario/uid/${user.id}`, budgetData);

      router.back();
    } catch (error: any) {
      console.error('Error al crear presupuesto:', error);
      const errorMessage = error?.message || t('budget.createBudget.errors.failedToCreate');
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
        <Text style={styles.headerTitle}>{t('budget.createBudget.title')}</Text>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selectores de Mes y Año */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('budget.createBudget.monthAndYear')}</Text>
          <View style={styles.selectorsRow}>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => openMonthModal()}
            >
              <Text style={styles.selectorText}>{selectedMonth}</Text>
              <Ionicons name="chevron-down" size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => openYearModal()}
            >
              <Text style={styles.selectorText}>{selectedYear}</Text>
              <Ionicons name="chevron-down" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Campo Monto */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('budget.createBudget.amountLabel')}</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="cash-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder={t('budget.createBudget.amountPlaceholder')}
              placeholderTextColor="#999"
              value={monto}
              onChangeText={handleNumberInput}
              keyboardType="decimal-pad"
            />
            <Text style={styles.currencySymbol}>€</Text>
          </View>
          <Text style={styles.helperText}>{t('budget.createBudget.helperText')}</Text>
        </View>

        {/* Botón Crear Presupuesto */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateBudget}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.createButtonText}>{t('budget.createBudget.creating')}</Text>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.createButtonText}>{t('budget.createBudget.createButton')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Modal para Mes */}
      <Modal
        visible={monthModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelMonthSelection}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={cancelMonthSelection}
        >
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('budget.createBudget.selectMonth')}</Text>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempSelectedMonth}
                onValueChange={(itemValue) => setTempSelectedMonth(itemValue)}
                style={styles.picker}
                itemStyle={{ color: '#000' }}
              >
                {months.map((month) => (
                  <Picker.Item key={month} label={month} value={month} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerButtons}>
              <TouchableOpacity 
                style={styles.pickerCancelButton}
                onPress={cancelMonthSelection}
              >
                <Text style={styles.pickerCancelText}>{t('budget.createBudget.cancelButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pickerConfirmButton}
                onPress={confirmMonthSelection}
              >
                <Text style={styles.pickerConfirmText}>{t('budget.createBudget.confirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal para Año */}
      <Modal
        visible={yearModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelYearSelection}
      >
        <Pressable
          style={styles.modalContainer}
          onPress={cancelYearSelection}
        >
          <Pressable style={styles.pickerModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>{t('budget.createBudget.selectYear')}</Text>
            </View>
            
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempSelectedYear}
                onValueChange={(itemValue) => setTempSelectedYear(itemValue)}
                style={styles.picker}
                itemStyle={{ color: '#000' }}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
            
            <View style={styles.pickerButtons}>
              <TouchableOpacity 
                style={styles.pickerCancelButton}
                onPress={cancelYearSelection}
              >
                <Text style={styles.pickerCancelText}>{t('budget.createBudget.cancelButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.pickerConfirmButton}
                onPress={confirmYearSelection}
              >
                <Text style={styles.pickerConfirmText}>{t('budget.createBudget.confirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  selectorsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  selectorText: {
    fontSize: 16,
    color: '#1a1a1a',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 200,
    backgroundColor: 'transparent',
    color: '#000',
  },
  pickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  pickerHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  pickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  pickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  pickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  pickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
