import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useUsuarioApi } from '@/hooks/useUsuarioApi';
import { grupoService, VerificarUsuarioResponse } from '@/services/grupo.service';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { usuario } = useUsuarioApi();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nombreUsuarioInput, setNombreUsuarioInput] = useState('');
  const [usuariosAgregados, setUsuariosAgregados] = useState<VerificarUsuarioResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const handleVerificarUsuario = async () => {
    if (!nombreUsuarioInput.trim()) {
      Alert.alert('Error', 'Debes introducir un nombre de usuario');
      return;
    }

    // Verificar que no sea el propio usuario
    if (usuario?.nombreUsuario && nombreUsuarioInput.trim() === usuario.nombreUsuario) {
      Alert.alert('Error', 'No puedes agregarte a ti mismo. Ya eres parte del grupo automáticamente.');
      return;
    }

    // Verificar que no esté ya agregado
    const yaAgregado = usuariosAgregados.some(
      u => u.nombreUsuario.toLowerCase() === nombreUsuarioInput.trim().toLowerCase()
    );

    if (yaAgregado) {
      Alert.alert('Error', 'Este usuario ya ha sido agregado al grupo');
      return;
    }

    setVerificando(true);
    try {
      const resultado = await grupoService.verificarUsuario(nombreUsuarioInput.trim());
      
      if (resultado.existe) {
        setUsuariosAgregados([...usuariosAgregados, resultado]);
        setNombreUsuarioInput('');
        Alert.alert('Éxito', `Usuario ${resultado.nombreUsuario} agregado correctamente`);
      } else {
        Alert.alert('Error', `El usuario "${nombreUsuarioInput}" no existe`);
      }
    } catch (error: any) {
      console.error('Error al verificar usuario:', error);
      Alert.alert('Error', 'No se pudo verificar el usuario. Intenta nuevamente.');
    } finally {
      setVerificando(false);
    }
  };

  const handleEliminarUsuario = (nombreUsuario: string) => {
    setUsuariosAgregados(usuariosAgregados.filter(u => u.nombreUsuario !== nombreUsuario));
  };

  const validateForm = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'El nombre del grupo es obligatorio');
      return false;
    }
    return true;
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) {
      return;
    }

    if (!usuario?.id) {
      Alert.alert('Error', 'No se pudo identificar al usuario');
      return;
    }

    setLoading(true);

    try {
      const grupoData = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        nombresUsuarios: usuariosAgregados.map(u => u.nombreUsuario),
      };

      await grupoService.crearGrupoConUsuarios(grupoData, usuario.id);

      Alert.alert('Éxito', 'Grupo creado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error al crear grupo:', error);
      const errorMessage = error?.message || 'No se pudo crear el grupo';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.placeholder} />
        <Text style={styles.headerTitle}>Crear grupo</Text>
      </View>

      <ScrollView 
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Campo Nombre */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre del grupo</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="people-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder="Ej: Familia, Amigos, Viaje..."
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={setNombre}
            />
          </View>
        </View>

        {/* Campo Descripción */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="document-text-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.inputWithIconText}
              placeholder="Descripción del grupo"
              placeholderTextColor="#999"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />
          </View>
        </View>

        {/* Campo Agregar Usuarios */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Agregar personas</Text>
          <View style={styles.addUserContainer}>
            <View style={[styles.inputWithIcon, styles.inputWithIconInRow]}>
              <Ionicons name="person-add-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIconText}
                placeholder="Nombre de usuario"
                placeholderTextColor="#999"
                value={nombreUsuarioInput}
                onChangeText={setNombreUsuarioInput}
                autoCapitalize="none"
                editable={!verificando}
              />
            </View>
            <TouchableOpacity
              style={[styles.addButton, verificando && styles.addButtonDisabled]}
              onPress={handleVerificarUsuario}
              disabled={verificando}
            >
              {verificando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>Añadir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Serás agregado automáticamente al grupo
          </Text>
        </View>

        {/* Lista de Usuarios Agregados */}
        {usuariosAgregados.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Personas en el grupo ({usuariosAgregados.length})</Text>
            <View style={styles.usersList}>
              {usuariosAgregados.map((usuario) => (
                <View key={usuario.nombreUsuario} style={styles.userCard}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#007AFF" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {usuario.nombre && usuario.apellido 
                        ? `${usuario.nombre} ${usuario.apellido}`
                        : usuario.nombreUsuario}
                    </Text>
                    <Text style={styles.userUsername}>@{usuario.nombreUsuario}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleEliminarUsuario(usuario.nombreUsuario)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Botón Crear Grupo */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading}
        >
          {loading ? (
            <Text style={styles.createButtonText}>Creando...</Text>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Crear Grupo</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    padding: 0,
  },
  addUserContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWithIconInRow: {
    flex: 1,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minWidth: 100,
  },
  addButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    marginLeft: 4,
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0.1,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 40,
  },
});
