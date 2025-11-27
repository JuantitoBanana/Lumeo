import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/hooks/useTranslation';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);

  const handleForgotPassword = async () => {
    if (!user?.email) {
      Alert.alert(t('common.error'), t('changePassword.errors.noUser'));
      return;
    }

    try {
      setSendingOTP(true);

      // Enviar OTP de recuperación de contraseña al correo del usuario actual
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'lumeo://reset-password',
      });

      setSendingOTP(false);

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        // Navigate to OTP verification screen, passing the email
        router.push({
          pathname: '/verify-otp',
          params: { email: user.email },
        });
      }
    } catch (error: any) {
      setSendingOTP(false);
      console.error('Error al enviar OTP:', error);
      Alert.alert(t('common.error'), t('changePassword.errors.unexpected'));
    }
  };

  const handleSave = async () => {
    // Validaciones básicas
    if (!currentPassword.trim()) {
      Alert.alert(t('common.error'), t('changePassword.errors.emptyCurrentPassword'));
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert(t('common.error'), t('changePassword.errors.emptyNewPassword'));
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('changePassword.errors.emptyConfirmPassword'));
      return;
    }

    // Validar que la nueva contraseña tenga al menos 6 caracteres
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('changePassword.errors.passwordTooShort'));
      return;
    }

    // Validar que la nueva contraseña sea diferente a la actual
    if (currentPassword === newPassword) {
      Alert.alert(t('common.error'), t('changePassword.errors.samePassword'));
      return;
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('changePassword.errors.passwordsDontMatch'));
      return;
    }

    if (!user?.email) {
      Alert.alert(t('common.error'), t('changePassword.errors.noUser'));
      return;
    }

    try {
      setSaving(true);

      // Verificar que hay una sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSaving(false);
        Alert.alert(t('common.error'), t('changePassword.errors.noSession'));
        return;
      }

      // En Supabase, para cambiar la contraseña necesitamos verificar la actual primero
      // La forma más segura es usar signInWithPassword temporalmente
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        setSaving(false);
        Alert.alert(t('common.error'), t('changePassword.errors.incorrectCurrentPassword'));
        return;
      }

      // Si llegamos aquí, la contraseña actual es correcta
      // Ahora actualizar a la nueva contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setSaving(false);
        console.error('Error al actualizar contraseña:', updateError);
        Alert.alert(t('common.error'), t('changePassword.errors.updateFailed'));
        return;
      }

      setSaving(false);
      // Navegar a la pantalla de confirmación
      router.replace('/password-change-success');
    } catch (error: any) {
      setSaving(false);
      console.error('Error inesperado:', error);
      Alert.alert(t('common.error'), t('changePassword.errors.unexpected'));
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
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('changePassword.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información */}
        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#FF9500" />
          <Text style={styles.infoText}>
            {t('changePassword.securityNote')}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Contraseña actual */}
          <Text style={styles.label}>
            {t('changePassword.currentPassword')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('changePassword.currentPasswordPlaceholder')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              <Ionicons
                name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Nueva contraseña */}
          <Text style={[styles.label, styles.labelSpacing]}>
            {t('changePassword.newPassword')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('changePassword.newPasswordPlaceholder')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons
                name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          {/* Repetir nueva contraseña */}
          <Text style={[styles.label, styles.labelSpacing]}>
            {t('changePassword.confirmPassword')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('changePassword.confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#999"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {t('changePassword.hint')}
          </Text>

          {/* Botón ¿Has olvidado tu contraseña? */}
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={sendingOTP || saving}
          >
            {sendingOTP ? (
              <ActivityIndicator size="small" color="#FF9500" />
            ) : (
              <Text style={styles.forgotPasswordText}>
                {t('changePassword.forgotPassword')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.warningCard}>
          <Ionicons name="information-circle-outline" size={24} color="#FF9500" />
          <Text style={styles.warningText}>
            {t('changePassword.warning')}
          </Text>
        </View>
      </ScrollView>

      {/* Botón de guardar */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>{t('changePassword.saveChanges')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  },
  scrollContent: {
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  labelSpacing: {
    marginTop: 20,
  },
  required: {
    color: '#FF6B6B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
  },
  eyeButton: {
    padding: 16,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
  forgotPasswordButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  forgotPasswordText: {
    fontSize: 15,
    color: '#FF9500',
    fontWeight: '600',
  },
});
