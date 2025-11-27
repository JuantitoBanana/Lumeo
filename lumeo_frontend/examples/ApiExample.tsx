import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { services } from '../services';
import { Usuario, Transaccion, Categoria } from '../types/api';

/**
 * Ejemplo de cómo usar los servicios de la API en React Native
 * Este componente muestra cómo realizar operaciones CRUD básicas
 */
export default function ApiExampleScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar datos en paralelo
      const [usuariosData, categoriasData] = await Promise.all([
        services.usuario.getAll(),
        services.categoria.getAll(),
      ]);

      setUsuarios(usuariosData);
      setCategorias(categoriasData);

      // Si hay usuarios, cargar transacciones del primero
      if (usuariosData.length > 0) {
        const transaccionesData = await services.transaccion.getByUsuario(usuariosData[0].id!);
        setTransacciones(transaccionesData);
      }
    } catch (error: any) {
      Alert.alert('Error', `Error al cargar datos: ${error.message}`);
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      Alert.alert('Error', 'Por favor ingresa nombre y email');
      return;
    }

    setLoading(true);
    try {
      const newUser = await services.usuario.create({
        nombre: newUserName.trim(),
        apellido: '',
        email: newUserEmail.trim(),
        nombreUsuario: newUserEmail.trim(),
      });

      setUsuarios([...usuarios, newUser]);
      setNewUserName('');
      setNewUserEmail('');
      Alert.alert('Éxito', 'Usuario creado correctamente');
    } catch (error: any) {
      Alert.alert('Error', `Error al crear usuario: ${error.message}`);
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (usuarioId: number) => {
    setLoading(true);
    try {
      const newTransaction = await services.transaccion.create({
        titulo: 'Transacción de prueba',
        importe: 100.0,
        fechaTransaccion: new Date().toISOString().split('T')[0],
        nota: 'Transacción creada desde la app',
        idUsuario: usuarioId,
      });

      const updatedTransactions = await services.transaccion.getByUsuario(usuarioId);
      setTransacciones(updatedTransactions);
      Alert.alert('Éxito', 'Transacción creada correctamente');
    } catch (error: any) {
      Alert.alert('Error', `Error al crear transacción: ${error.message}`);
      console.error('Error creating transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    Alert.alert(
      'Confirmar',
      '¿Estás seguro de que quieres eliminar este usuario?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await services.usuario.delete(userId);
              setUsuarios(usuarios.filter(u => u.id !== userId));
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
            } catch (error: any) {
              Alert.alert('Error', `Error al eliminar usuario: ${error.message}`);
              console.error('Error deleting user:', error);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ejemplo de API Lumeo</Text>
      
      {/* Sección de crear usuario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Crear Usuario</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={newUserName}
          onChangeText={setNewUserName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={newUserEmail}
          onChangeText={setNewUserEmail}
          keyboardType="email-address"
        />
        <TouchableOpacity style={styles.button} onPress={createUser}>
          <Text style={styles.buttonText}>Crear Usuario</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de usuarios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Usuarios ({usuarios.length})</Text>
        {usuarios.map((usuario) => (
          <View key={usuario.id} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{usuario.nombre}</Text>
              <Text style={styles.itemSubtitle}>{usuario.email}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.createButton]}
                onPress={() => createTransaction(usuario.id!)}
              >
                <Text style={styles.actionButtonText}>+ Trans</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteUser(usuario.id!)}
              >
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Lista de transacciones */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transacciones ({transacciones.length})</Text>
        {transacciones.map((transaccion) => (
          <View key={transaccion.id} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{transaccion.titulo}</Text>
              <Text style={styles.itemSubtitle}>
                ${transaccion.importe} - {transaccion.fechaTransaccion}
              </Text>
              {transaccion.nota && (
                <Text style={styles.itemNote}>{transaccion.nota}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Lista de categorías */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categorías ({categorias.length})</Text>
        {categorias.map((categoria) => (
          <View key={categoria.id} style={styles.item}>
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle}>{categoria.nombre}</Text>
              {categoria.descripcion && (
                <Text style={styles.itemSubtitle}>{categoria.descripcion}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadInitialData}>
        <Text style={styles.buttonText}>Actualizar Datos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  createButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});