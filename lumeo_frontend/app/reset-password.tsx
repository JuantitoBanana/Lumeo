import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Handle Password Update
   * Validates passwords and updates the user's password
   */
  const handleUpdatePassword = async () => {
    // Input validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(t('common.error'), t('resetPassword.errors.fillAllFields'));
      return;
    }

    // Password length validation
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('resetPassword.errors.passwordTooShort'));
      return;
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('resetPassword.errors.passwordsDontMatch'));
      return;
    }

    setLoading(true);

    try {
      // Get current user to compare passwords
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        Alert.alert(t('common.error'), t('resetPassword.errors.noSession'));
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      setLoading(false);

      if (error) {
        // Check if the error is about using the same password
        if (error.message.includes('same') || error.message.includes('igual')) {
          Alert.alert(t('common.error'), t('resetPassword.errors.samePassword'));
        } else {
          Alert.alert(t('common.error'), error.message);
        }
      } else {
        // Navigate to success screen
        router.replace('/password-reset-success');
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(t('common.error'), t('resetPassword.errors.generalError'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button en la esquina superior izquierda de la pantalla */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Header fuera del panel */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {t('resetPassword.title')}
        </Text>
      </View>

      {/* Panel con el formulario */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.formContainer}>
            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              {t('resetPassword.instruction')}
            </Text>

            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('resetPassword.newPasswordLabel')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('resetPassword.newPasswordPlaceholder')}
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  editable={!loading}
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
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('resetPassword.confirmPasswordLabel')}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  editable={!loading}
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
            </View>

            {/* Update Password Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdatePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('resetPassword.updateButton')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF9500',
  },
  headerContainer: {
    paddingTop: Platform.OS === 'ios' ? 90 : 70,
    paddingBottom: 20,
    paddingHorizontal: 30,
    backgroundColor: '#FF9500',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  formWrapper: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    position: 'relative',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 15,
  },
  button: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#FFCC80',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
