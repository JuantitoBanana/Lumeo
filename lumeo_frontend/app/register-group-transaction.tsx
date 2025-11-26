import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Pressable,
  Keyboard,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { grupoService } from '@/services/grupo.service';
import { transaccionGrupalService } from '@/services/transaccion-grupal.service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from '../hooks/useTranslation';

type TransactionType = 'gasto' | 'ingreso';
type DivisionType = 'igual' | 'exacto';

interface MiembroGrupo {
  idUsuario: number;
  nombreUsuario: string;
  seleccionado: boolean;
  importe: string;
  nombre?: string;
  apellido?: string;
}

export default function RegisterGroupTransactionScreen() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const idGrupo = params.idGrupo ? parseInt(params.idGrupo as string) : null;
  
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
  
  // Campos específicos para transacción de grupo
  const [divisionTipo, setDivisionTipo] = useState<DivisionType>('igual');
  const [miembros, setMiembros] = useState<MiembroGrupo[]>([]);
  const [loadingMiembros, setLoadingMiembros] = useState(true);
  const [nombreGrupo, setNombreGrupo] = useState('');
  
  // Modal de selección de usuarios
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [tempSelectedMembers, setTempSelectedMembers] = useState<number[]>([]);

  useEffect(() => {
    if (idGrupo && usuario?.id) {
      cargarMiembrosGrupo();
    }
  }, [idGrupo, usuario?.id]);

  const cargarMiembrosGrupo = async () => {
    if (!idGrupo || !usuario?.id) return;

    try {
      setLoadingMiembros(true);
      const grupoConMiembros = await grupoService.obtenerGrupoConMiembros(idGrupo);
      
      setNombreGrupo(grupoConMiembros.grupo.nombre);
      
      // Filtrar el usuario actual y NO marcar ninguno como seleccionado por defecto
      const miembrosFiltrados = grupoConMiembros.miembros
        .filter(m => m.idUsuario !== usuario.id)
        .map(m => ({
          idUsuario: m.idUsuario,
          nombreUsuario: m.nombreUsuario,
          seleccionado: false,
          importe: '',
          nombre: m.nombre || '',
          apellido: m.apellido || '',
        }));
      
      setMiembros(miembrosFiltrados);
    } catch (error) {
      console.error('Error al cargar miembros del grupo:', error);
      Alert.alert('Error', t('registerGroupTransaction.errors.loadMembersError'));
      router.back();
    } finally {
      setLoadingMiembros(false);
    }
  };

  const handleImporteChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    setImporte(normalized);
  };

  const handleMiembroImporteChange = (idUsuario: number, text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '');
    const normalized = cleaned.replace(',', '.');
    const parts = normalized.split('.');
    if (parts.length > 2) {
      return;
    }
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setMiembros(prev => prev.map(m => 
      m.idUsuario === idUsuario 
        ? { ...m, importe: normalized }
        : m
    ));
  };

  const toggleMiembroSeleccion = (idUsuario: number) => {
    setMiembros(prev => prev.map(m => 
      m.idUsuario === idUsuario 
        ? { ...m, seleccionado: !m.seleccionado }
        : m
    ));
  };

  const handleOpenMembersModal = () => {
    // Guardar la selección actual en el estado temporal
    const selectedIds = miembros.filter(m => m.seleccionado).map(m => m.idUsuario);
    setTempSelectedMembers(selectedIds);
    setShowMembersModal(true);
  };

  const handleToggleTempMember = (idUsuario: number) => {
    setTempSelectedMembers(prev => {
      if (prev.includes(idUsuario)) {
        return prev.filter(id => id !== idUsuario);
      } else {
        return [...prev, idUsuario];
      }
    });
  };

  const handleConfirmMembers = () => {
    // Actualizar la selección de miembros con la selección temporal
    setMiembros(prevMiembros =>
      prevMiembros.map(m => ({
        ...m,
        seleccionado: tempSelectedMembers.includes(m.idUsuario),
      }))
    );
    setShowMembersModal(false);
  };

  const handleCancelMembers = () => {
    setShowMembersModal(false);
  };

  const formatDateDisplay = (date: Date) => {
    const monthKeys = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = t(`registerGroupTransaction.months.${monthKeys[date.getMonth()]}`);
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

  const calcularImportesPorMiembro = (importeTotal: number): { [idUsuario: number]: number } => {
    const miembrosSeleccionados = miembros.filter(m => m.seleccionado);
    const importes: { [idUsuario: number]: number } = {};

    if (divisionTipo === 'igual') {
      // Dividir entre miembros seleccionados + usuario actual
      const totalPersonas = miembrosSeleccionados.length + 1;
      const importePorMiembro = importeTotal / totalPersonas;
      
      miembrosSeleccionados.forEach(m => {
        importes[m.idUsuario] = importePorMiembro;
      });
      
      // Añadir el importe del usuario actual
      if (usuario?.id) {
        importes[usuario.id] = importePorMiembro;
      }
    } else if (divisionTipo === 'exacto') {
      // Calcular suma de importes de miembros
      let sumaImportesMiembros = 0;
      miembrosSeleccionados.forEach(m => {
        const importeMiembro = parseFloat(m.importe || '0');
        importes[m.idUsuario] = importeMiembro;
        sumaImportesMiembros += importeMiembro;
      });
      
      // El restante es para el usuario actual
      if (usuario?.id) {
        importes[usuario.id] = importeTotal - sumaImportesMiembros;
      }
    }

    return importes;
  };

  const handleSubmit = async () => {
    // Validación básica
    if (!titulo.trim()) {
      Alert.alert('Error', t('registerGroupTransaction.errors.titleRequired'));
      return;
    }
    if (!importe || parseFloat(importe) <= 0) {
      Alert.alert('Error', t('registerGroupTransaction.errors.amountRequired'));
      return;
    }
    if (!idGrupo) {
      Alert.alert('Error', t('registerGroupTransaction.errors.groupRequired'));
      return;
    }
    if (!usuario?.id) {
      Alert.alert('Error', t('registerGroupTransaction.errors.userRequired'));
      return;
    }

    const miembrosSeleccionados = miembros.filter(m => m.seleccionado);
    if (miembrosSeleccionados.length === 0) {
      Alert.alert('Error', t('registerGroupTransaction.errors.membersRequired'));
      return;
    }

    // Validaciones específicas para división exacta
    if (divisionTipo === 'exacto') {
      const importeTotal = parseFloat(importe);
      let sumaImportes = 0;
      
      for (const miembro of miembrosSeleccionados) {
        const importeMiembro = parseFloat(miembro.importe || '0');
        if (importeMiembro < 0) {
          Alert.alert('Error', t('registerGroupTransaction.errors.negativeAmount', { username: miembro.nombreUsuario }));
          return;
        }
        sumaImportes += importeMiembro;
      }
      
      // El restante será para el usuario actual
      const importeUsuarioActual = importeTotal - sumaImportes;
      if (importeUsuarioActual < 0) {
        Alert.alert(
          'Error', 
          t('registerGroupTransaction.errors.sumExceedsTotal', {
            sum: sumaImportes.toFixed(2),
            total: importeTotal.toFixed(2)
          })
        );
        return;
      }
    }

    setSaving(true);

    try {
      const importeTotal = parseFloat(importe);
      const importesPorMiembro = calcularImportesPorMiembro(importeTotal);

      // Preparar transacciones individuales
      const transaccionesIndividuales = [];
      
      // Transacciones de miembros seleccionados
      miembrosSeleccionados.forEach(miembro => {
        transaccionesIndividuales.push({
          idUsuario: miembro.idUsuario,
          importe: importesPorMiembro[miembro.idUsuario],
        });
      });
      
      // Transacción del usuario actual
      if (usuario?.id && importesPorMiembro[usuario.id]) {
        transaccionesIndividuales.push({
          idUsuario: usuario.id,
          importe: importesPorMiembro[usuario.id],
        });
      }

      // Crear la transacción grupal con las transacciones individuales
      await transaccionGrupalService.crear({
        titulo: titulo.trim(),
        importeTotal: importeTotal,
        fechaTransaccion: fechaTransaccion.toISOString().split('T')[0],
        nota: nota.trim() || null,
        idGrupo: idGrupo,
        idTipo: tipo === 'ingreso' ? 1 : 2,
        transaccionesIndividuales: transaccionesIndividuales,
      });

      // Navegar al detalle del grupo
      router.replace({
        pathname: '/group-detail',
        params: { idGrupo: idGrupo }
      });
    } catch (error: any) {
      console.error('Error al guardar transacción grupal:', error);
      
      let errorMessage = t('registerGroupTransaction.errors.saveError');
      
      if (error.status === 400) {
        errorMessage = t('registerGroupTransaction.errors.invalidData');
      } else if (error.status === 500) {
        errorMessage = t('registerGroupTransaction.errors.serverError');
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const calcularTotalAsignado = () => {
    if (divisionTipo === 'exacto') {
      return miembros
        .filter(m => m.seleccionado)
        .reduce((sum, m) => sum + parseFloat(m.importe || '0'), 0);
    }
    return 0;
  };

  const miembrosSeleccionados = miembros.filter(m => m.seleccionado);
  const totalAsignado = calcularTotalAsignado();
  const importeTotal = parseFloat(importe || '0');

  if (loadingMiembros) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('registerGroupTransaction.loadingMembers')}</Text>
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
        <Text style={styles.headerTitle}>{t('registerGroupTransaction.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        bounces={true}
      >
        {/* Info del grupo */}
        <View style={styles.groupInfoCard}>
          <Ionicons name="people" size={24} color="#007AFF" />
          <Text style={styles.groupInfoText}>{nombreGrupo}</Text>
        </View>

        {/* Título */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('registerGroupTransaction.titleLabel')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t('registerGroupTransaction.titlePlaceholder')}
            value={titulo}
            onChangeText={setTitulo}
            placeholderTextColor="#999"
          />
        </View>

        {/* Selector de tipo */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {t('registerGroupTransaction.typeLabel')} <Text style={styles.required}>*</Text>
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
                  {t('registerGroupTransaction.expense')}
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
                  {t('registerGroupTransaction.income')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Importe Total */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerGroupTransaction.totalAmountLabel')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.importeContainer}>
              <Text style={styles.currencySymbol}>€</Text>
              <TextInput
                style={styles.importeInput}
                placeholder="0,00"
                value={importe}
                onChangeText={handleImporteChange}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* División de Importe */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerGroupTransaction.divisionLabel')} <Text style={styles.required}>*</Text>
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
                  {t('registerGroupTransaction.equal')}
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
                  {t('registerGroupTransaction.exact')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selección de miembros */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerGroupTransaction.membersLabel')} <Text style={styles.required}>*</Text>
            </Text>
            
            {/* Botón para abrir modal de selección */}
            <TouchableOpacity 
              style={styles.selectMembersButton}
              onPress={handleOpenMembersModal}
            >
              <View style={styles.selectMembersContent}>
                <Ionicons name="people-outline" size={24} color="#007AFF" />
                <Text style={styles.selectMembersText}>
                  {miembrosSeleccionados.length === 0 
                    ? t('registerGroupTransaction.selectParticipants')
                    : `${miembrosSeleccionados.length} ${miembrosSeleccionados.length !== 1 ? t('registerGroupTransaction.selectedParticipantsPlural') : t('registerGroupTransaction.selectedParticipants')}`
                  }
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {/* Lista de miembros seleccionados */}
            {miembrosSeleccionados.length > 0 && (
              <View style={styles.selectedMembersContainer}>
                {miembrosSeleccionados.map((miembro) => (
                  <View key={miembro.idUsuario} style={styles.selectedMemberCard}>
                    <View style={styles.selectedMemberInfo}>
                      <View style={styles.selectedMemberAvatar}>
                        <Ionicons name="person" size={20} color="#007AFF" />
                      </View>
                      <View style={styles.selectedMemberText}>
                        <Text style={styles.selectedMemberName}>
                          {miembro.nombre && miembro.apellido 
                            ? `${miembro.nombre} ${miembro.apellido}`
                            : miembro.nombreUsuario
                          }
                        </Text>
                        <Text style={styles.selectedMemberUsername}>@{miembro.nombreUsuario}</Text>
                      </View>
                    </View>
                    
                    {divisionTipo === 'igual' && importe && (
                      <Text style={styles.memberAmount}>
                        €{(parseFloat(importe) / (miembrosSeleccionados.length + 1)).toFixed(2)}
                      </Text>
                    )}
                    
                    {divisionTipo === 'exacto' && (
                      <View style={styles.memberImporteContainer}>
                        <Text style={styles.currencySymbolSmall}>€</Text>
                        <TextInput
                          style={styles.memberImporteInput}
                          placeholder="0,00"
                          value={miembro.importe}
                          onChangeText={(text) => handleMiembroImporteChange(miembro.idUsuario, text)}
                          keyboardType="decimal-pad"
                          placeholderTextColor="#999"
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
            
            {divisionTipo === 'igual' && miembrosSeleccionados.length > 0 && importe && (
              <View style={styles.divisionInfo}>
                <Text style={styles.divisionInfoText}>
                  {t('registerGroupTransaction.eachMemberPays')} €{(parseFloat(importe) / (miembrosSeleccionados.length + 1)).toFixed(2)}
                </Text>
                <Text style={styles.currentUserInfoText}>
                  {t('registerGroupTransaction.yourAmount')} €{(parseFloat(importe) / (miembrosSeleccionados.length + 1)).toFixed(2)}
                </Text>
              </View>
            )}
            
            {divisionTipo === 'exacto' && miembrosSeleccionados.length > 0 && importe && (
              <View style={styles.divisionInfo}>
                <Text style={styles.divisionInfoText}>
                  {t('registerGroupTransaction.totalMembers')} €{totalAsignado.toFixed(2)}
                </Text>
                <Text style={styles.currentUserInfoText}>
                  {t('registerGroupTransaction.yourAmount')} €{(parseFloat(importe) - totalAsignado).toFixed(2)}
                </Text>
                {(parseFloat(importe) - totalAsignado) < 0 && (
                  <Text style={styles.warningText}>
                    {t('registerGroupTransaction.sumExceedsTotal')}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Fecha de transacción */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              {t('registerGroupTransaction.dateLabel')} <Text style={styles.required}>*</Text>
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
            <Text style={styles.label}>{t('registerGroupTransaction.noteLabel')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('registerGroupTransaction.notePlaceholder')}
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
            <Text style={styles.label}>{t('registerGroupTransaction.fileLabel')}</Text>
            <TouchableOpacity 
              style={styles.fileButton}
              onPress={() => {
                // TODO: Implementar funcionalidad de adjuntar archivo
              }}
            >
              <Ionicons name="attach" size={24} color="#007AFF" />
              <Text style={styles.fileButtonText}>
                {hasFile ? t('registerGroupTransaction.fileAttached') : t('registerGroupTransaction.selectFile')}
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
              <Text style={styles.saveButtonText}>{t('registerGroupTransaction.saveButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

      {/* Date Picker */}
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
                <Text style={styles.datePickerTitle}>{t('registerGroupTransaction.selectDateTitle')}</Text>
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
                  <Text style={styles.datePickerCancelText}>{t('registerGroupTransaction.cancelButton')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.datePickerConfirmButton}
                  onPress={confirmDate}
                >
                  <Text style={styles.datePickerConfirmText}>{t('registerGroupTransaction.confirmButton')}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Modal de selección de miembros */}
      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelMembers}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCancelMembers}>
          <Pressable style={styles.membersModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.membersModalHeader}>
              <Text style={styles.membersModalTitle}>{t('registerGroupTransaction.selectParticipantsTitle')}</Text>
            </View>

            <ScrollView style={styles.membersModalScroll}>
              {miembros.map((miembro) => (
                <TouchableOpacity
                  key={miembro.idUsuario}
                  style={styles.membersModalItem}
                  onPress={() => handleToggleTempMember(miembro.idUsuario)}
                >
                  <View style={styles.membersModalItemContent}>
                    <View style={styles.membersModalAvatar}>
                      <Ionicons name="person" size={20} color="#007AFF" />
                    </View>
                    <View style={styles.membersModalText}>
                      <Text style={styles.membersModalName}>
                        {miembro.nombre && miembro.apellido 
                          ? `${miembro.nombre} ${miembro.apellido}`
                          : miembro.nombreUsuario
                        }
                      </Text>
                      <Text style={styles.membersModalUsername}>@{miembro.nombreUsuario}</Text>
                    </View>
                  </View>
                  {tempSelectedMembers.includes(miembro.idUsuario) && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.membersModalButtons}>
              <TouchableOpacity 
                style={styles.membersCancelButton} 
                onPress={handleCancelMembers}
              >
                <Text style={styles.membersCancelText}>{t('registerGroupTransaction.cancelButton')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.membersConfirmButton} 
                onPress={handleConfirmMembers}
              >
                <Text style={styles.membersConfirmText}>{t('registerGroupTransaction.confirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
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
  groupInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  groupInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    flex: 1,
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
  divisionButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#E0E0E0',
  },
  divisionButtonActive: {
    backgroundColor: '#007AFF',
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
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  divisionInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  currentUserInfoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 4,
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
  membersContainer: {
    gap: 12,
  },
  emptyMembersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  emptyMembersText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  memberCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  memberAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  memberImporteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  currencySymbolSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 4,
  },
  memberImporteInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    padding: 0,
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
  // Estilos para el botón de selección de miembros
  selectMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectMembersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectMembersText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  // Estilos para miembros seleccionados
  selectedMembersContainer: {
    marginTop: 12,
    gap: 8,
  },
  selectedMemberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedMemberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedMemberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedMemberText: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectedMemberUsername: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  // Estilos para el modal de selección
  membersModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  membersModalHeader: {
    marginBottom: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 12,
  },
  membersModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  membersModalScroll: {
    maxHeight: 300,
  },
  membersModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  membersModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  membersModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersModalText: {
    flex: 1,
  },
  membersModalName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  membersModalUsername: {
    fontSize: 13,
    color: '#007AFF',
    marginTop: 2,
  },
  membersModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  membersCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  membersCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  membersConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  membersConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
