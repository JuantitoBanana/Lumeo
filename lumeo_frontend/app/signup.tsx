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

export default function SignUpScreen() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  /**
   * Handle Sign Up
   * Validates all inputs and creates a new user account
   */
  const handleSignUp = async () => {
    // Input validation
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert(t('common.error'), t('signup.errors.fillAllFields'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('signup.errors.invalidEmail'));
      return;
    }

    // Password validation
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('signup.errors.passwordTooShort'));
      return;
    }

    // Password match validation
    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('signup.errors.passwordsDontMatch'));
      return;
    }

    // Username validation (only alphanumeric and underscores)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      Alert.alert(t('common.error'), t('signup.errors.invalidUsername'));
      return;
    }

    setLoading(true);

    const { error } = await signUp(email.trim(), password, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
    });

    setLoading(false);

    if (error) {
      Alert.alert(t('signup.errors.signupError'), error.message);
    } else {
      Alert.alert(
        t('signup.success.title'),
        t('signup.success.message'),
        [
          {
            text: t('signup.success.button'),
            onPress: () => router.replace('/login'),
          },
        ]
      );
    }
  };

  /**
   * Navigate back to Login Screen
   */
  const goToLogin = () => {
    router.push('/login');
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
        <Text style={styles.title}>{t('signup.title')}</Text>
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

            {/* First Name and Last Name in the same row */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{t('signup.firstNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('signup.firstNamePlaceholder')}
                  placeholderTextColor="#999"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>{t('signup.lastNameLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('signup.lastNamePlaceholder')}
                  placeholderTextColor="#999"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('signup.usernameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup.usernamePlaceholder')}
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('signup.emailLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup.emailPlaceholder')}
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
              <Text style={styles.label}>{t('signup.passwordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup.passwordPlaceholder')}
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                keyboardType="default"
                spellCheck={false}
                editable={!loading}
              />
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('signup.confirmPasswordLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('signup.confirmPasswordPlaceholder')}
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
                keyboardType="default"
                spellCheck={false}
                passwordRules=""
                editable={!loading}
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('signup.signupButton')}</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>{t('signup.haveAccount')}</Text>
              <TouchableOpacity onPress={goToLogin} disabled={loading}>
                <Text style={styles.loginLink}>{t('signup.loginLink')}</Text>
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
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
  },
  halfWidth: {
    flex: 1,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
});
