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
import { RESET_PASSWORD_URL } from '../constants/config';
import { supabase } from '../lib/supabase';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle Password Reset
   * Validates email and sends reset instructions via Supabase
   */
  const handlePasswordReset = async () => {
    // Input validation
    if (!email.trim()) {
      Alert.alert(t('common.error'), t('forgotPassword.errors.fillEmail'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('forgotPassword.errors.invalidEmail'));
      return;
    }

    setLoading(true);

    try {
      // Check if email exists using the database function
      const { data: emailExists, error: checkError } = await supabase
        .rpc('check_email_exists', { email_to_check: email.trim() });

      if (checkError) {
        setLoading(false);
        Alert.alert(t('common.error'), t('forgotPassword.errors.verificationError'));
        return;
      }

      if (!emailExists) {
        setLoading(false);
        Alert.alert(
          t('forgotPassword.errors.emailNotFound'),
          t('forgotPassword.errors.noAccount')
        );
        return;
      }

      // Send password reset OTP via email using Supabase
      // Supabase enviará un token de 6 dígitos al correo para restablecer contraseña
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'lumeo://reset-password', // Deep link pero usaremos el OTP manualmente
      });

      setLoading(false);

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        // Navigate to OTP verification screen, passing the email
        router.push({
          pathname: '/verify-otp',
          params: { email: email.trim() },
        });
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(t('common.error'), t('forgotPassword.errors.generalError'));
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
          {t('forgotPassword.title')}
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
              {t('forgotPassword.instruction')}
            </Text>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('forgotPassword.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('forgotPassword.emailPlaceholder')}
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handlePasswordReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('forgotPassword.sendButton')}</Text>
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
