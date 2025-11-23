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
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import apiClient from '@/lib/api-client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '../hooks/useTranslation';

type TransactionType = 'gasto' | 'ingreso';

export default function RegisterTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { usuario, loading: loadingUsuario } = useUsuarioApi();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TransactionType>('gasto');
  const [importe, setImporte] = useState('');
  const [fechaTransaccion, setFechaTransaccion] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [nota, setNota] = useState('');
  const [hasFile, setHasFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImporteChange = (text: string) => {
    // Permitir solo números y comas/puntos decimales
    const cleaned = text.replace(/[^0-9.,]/g, '');
    // Reemplazar comas por puntos
    const normalized = cleaned.replace(',', '.');
    // Limitar a 2 decimales
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setImporte(normalized);
  };

  const formatDateDisplay = (date: Date) => {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mesKey = meses[date.getMonth()];
    const mesTraducido = t(`registerTransaction.months.${mesKey}`);
    const año = date.getFullYear();
    
    return `${dia} de ${mesTraducido} de ${año}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate) {
        setFechaTransaccion(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmDate = () => {
    setFechaTransaccion(tempDate);
    setShowDatePicker(false);
  };

  const cancelDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!titulo.trim()) {
      Alert.alert(t('common.error'), t('registerTransaction.errors.enterTitle'));
      return;
    }
    if (!importe || parseFloat(importe) <= 0) {
      Alert.alert(t('common.error'), t('registerTransaction.errors.enterValidAmount'));
      return;
    }
    if (!usuario?.id) {
      Alert.alert(t('common.error'), t('registerTransaction.errors.noUser'));
      return;
    }

    setSaving(true);

    try {
      // Crear objeto de transacción
      const nuevaTransaccion = {
        titulo: titulo.trim(),
        importe: parseFloat(importe),
        fechaTransaccion: fechaTransaccion.toISOString().split('T')[0], // Formato: YYYY-MM-DD
        nota: nota.trim() || null,
        idUsuario: usuario.id,
        idTipo: tipo === 'ingreso' ? 1 : 2, // 1 = Ingreso, 2 = Gasto
        idEstado: 3, // 3 = Pagada (transacciones normales están pagadas inmediatamente)
      };

      // Guardar en la API
      await apiClient.post('/transacciones', nuevaTransaccion);

      // Navegar a la pantalla de transacciones
      router.replace('/(tabs)/coins');
    } catch (error: any) {
      console.error('Error al guardar transacción:', error);
      Alert.alert(
        t('common.error'),
        t('registerTransaction.errors.failedToSave')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('registerTransaction.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerTransaction.titleLabel')} <Text style={styles.required}>{t('registerTransaction.required')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('registerTransaction.titlePlaceholder')}
              value={titulo}
              onChangeText={setTitulo}
              placeholderTextColor="#999"
            />
          </View>

          {/* Selector de tipo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerTransaction.typeLabel')} <Text style={styles.required}>{t('registerTransaction.required')}</Text>
            </Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  styles.typeButtonLeft,
                  tipo === 'gasto' && styles.typeButtonActive,
                ]}
                onPress={() => setTipo('gasto')}
              >
                <Ionicons 
                  name="arrow-down" 
                  size={20} 
                  color={tipo === 'gasto' ? '#fff' : '#FF6B6B'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  tipo === 'gasto' && styles.typeButtonTextActive,
                ]}>
                  {t('registerTransaction.expense')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  styles.typeButtonRight,
                  tipo === 'ingreso' && styles.typeButtonActiveIngreso,
                ]}
                onPress={() => setTipo('ingreso')}
              >
                <Ionicons 
                  name="arrow-up" 
                  size={20} 
                  color={tipo === 'ingreso' ? '#fff' : '#4CAF50'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  tipo === 'ingreso' && styles.typeButtonTextActive,
                ]}>
                  {t('registerTransaction.income')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Importe */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerTransaction.amountLabel')} <Text style={styles.required}>{t('registerTransaction.required')}</Text>
            </Text>
            <View style={styles.importeContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.importeInput}
                placeholder={t('registerTransaction.amountPlaceholder')}
                value={importe}
                onChangeText={handleImporteChange}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Fecha de transacción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerTransaction.dateLabel')} <Text style={styles.required}>{t('registerTransaction.required')}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                setTempDate(fechaTransaccion);
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
              <View style={styles.datePickerTextContainer}>
                <Text style={styles.datePickerTextSelected}>
                  {formatDateDisplay(fechaTransaccion)}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Nota (opcional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('registerTransaction.noteLabel')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('registerTransaction.notePlaceholder')}
              value={nota}
              onChangeText={setNota}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* Adjuntar archivo (opcional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>{t('registerTransaction.fileLabel')}</Text>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={() => {
                // Funcionalidad pendiente
                console.log('Adjuntar archivo - Pendiente de implementar');
              }}
            >
              <Ionicons name="attach" size={24} color="#007AFF" />
              <Text style={styles.fileButtonText}>
                {hasFile ? t('registerTransaction.fileAttached') : t('registerTransaction.selectFile')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* Botón de guardar */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveButton, (saving || loadingUsuario) && styles.saveButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving || loadingUsuario}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t('registerTransaction.saveButton')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>

      {/* Date Picker - Android usa el picker nativo, iOS usa modal personalizado */}
      {Platform.OS === 'android' ? (
        showDatePicker && (
          <DateTimePicker
            value={fechaTransaccion}
            mode="date"
            display="default"
            onChange={handleDateChange}
            locale="es"
          />
        )
      ) : (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDatePicker}
        >
          <Pressable style={styles.modalOverlay} onPress={cancelDatePicker}>
            <Pressable style={styles.datePickerModal} onPress={(e) => e.stopPropagation()}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>{t('registerTransaction.selectDate')}</Text>
              </View>
              
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  locale="es"
                  textColor="#000000"
                />
              </View>
              
              <View style={styles.datePickerButtons}>
                <TouchableOpacity 
                  style={styles.datePickerCancelButton}
                  onPress={cancelDatePicker}
                >
                  <Text style={styles.datePickerCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.datePickerConfirmButton}
                  onPress={confirmDate}
                >
                  <Text style={styles.datePickerConfirmText}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  typeButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#E0E0E0',
  },
  typeButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#E0E0E0',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  typeButtonActiveIngreso: {
    backgroundColor: '#4CAF50',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  importeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  importeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    paddingVertical: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  fileButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  datePickerTextContainer: {
    flex: 1,
  },
  datePickerTextSelected: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
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
  datePickerHeader: {
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  datePickerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 20,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
