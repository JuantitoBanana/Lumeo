import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef } from 'react';
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

export default function VerifyOtpScreen() {
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  /**
   * Handle OTP input change
   */
  const handleOtpChange = (value: string, index: number) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle backspace key
   */
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle OTP Verification
   */
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    // Validation
    if (otpCode.length !== 6) {
      Alert.alert(t('common.error'), t('verifyOtp.errors.incompleteCode'));
      return;
    }

    if (!email) {
      Alert.alert(t('common.error'), t('verifyOtp.errors.noEmail'));
      return;
    }

    setLoading(true);

    try {
      // Verify OTP for password recovery with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email: email as string,
        token: otpCode,
        type: 'recovery', // Changed from 'email' to 'recovery' for password reset
      });

      setLoading(false);

      if (error) {
        Alert.alert(t('common.error'), t('verifyOtp.errors.invalidCode'));
        // Clear OTP inputs on error
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else if (data.session) {
        // OTP verified successfully, navigate to reset password screen
        router.push('/reset-password');
      } else {
        Alert.alert(t('common.error'), t('verifyOtp.errors.verificationFailed'));
      }
    } catch (err) {
      setLoading(false);
      Alert.alert(t('common.error'), t('verifyOtp.errors.generalError'));
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('verifyOtp.errors.noEmail'));
      return;
    }

    setResending(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email as string, {
        redirectTo: 'lumeo://reset-password',
      });

      setResending(false);

      if (error) {
        Alert.alert(t('common.error'), error.message);
      } else {
        Alert.alert(t('common.success'), t('verifyOtp.codeSentAgain'));
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setResending(false);
      Alert.alert(t('common.error'), t('verifyOtp.errors.resendError'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>
          {t('verifyOtp.title')}
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
            {/* Icon */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="mail-outline" size={48} color="#FF9500" />
              </View>
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              {t('verifyOtp.instruction', { email: email || '' })}
            </Text>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!loading && !resending}
                />
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerifyOtp}
              disabled={loading || resending}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>{t('verifyOtp.verifyButton')}</Text>
              )}
            </TouchableOpacity>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>{t('verifyOtp.didntReceiveCode')}</Text>
              <TouchableOpacity 
                onPress={handleResendOtp}
                disabled={resending || loading}
              >
                {resending ? (
                  <ActivityIndicator size="small" color="#FF9500" style={styles.resendLoader} />
                ) : (
                  <Text style={styles.resendLink}>{t('verifyOtp.resendCode')}</Text>
                )}
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
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 10,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  otpInputFilled: {
    borderColor: '#FF9500',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '100%',
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
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    gap: 5,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  resendLoader: {
    marginLeft: 5,
  },
});
