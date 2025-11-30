import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Ocultar la barra de navegación en Android y configurar modo inmersivo
    if (Platform.OS === 'android') {
      const configureImmersiveMode = async () => {
        try {
          // Ocultar barra de navegación
          await NavigationBar.setVisibilityAsync('hidden');
          // Comportamiento para que al deslizar aparezca sobre el contenido sin redimensionar
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (e) {
          console.error('Error configuring navigation bar:', e);
        }
      };
      
      configureImmersiveMode();
      
      // Listener para mantener oculto si la app vuelve al primer plano
      const subscription = NavigationBar.addVisibilityListener(({ visibility }) => {
        if (visibility === 'visible') {
          setTimeout(() => {
            configureImmersiveMode();
          }, 3000); // Volver a ocultar después de 3 segundos si aparece
        }
      });

      return () => {
        subscription.remove();
      };
    }
  }, []);

  return (
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="password-reset-success" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="change-email" options={{ headerShown: false }} />
            <Stack.Screen name="email-change-success" options={{ headerShown: false }} />
            <Stack.Screen name="change-password" options={{ headerShown: false }} />
            <Stack.Screen name="password-change-success" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" hidden={true} />
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
