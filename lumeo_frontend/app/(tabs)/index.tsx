import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Si el usuario está autenticado, mostrar contenido diferente
  if (user) {
    return (
      <View style={styles.container}>
        <View style={styles.authenticatedContainer}>
          <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
          <Text style={styles.welcomeSubtitle}>Usuario: {user.email}</Text>
          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]}
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <Text style={[styles.buttonText, { color: '#fff' }]}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
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
  // Contenedor de la imagen superior (60%)
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
  // Estilos para usuario autenticado
  authenticatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 40,
  },
});
