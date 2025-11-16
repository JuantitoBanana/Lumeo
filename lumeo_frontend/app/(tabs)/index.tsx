import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { useResumenFinanciero } from '@/hooks/useResumenFinanciero';
import { useGastosPorCategoria } from '../../hooks/useGastosPorCategoria';
import { useEvolucionMensual } from '../../hooks/useEvolucionMensual';
import GraficoCategoria from '@/components/GraficoCategoria';
import GraficoEvolucion from '@/components/GraficoEvolucion';
import UltimosGastos from '@/components/UltimosGastos';
import { apiClient } from '@/lib/api-client';
import { eventEmitter, APP_EVENTS } from '@/lib/event-emitter';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { usuario, loading: loadingUsuario, error: errorUsuario, refetchUsuario } = useUsuarioApi();
  const { resumen, loading: loadingResumen, error: errorResumen, refetch: refetchResumen } = useResumenFinanciero(usuario?.id || null);
  const { gastos, loading: loadingGastos, error: errorGastos, refetch: refetchGastos } = useGastosPorCategoria(usuario?.id || null);
  const { evolucion, loading: loadingEvolucion, error: errorEvolucion, refetch: refetchEvolucion } = useEvolucionMensual(usuario?.id || null, 2);
  const scrollViewRef = useRef<ScrollView>(null);

  // Función para refrescar todo el contenido
  const handleRefresh = () => {
    // Hacer scroll al inicio
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // Refrescar todos los datos
    refetchUsuario();
    refetchResumen();
    refetchGastos();
    refetchEvolucion();
  };

  // Escuchar cambios de divisa
  useEffect(() => {
    const unsubscribe = eventEmitter.on(APP_EVENTS.CURRENCY_CHANGED, () => {
      console.log('💱 Dashboard: Detectado cambio de divisa, recargando datos...');
      // Pequeño delay para asegurar que el backend terminó la conversión
      setTimeout(() => {
        console.log('🔄 Refrescando datos del dashboard...');
        // Recargar todos los datos del dashboard
        refetchUsuario();
        refetchResumen();
        refetchGastos();
        refetchEvolucion();
      }, 500); // 500ms de delay
    });

    return () => {
      unsubscribe();
    };
  }, [refetchUsuario, refetchResumen, refetchGastos, refetchEvolucion]);

  // Escuchar eliminación de transacciones
  useEffect(() => {
    const unsubscribe = eventEmitter.on(APP_EVENTS.TRANSACTION_DELETED, () => {
      console.log('🗑️ Dashboard: Detectada eliminación de transacción, recargando datos...');
      // Pequeño delay para asegurar que el backend procesó la eliminación
      setTimeout(() => {
        console.log('🔄 Refrescando datos del dashboard...');
        // Recargar todos los datos del dashboard
        refetchUsuario();
        refetchResumen();
        refetchGastos();
        refetchEvolucion();
      }, 300); // 300ms de delay
    });

    return () => {
      unsubscribe();
    };
  }, [refetchUsuario, refetchResumen, refetchGastos, refetchEvolucion]);

  // Cleanup: Cancelar todas las peticiones pendientes cuando se desmonta el componente
  useEffect(() => {
    return () => {
      console.log('🧹 Dashboard desmontado - cancelando peticiones pendientes');
      apiClient.cancelAllRequests();
    };
  }, []);

  // Función para formatear cantidades monetarias
  const formatearCantidad = (cantidad: number, simbolo: string, posicion: string = 'DESPUES') => {
    const cantidadFormateada = cantidad.toFixed(2);
    // Respetar la posición del símbolo según la divisa
    if (posicion === 'ANTES') {
      return `${simbolo}${cantidadFormateada}`;
    } else {
      return `${cantidadFormateada}${simbolo}`;
    }
  };

  // Debug logs
  console.log('🔍 Estado actual:', {
    user: !!user,
    usuario: usuario,
    usuarioId: usuario?.id,
    resumen: resumen,
    loadingResumen,
    errorResumen,
    'resumen existe': !!resumen,
    'resumen.saldoTotal': resumen?.saldoTotal
  });

  console.log('🎯 Renderizando dashboard - resumen:', resumen);

  // Debug: ver estado de carga
  console.log('🔍 Estados de carga:', {
    loadingUsuario,
    loadingResumen,
    loadingGastos,
    loadingEvolucion,
    tieneUsuario: !!usuario,
    tieneResumen: !!resumen,
  });

  // Determinar si aún estamos cargando datos esenciales
  const isLoadingEssentialData = 
    loadingUsuario || // Cargando usuario
    (usuario && loadingResumen) || // Tenemos usuario pero cargando resumen
    (!usuario && !loadingUsuario); // No hay usuario y no está cargando (esperando)

  // Pantalla de carga inicial mientras se cargan todos los datos necesarios
  if (user && isLoadingEssentialData) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingScreenText}>Cargando tu información...</Text>
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
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.greetingText}>Cargando...</Text>
              </View>
            ) : errorUsuario ? (
              <Text style={styles.greetingText}>¡Hola, Usuario!</Text>
            ) : (
              <Text style={styles.greetingText}>
                ¡Hola, {usuario?.nombre || 'Usuario'}!
              </Text>
            )}
          </View>
          
          {/* Iconos de la derecha */}
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push('/groups')}
            >
              <Ionicons name="people" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alerta de error del servidor */}
        {errorUsuario && errorUsuario.includes('Error del servidor') && (
          <View style={styles.serverErrorAlert}>
            <Ionicons name="warning" size={24} color="#FFF" />
            <View style={styles.serverErrorTextContainer}>
              <Text style={styles.serverErrorTitle}>Error del Servidor</Text>
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
              <Text style={styles.dashboardTitle}>Dashboard</Text>
              {resumen ? (
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Balance Total</Text>
                  <Text style={[
                    styles.dashboardBalance,
                    { color: resumen.saldoTotal >= 0 ? '#4CAF50' : '#F44336' }
                  ]}>
                    {formatearCantidad(resumen.saldoTotal, resumen.simboloDivisa, resumen.posicionSimbolo)}
                  </Text>
                </View>
              ) : (
                <View style={styles.balanceContainer}>
                  <Text style={styles.balanceLabel}>Balance Total</Text>
                  <Text style={styles.dashboardBalance}>
                    --
                  </Text>
                </View>
              )}
            </View>
            
            {loadingResumen ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Cargando resumen...</Text>
              </View>
            ) : errorResumen ? (
              <Text style={styles.errorText}>Error al cargar el resumen financiero</Text>
            ) : null}
            
            {/* Sección de Gráficos */}
            <View style={styles.chartsSection}>
              <View style={styles.chartsRow}>
                <GraficoCategoria 
                  gastos={gastos} 
                  loading={loadingGastos} 
                />
                <GraficoEvolucion 
                  evolucion={evolucion} 
                  loading={loadingEvolucion} 
                />
              </View>
            </View>
            
            {/* Resumen del mes actual */}
            {resumen ? (
              <View style={styles.monthlySection}>
                <Text style={styles.monthlySectionTitle}>Resumen del mes actual</Text>
                <View style={styles.monthlyGrid}>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>Ingresos</Text>
                    <Text style={[styles.monthlyValue, { color: '#4CAF50' }]}>
                      {formatearCantidad(resumen.ingresosMensuales, resumen.simboloDivisa, resumen.posicionSimbolo)}
                    </Text>
                  </View>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>Gastos</Text>
                    <Text style={[styles.monthlyValue, { color: '#F44336' }]}>
                      {formatearCantidad(resumen.gastosMensuales, resumen.simboloDivisa, resumen.posicionSimbolo)}
                    </Text>
                  </View>
                  <View style={styles.monthlyItem}>
                    <Text style={styles.monthlyLabel}>Ahorro</Text>
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

          {/* Panel de Últimos Gastos */}
          <UltimosGastos usuarioId={usuario?.id} />
        </ScrollView>

        <BottomTabBar activeTab="home" onTabRefresh={handleRefresh} />
      </View>
    );
  }

  // Pantalla de bienvenida para usuarios no autenticados
  return (
    <View style={styles.container}>
      {/* Imagen superior - 60% de la pantalla */}
      <View style={styles.imageContainer}>
        <Image
          source={require('@/assets/images/logo_final.png')}
          style={styles.welcomeImage}
          contentFit="contain"
        />
      </View>

      {/* Panel inferior con esquinas redondeadas - 40% */}
      <View style={styles.contentPanel}>
        {/* Textos de bienvenida */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeTitle}>Bienvenido</Text>
          <Text style={styles.welcomeSubtitle}>
            Listo para usar la herramienta de finanzas más sencilla y eficaz.
          </Text>
        </View>

        {/* Botones en la parte inferior */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.loginButton]}
            onPress={() => router.push('/login')}
          >
            <Text style={[styles.buttonText, { color: '#007AFF' }]}>Iniciar Sesión</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.signupButton]}
            onPress={() => router.push('/signup')}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f0f8ff',
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
    color: '#007AFF',
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
    borderTopColor: '#007AFF',
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
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
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
    borderColor: '#007AFF',
  },
  signupButton: {
    backgroundColor: '#007AFF',
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
});
