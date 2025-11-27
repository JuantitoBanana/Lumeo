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
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  /**
   * Handle Login
   * Validates input and calls the signIn function from AuthContext
   */
  const handleLogin = async () => {
    // Input validation
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('login.errors.fillAllFields'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('login.errors.invalidEmail'));
      return;
    }

    setLoading(true);

    const { error } = await signIn(email.trim(), password);

    setLoading(false);

    if (error) {
      Alert.alert(t('login.errors.loginError'), error.message);
    } else {
      // Navigation will be handled automatically by the auth state change
      router.replace('/(tabs)');
    }
  };

  /**
   * Navigate to Sign Up Screen
   */
  const goToSignUp = () => {
    router.push('/signup');
  };

  return (
    <View style={styles.container}>
      {/* Back Button en la esquina superior izquierda de la pantalla */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          // Usar dismissTo para animación inversa y siempre ir a inicio
          if (router.canDismiss()) {
            router.dismissTo('/(tabs)');
          } else {
            router.push('/(tabs)');
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Header fuera del panel */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{t('login.title')}</Text>
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
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.emailPlaceholder')}
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('login.passwordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('login.passwordPlaceholder')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                editable={!loading}
              />
              {/* Forgot Password Link */}
              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => router.push('/forgot-password')}
                disabled={loading}
              >
                <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('login.loginButton')}</Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>{t('login.noAccount')}</Text>
              <TouchableOpacity onPress={goToSignUp} disabled={loading}>
                <Text style={styles.signupLink}>{t('login.signupLink')}</Text>
              </TouchableOpacity>
            </View>
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
    paddingTop: 20,
    position: 'relative',
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '500',
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#666',
    fontSize: 14,
  },
  signupLink: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
});
