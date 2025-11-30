import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, useMemo, memo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useResumenFinanciero } from '@/hooks/useResumenFinanciero';
import { useGastosPorCategoria } from '../../hooks/useGastosPorCategoria';
import { useEvolucionMensual } from '../../hooks/useEvolucionMensual';
import GraficoCategoria from '@/components/GraficoCategoria';
import GraficoEvolucion from '@/components/GraficoEvolucion';
import UltimosGastos from '@/components/UltimosGastos';
import { apiClient } from '@/lib/api-client';
import { eventEmitter, APP_EVENTS } from '@/lib/event-emitter';
import { Language } from '@/contexts/I18nContext';
import { Modal, Pressable, Platform, ToastAndroid, Alert } from 'react-native';

export default function HomeScreen() {
  const { t, language, changeLanguage, availableLanguages } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  
  const { usuario, loading: loadingUsuario, error: errorUsuario, refetchUsuario } = useUsuarioApi();
  const { resumen, loading: loadingResumen, error: errorResumen, refetch: refetchResumen } = useResumenFinanciero(usuario?.id || null);
  const { gastos, loading: loadingGastos, error: errorGastos, refetch: refetchGastos } = useGastosPorCategoria(usuario?.id || null);
  const { evolucion, loading: loadingEvolucion, error: errorEvolucion, refetch: refetchEvolucion } = useEvolucionMensual(usuario?.id || null, 2);
  const scrollViewRef = useRef<ScrollView>(null);

  // Estados para el selector de idioma
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [savingLanguage, setSavingLanguage] = useState(false);
  
  // Estado para controlar la carga diferida de UltimosGastos
  const [showUltimosGastos, setShowUltimosGastos] = useState(false);

  // Cargar UltimosGastos después de un breve delay para priorizar el contenido principal
  useEffect(() => {
    if (usuario?.id && !loadingResumen) {
      const timer = setTimeout(() => {
        setShowUltimosGastos(true);
      }, 300); // Cargar después de 300ms
      return () => clearTimeout(timer);
    }
  }, [usuario?.id, loadingResumen]);

  // Refrescar datos cuando la pantalla recibe el foco
  useFocusEffect(
    React.useCallback(() => {
      if (usuario?.id) {
        refetchResumen();
        refetchGastos();
        refetchEvolucion();
        // Emitir evento para refrescar UltimosGastos
        eventEmitter.emit(APP_EVENTS.DASHBOARD_REFRESH);
      }
    }, [usuario?.id])
  );

  // Componente Skeleton para el resumen
  const SkeletonSummary = memo(() => (
    <View style={styles.monthlySection}>
      <View style={styles.skeletonTitle} />
      <View style={styles.monthlyGrid}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.monthlyItem}>
            <View style={[styles.skeletonText, { width: '60%' }]} />
            <View style={[styles.skeletonText, { width: '80%' }]} />
          </View>
        ))}
      </View>
    </View>
  ));

  // Funciones para el selector de idioma
  const handleOpenLanguageModal = () => {
    setSelectedLanguage(language);
    setShowLanguageModal(true);
  };

  const handleSelectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
  };

  const handleConfirmLanguage = async () => {
    try {
      setSavingLanguage(true);
      await changeLanguage(selectedLanguage);
      setShowLanguageModal(false);
      
      // Feedback según la plataforma
      const languageName = availableLanguages.find(l => l.code === selectedLanguage)?.nativeName;
      if (Platform.OS === 'android') {
        ToastAndroid.show(t('language.languageChanged', { language: languageName || '' }), ToastAndroid.SHORT);
      } else {
        Alert.alert(t('common.success'), t('language.languageChanged', { language: languageName || '' }));
      }
    } catch (error) {
      console.error('Error al cambiar idioma:', error);
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleCancelLanguage = () => {
    setShowLanguageModal(false);
    setSelectedLanguage(language);
  };

  // Función para refrescar todo el contenido
  const handleRefresh = () => {
    // Hacer scroll al inicio
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Refrescar todos los datos
    refetchUsuario();
    refetchResumen();
    refetchGastos();
    refetchEvolucion();
    // Emitir evento para refrescar UltimosGastos
    eventEmitter.emit(APP_EVENTS.DASHBOARD_REFRESH);
  };

  // Escuchar cambios de divisa
  useEffect(() => {
    const unsubscribe = eventEmitter.on(APP_EVENTS.CURRENCY_CHANGED, () => {
      // Recargar INMEDIATAMENTE sin delay - el backend ya terminó la conversión
      // Recargar todos los datos del dashboard en paralelo
      Promise.all([
        refetchUsuario(),
        refetchResumen(),
        refetchGastos(),
        refetchEvolucion()
      ]).then(() => {
      }).catch(err => {
        console.error('❌ Error al actualizar dashboard:', err);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Escuchar eliminación de transacciones
  useEffect(() => {
    const unsubscribe = eventEmitter.on(APP_EVENTS.TRANSACTION_DELETED, () => {
      // Recargar todos los datos del dashboard en paralelo
      Promise.all([
        refetchUsuario(),
        refetchResumen(),
        refetchGastos(),
        refetchEvolucion()
      ]).then(() => {
      }).catch(err => {
        console.error('❌ Error al actualizar dashboard:', err);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup: Cancelar todas las peticiones pendientes cuando se desmonta el componente
  useEffect(() => {
    return () => {
      apiClient.cancelAllRequests();
    };
  }, []);

  // Función para formatear cantidades monetarias (memoizada)
  const formatearCantidad = useMemo(() => 
    (cantidad: number, simbolo: string, posicion: string = 'DESPUES') => {
      const cantidadFormateada = cantidad.toFixed(2);
      // Respetar la posición del símbolo según la divisa
      if (posicion === 'ANTES') {
        return `${simbolo}${cantidadFormateada}`;
      } else {
        return `${cantidadFormateada}${simbolo}`;
      }
    }, []
  );

  // Solo mostrar pantalla de carga inicial si NO tenemos usuario cargado
  // Esto permite que la UI se muestre inmediatamente y los datos se carguen progresivamente
  const showInitialLoading = user && loadingUsuario;

  // Pantalla de carga inicial solo para usuario
  if (showInitialLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingScreenText}>{t('home.loadingInfo')}</Text>
      </View>
    );
  }

  // Si el usuario está autenticado, mostrar contenido diferente
  if (user) {
    return (
      <View style={styles.container}>
        {/* Header con saludo */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            {loadingUsuario ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF9500" />
                <Text style={styles.greetingText}>{t('home.loading')}</Text>
              </View>
            ) : errorUsuario ? (
              <Text style={styles.greetingText}>{t('home.helloDefault')}</Text>
            ) : (
              <Text style={styles.greetingText}>
                {t('home.hello', { name: usuario?.nombre || 'Usuario' })}
              </Text>
            )}
          </View>
          
          {/* Iconos de la derecha */}
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/groups')}
            >
              <Ionicons name="people" size={24} color="#FF9500" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerta de error del servidor */}
        {errorUsuario && errorUsuario.includes('Error del servidor') && (
          <View style={styles.serverErrorAlert}>
            <Ionicons name="warning" size={24} color="#FFF" />
            <View style={styles.serverErrorTextContainer}>
              <Text style={styles.serverErrorTitle}>{t('home.serverError')}</Text>
              <Text style={styles.serverErrorMessage}>{errorUsuario}</Text>
            </View>
          </View>
        )}

        {/* Contenido principal con scroll */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.mainContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Panel del Dashboard */}
          <View style={styles.dashboardPanel}>
            <View style={styles.dashboardHeader}>
              <Text style={styles.dashboardTitle}>{t('home.dashboard')}</Text>
              {resumen ? (
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>{t('home.totalBalance')}</Text>
                  <Text style={[
                    styles.dashboardBalance,
                    { color: resumen.saldoTotal >= 0 ? '#4CAF50' : '#F44336' }
                  ]}>
                    {formatearCantidad(resumen.saldoTotal, resumen.simboloDivisa, resumen.posicionSimbolo)}
                  </Text>
                </View>
              ) : (
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>{t('home.totalBalance')}</Text>
                  <Text style={styles.dashboardBalance}>
                    --
                  </Text>
                </View>
              )}
            </View>
            
            {loadingResumen && !resumen ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF9500" />
                <Text style={styles.loadingText}>{t('home.loadingSummary')}</Text>
              </View>
            ) : errorResumen ? (
              <Text style={styles.errorText}>{t('home.errorLoadingSummary')}</Text>
            ) : null}
            
            {/* Sección de Gráficos */}
            <View style={styles.chartsSection}>
              <View style={styles.chartsRow}>
                <GraficoCategoria 
                  gastos={gastos} 
                  loading={loadingGastos && gastos.length === 0} 
                />
                <GraficoEvolucion 
                  evolucion={evolucion} 
                  loading={loadingEvolucion && evolucion.length === 0} 
                />
              </View>
            </View>
            
            {/* Resumen del mes actual */}
            {loadingResumen && !resumen ? (
              <SkeletonSummary />
            ) : resumen ? (
              <View style={styles.monthlySection}>
                <Text style={styles.monthlySectionTitle}>{t('home.monthlyResume')}</Text>
                <View style={styles.monthlyGrid}>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>{t('home.income')}</Text>
                    <Text style={[styles.monthlyValue, { color: '#4CAF50' }]}>
                      {formatearCantidad(resumen.ingresosMensuales, resumen.simboloDivisa, resumen.posicionSimbolo)}
                    </Text>
                  </View>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>{t('home.expenses')}</Text>
                    <Text style={[styles.monthlyValue, { color: '#F44336' }]}>
                      {formatearCantidad(resumen.gastosMensuales, resumen.simboloDivisa, resumen.posicionSimbolo)}
                    </Text>
                  </View>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>{t('home.savings')}</Text>
                    <Text style={[
                      styles.monthlyValue,
                      { color: resumen.ahorroMensual >= 0 ? '#4CAF50' : '#F44336' }
                    ]}>
                      {formatearCantidad(resumen.ahorroMensual, resumen.simboloDivisa, resumen.posicionSimbolo)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Panel de Últimos Gastos - Carga diferida */}
          {showUltimosGastos && <UltimosGastos usuarioId={usuario?.id} />}
        </ScrollView>

        <BottomTabBar activeTab="home" onTabRefresh={handleRefresh} />
      </View>
    );
  }

  // Pantalla de bienvenida para usuarios no autenticados
  return (
    <View style={styles.container}>
      {/* Botón de idioma flotante */}
      <TouchableOpacity 
        style={styles.floatingLanguageButton}
        onPress={handleOpenLanguageModal}
      >
        <Ionicons name="language" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Imagen superior - 60% de la pantalla */}
      <LinearGradient
        colors={['#FF9500', '#FFCC80']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imageContainer}
      >
        <Image
          source={require('@/assets/images/logo_sombra.png')}
          style={styles.welcomeImage}
          contentFit="contain"
        />
      </LinearGradient>

      {/* Panel inferior con esquinas redondeadas - 40% */}
      <View style={styles.contentPanel}>
        {/* Textos de bienvenida */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeTitle}>{t('home.welcomeTitle')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {t('home.welcomeSubtitle')}
          </Text>
        </View>

        {/* Botones en la parte inferior */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.buttonText, { color: '#FF9500' }]}>{t('home.loginButton')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push('/signup')}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>{t('home.signupButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de selector de idioma */}
      <Modal visible={showLanguageModal} transparent={true} animationType="fade">
        <Pressable style={styles.languageModalOverlay} onPress={handleCancelLanguage}>
          <Pressable style={styles.languageModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>{t('language.title')}</Text>
              <TouchableOpacity onPress={handleCancelLanguage}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {availableLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageItem,
                    selectedLanguage === lang.code && styles.languageItemSelected
                  ]}
                  onPress={() => handleSelectLanguage(lang.code)}
                >
                  <View style={styles.languageItemContent}>
                    <Text style={styles.languageItemISO}>
                      {lang.flag} {lang.nativeName}
                    </Text>
                    <Text style={styles.languageItemDescription}>{lang.name}</Text>
                  </View>
                  {selectedLanguage === lang.code && (
                    <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.languageModalButtons}>
              <TouchableOpacity 
                style={styles.languageCancelButton} 
                onPress={handleCancelLanguage}
              >
                <Text style={styles.languageCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageConfirmButton, savingLanguage && styles.languageConfirmButtonDisabled]} 
                onPress={handleConfirmLanguage}
                disabled={savingLanguage}
              >
                {savingLanguage ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.languageConfirmText}>{t('common.confirm')}</Text>
                )}
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
    backgroundColor: '#f5f5f5',
  },
  floatingLanguageButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 149, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    borderWidth: 3,
    borderColor: '#000000',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingScreenText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  // Estilos para usuario autenticado
  header: {
    backgroundColor: '#fff',
    paddingTop: 60, // Para el status bar
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Espacio para el BottomTabBar
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  userInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  userInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  userInfoLabel: {
    fontWeight: '600',
    color: '#FF9500',
  },
  dashboardContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  // Nuevos estilos para el panel del dashboard
  dashboardPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  financialSummary: {
    marginTop: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  totalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 2,
    borderTopColor: '#FF9500',
    paddingTop: 12,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  totalLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Estilos existentes para pantalla de bienvenida
  imageContainer: {
    height: '60%',
    width: '100%',
    backgroundColor: '#FF9500',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeImage: {
    width: '80%',
    height: '80%',
  },
  // Panel inferior con esquinas redondeadas (40%)
  contentPanel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 50,
    justifyContent: 'space-between',
  },
  // Contenedor de textos
  textContainer: {
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  // Contenedor de botones
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  signupButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Nuevos estilos para el header del dashboard
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  // Estilos para la sección mensual
  monthlySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  monthlySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  monthlyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  monthlyItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
  },
  monthlyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilos para la sección de gráficos
  chartsSection: {
    marginVertical: 16,
  },
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    gap: 16,
  },
  // Estilos para la alerta de error del servidor
  serverErrorAlert: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  serverErrorTextContainer: {
    flex: 1,
  },
  serverErrorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  serverErrorMessage: {
    fontSize: 14,
    color: '#FFF',
  },
  // Estilos del modal de idioma
  languageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModalContent: {
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
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  languageList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageItemSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9500',
    borderWidth: 2,
  },
  languageItemContent: {
    flex: 1,
  },
  languageItemISO: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  languageItemDescription: {
    fontSize: 13,
    color: '#666',
  },
  languageModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  languageCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  languageCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  languageConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FF9500',
    alignItems: 'center',
  },
  languageConfirmButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  languageConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Estilos para skeleton loaders
  skeletonBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 12,
    width: '60%',
  },
  skeletonBalance: {
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    width: '50%',
  },
  skeletonChart: {
    height: 200,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
  },
});
