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
import { usuarioService } from '@/services/usuario.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '../hooks/useTranslation';

type TransactionType = 'gasto' | 'ingreso';
type DivisionType = 'igual' | 'porcentaje' | 'exacto';

export default function RegisterSharedTransactionScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
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
  
  // Nuevos campos para transacción compartida
  const [destinatario, setDestinatario] = useState('');
  const [divisionTipo, setDivisionTipo] = useState<DivisionType>('igual');
  const [porcentajeDestinatario, setPorcentajeDestinatario] = useState('');
  const [importeExactoDestinatario, setImporteExactoDestinatario] = useState('');

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

  const handlePorcentajeChange = (text: string) => {
    // Permitir solo números y eliminar el símbolo %
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned || '0');
    // Limitar entre 0 y 100
    if (num > 100) {
      setPorcentajeDestinatario('100');
    } else {
      setPorcentajeDestinatario(cleaned);
    }
  };

  const handleImporteExactoChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setImporteExactoDestinatario(normalized);
  };

  const formatDateDisplay = (date: Date) => {
    const monthKeys = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = t(`registerSharedTransaction.months.${monthKeys[date.getMonth()]}`);
    const año = date.getFullYear();
    
    // Use different format for English vs Spanish
    return language === 'en' 
      ? `${mes} ${date.getDate()}, ${año}` 
      : `${dia} de ${mes} de ${año}`;
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

  const calcularImportes = (importeTotal: number): { importeUsuario: number; importeDestinatario: number } => {
    let importeDestinatarioCalc = 0;
    let importeUsuarioCalc = importeTotal;

    switch (divisionTipo) {
      case 'igual':
        importeDestinatarioCalc = importeTotal / 2;
        importeUsuarioCalc = importeTotal / 2;
        break;
      
      case 'porcentaje':
        const porcentaje = parseFloat(porcentajeDestinatario || '0');
        importeDestinatarioCalc = (importeTotal * porcentaje) / 100;
        importeUsuarioCalc = importeTotal - importeDestinatarioCalc;
        break;
      
      case 'exacto':
        importeDestinatarioCalc = parseFloat(importeExactoDestinatario || '0');
        importeUsuarioCalc = importeTotal - importeDestinatarioCalc;
        break;
    }

    return {
      importeUsuario: importeUsuarioCalc,
      importeDestinatario: importeDestinatarioCalc
    };
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!titulo.trim()) {
      Alert.alert(t('common.error'), t('registerSharedTransaction.errors.enterTitle'));
      return;
    }
    if (!importe || parseFloat(importe) <= 0) {
      Alert.alert(t('common.error'), t('registerSharedTransaction.errors.enterValidAmount'));
      return;
    }
    if (!destinatario.trim()) {
      Alert.alert(t('common.error'), t('registerSharedTransaction.errors.enterRecipient'));
      return;
    }
    if (!usuario?.id) {
      Alert.alert(t('common.error'), t('registerSharedTransaction.errors.noUser'));
      return;
    }

    // Validaciones adicionales según el tipo de división
    if (divisionTipo === 'porcentaje') {
      const porcentaje = parseFloat(porcentajeDestinatario || '0');
      if (porcentaje <= 0 || porcentaje > 100) {
        Alert.alert(t('common.error'), t('registerSharedTransaction.errors.percentageRange'));
        return;
      }
    }

    if (divisionTipo === 'exacto') {
      const importeExacto = parseFloat(importeExactoDestinatario || '0');
      const importeTotal = parseFloat(importe);
      if (importeExacto <= 0) {
        Alert.alert(t('common.error'), t('registerSharedTransaction.errors.exactAmountPositive'));
        return;
      }
      if (importeExacto >= importeTotal) {
        Alert.alert(t('common.error'), t('registerSharedTransaction.errors.exactAmountExceeds'));
        return;
      }
    }

    setSaving(true);

    try {
      // Buscar el usuario destinatario por nombre_usuario
      let usuarioDestinatario;
      try {
        usuarioDestinatario = await usuarioService.getByNombreUsuario(destinatario.trim());
      } catch (error: any) {
        // Si es un error 404, significa que el usuario no existe
        if (error.status === 404) {
          Alert.alert(t('registerSharedTransaction.errors.userNotFound'), t('registerSharedTransaction.errors.userNotRegistered'));
          setSaving(false);
          return;
        }
        // Si es otro tipo de error en la búsqueda, mostrar mensaje genérico
        Alert.alert(t('common.error'), t('registerSharedTransaction.errors.userSearchError'));
        setSaving(false);
        return;
      }
      
      // El backend ahora devuelve 200 con null si no encuentra el usuario
      if (!usuarioDestinatario) {
        Alert.alert(t('registerSharedTransaction.errors.userNotFound'), t('registerSharedTransaction.errors.userNotRegistered'));
        setSaving(false);
        return;
      }

      // Calcular los importes según el tipo de división
      const importeTotal = parseFloat(importe);
      const { importeUsuario, importeDestinatario: importeDestinatarioCalc } = calcularImportes(importeTotal);

      // Crear objeto de transacción
      const nuevaTransaccion = {
        titulo: titulo.trim(),
        importe: importeUsuario,
        fechaTransaccion: fechaTransaccion.toISOString().split('T')[0], // Formato: YYYY-MM-DD
        nota: nota.trim() || null,
        idUsuario: usuario.id,
        idTipo: tipo === 'ingreso' ? 1 : 2, // 1 = Ingreso, 2 = Gasto
        idEstado: 1, // 1 = Pendiente (para transacciones compartidas)
        idDestinatario: usuarioDestinatario.id,
        importeDestinatario: importeDestinatarioCalc,
      };

      // Guardar en la API
      await apiClient.post('/transacciones', nuevaTransaccion);

      // Navegar de vuelta a la pantalla de monedas sin mostrar mensaje de éxito
      router.replace('/(tabs)/coins');
    } catch (error: any) {
      // Solo loggear errores no manejados específicamente
      if (!error.status || error.status >= 500) {
        console.error('Error al guardar transacción:', error);
      }
      
      let errorMessage = t('registerSharedTransaction.errors.failedToSave');
      
      // Manejar errores específicos
      if (error.status === 404) {
        errorMessage = t('registerSharedTransaction.errors.transactionError');
      } else if (error.status === 400) {
        errorMessage = t('registerSharedTransaction.errors.invalidData');
      } else if (error.status === 500) {
        errorMessage = t('registerSharedTransaction.errors.serverError');
      }
      
      Alert.alert(t('common.error'), errorMessage);
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
          <Text style={styles.headerTitle}>{t('registerSharedTransaction.title')}</Text>
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
              {t('registerSharedTransaction.titleLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('registerSharedTransaction.titlePlaceholder')}
              value={titulo}
              onChangeText={setTitulo}
              placeholderTextColor="#999"
            />
          </View>

          {/* Selector de tipo */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerSharedTransaction.typeLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
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
                  {t('registerSharedTransaction.expense')}
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
                  {t('registerSharedTransaction.income')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Importe Total */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerSharedTransaction.totalAmountLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
            </Text>
            <View style={styles.importeContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.importeInput}
                placeholder={t('registerSharedTransaction.totalAmountPlaceholder')}
                value={importe}
                onChangeText={handleImporteChange}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Destinatario */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerSharedTransaction.recipientLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('registerSharedTransaction.recipientPlaceholder')}
              value={destinatario}
              onChangeText={setDestinatario}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              {t('registerSharedTransaction.recipientHelper')}
            </Text>
          </View>

          {/* División de Importe */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerSharedTransaction.divisionLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
            </Text>
            <View style={styles.divisionSelector}>
              <TouchableOpacity
                style={[
                  styles.divisionButton,
                  styles.divisionButtonLeft,
                  divisionTipo === 'igual' && styles.divisionButtonActive,
                ]}
                onPress={() => setDivisionTipo('igual')}
              >
                <Text style={[
                  styles.divisionButtonText,
                  divisionTipo === 'igual' && styles.divisionButtonTextActive,
                ]}>
                  {t('registerSharedTransaction.divisionTypes.equal')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.divisionButton,
                  styles.divisionButtonMiddle,
                  divisionTipo === 'porcentaje' && styles.divisionButtonActive,
                ]}
                onPress={() => setDivisionTipo('porcentaje')}
              >
                <Text style={[
                  styles.divisionButtonText,
                  divisionTipo === 'porcentaje' && styles.divisionButtonTextActive,
                ]}>
                  {t('registerSharedTransaction.divisionTypes.percentage')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.divisionButton,
                  styles.divisionButtonRight,
                  divisionTipo === 'exacto' && styles.divisionButtonActive,
                ]}
                onPress={() => setDivisionTipo('exacto')}
              >
                <Text style={[
                  styles.divisionButtonText,
                  divisionTipo === 'exacto' && styles.divisionButtonTextActive,
                ]}>
                  {t('registerSharedTransaction.divisionTypes.exact')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo condicional para Porcentaje */}
          {divisionTipo === 'porcentaje' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t('registerSharedTransaction.recipientPercentageLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
              </Text>
              <View style={styles.importeContainer}>
                <TextInput
                  style={styles.importeInput}
                  placeholder={t('registerSharedTransaction.recipientPercentagePlaceholder')}
                  value={porcentajeDestinatario}
                  onChangeText={handlePorcentajeChange}
                  keyboardType="number-pad"
                  placeholderTextColor="#999"
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
              {porcentajeDestinatario && importe && (
                <Text style={styles.helperText}>
                  {t('registerSharedTransaction.divisionInfo.breakdown', {
                    recipientAmount: ((parseFloat(importe) * parseFloat(porcentajeDestinatario)) / 100).toFixed(2),
                    yourAmount: (parseFloat(importe) - (parseFloat(importe) * parseFloat(porcentajeDestinatario)) / 100).toFixed(2)
                  })}
                </Text>
              )}
            </View>
          )}

          {/* Campo condicional para Exacto */}
          {divisionTipo === 'exacto' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                {t('registerSharedTransaction.recipientAmountLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
              </Text>
              <View style={styles.importeContainer}>
                <Text style={styles.currencySymbol}>€</Text>
                <TextInput
                  style={styles.importeInput}
                  placeholder={t('registerSharedTransaction.recipientAmountPlaceholder')}
                  value={importeExactoDestinatario}
                  onChangeText={handleImporteExactoChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
              {importeExactoDestinatario && importe && (
                <Text style={styles.helperText}>
                  {t('registerSharedTransaction.divisionInfo.breakdown', {
                    recipientAmount: parseFloat(importeExactoDestinatario).toFixed(2),
                    yourAmount: (parseFloat(importe) - parseFloat(importeExactoDestinatario)).toFixed(2)
                  })}
                </Text>
              )}
            </View>
          )}

          {/* División visual */}
          {divisionTipo === 'igual' && importe && (
            <View style={styles.divisionInfo}>
              <Text style={styles.divisionInfoText}>
                {t('registerSharedTransaction.divisionInfo.eachWillPay', {
                  amount: (parseFloat(importe) / 2).toFixed(2)
                })}
              </Text>
            </View>
          )}

          {/* Fecha de transacción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerSharedTransaction.dateLabel')} <Text style={styles.required}>{t('registerSharedTransaction.required')}</Text>
            </Text>
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => {
                setTempDate(fechaTransaccion);
                setShowDatePicker(true);
              }}
            >
              <Ionicons name="calendar-outline" size={24} color="#FF9500" />
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
            <Text style={styles.label}>{t('registerSharedTransaction.noteLabel')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('registerSharedTransaction.notePlaceholder')}
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
            <Text style={styles.label}>{t('registerSharedTransaction.fileLabel')}</Text>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={() => {
                // Funcionalidad pendiente
              }}
            >
              <Ionicons name="attach" size={24} color="#FF9500" />
              <Text style={styles.fileButtonText}>
                {hasFile ? t('registerSharedTransaction.fileAttached') : t('registerSharedTransaction.selectFile')}
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
              <Text style={styles.saveButtonText}>{t('registerSharedTransaction.saveButton')}</Text>
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
                <Text style={styles.datePickerTitle}>{t('registerSharedTransaction.selectDate')}</Text>
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  divisionSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  divisionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  divisionButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#E0E0E0',
  },
  divisionButtonMiddle: {
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderLeftColor: '#E0E0E0',
    borderRightColor: '#E0E0E0',
  },
  divisionButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#E0E0E0',
  },
  divisionButtonActive: {
    backgroundColor: '#FF9500',
  },
  divisionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  divisionButtonTextActive: {
    color: '#FFFFFF',
  },
  divisionInfo: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  divisionInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
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
  percentSymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
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
    color: '#FF9500',
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
    backgroundColor: '#FF9500',
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
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF9500',
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
