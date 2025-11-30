import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Categoria } from '../types/api';
import { CategoriaService } from '../services/categoria.service';

interface CategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCategory: (category: Categoria) => void;
  selectedCategoryId?: number;
  userId: number;
}

export default function CategorySelectorModal({
  visible,
  onClose,
  onSelectCategory,
  selectedCategoryId,
  userId,
}: CategorySelectorModalProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creating, setCreating] = useState(false);
  const categoriaService = new CategoriaService();

  useEffect(() => {
    if (visible) {
      loadCategorias();
    }
  }, [visible, userId]);

  const loadCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriaService.getCategoriasParaUsuario(userId);
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (categoria: Categoria) => {
    onSelectCategory(categoria);
    onClose();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Por favor, introduce un nombre para la categoría');
      return;
    }

    try {
      setCreating(true);
      const nuevaCategoria: Omit<Categoria, 'id'> = {
        nombre: newCategoryName.trim(),
        esPersonalizada: true,
        idUsuario: userId,
        color: '#FF9500',
        icono: 'pricetag-outline',
      };

      const categoriaCreada = await categoriaService.create(nuevaCategoria);
      
      // Cerrar el modal de creación primero
      setShowCreateModal(false);
      setNewCategoryName('');
      
      // Recargar la lista de categorías
      await loadCategorias();
      
      // Seleccionar automáticamente la categoría recién creada y cerrar el modal principal
      if (categoriaCreada) {
        onSelectCategory(categoriaCreada);
        onClose();
      }
    } catch (error) {
      console.error('Error al crear categoría:', error);
      Alert.alert('Error', 'No se pudo crear la categoría. Inténtalo de nuevo.');
      setCreating(false);
    }
  };

  const getIconForCategory = (nombre: string): string => {
    const iconMap: { [key: string]: string } = {
      'Hogar': 'home',
      'Ocio': 'game-controller',
      'Transporte': 'car',
      'Comida': 'restaurant',
      'Salud': 'medkit',
      'Educación': 'school',
      'Compras': 'cart',
      'Viajes': 'airplane',
      'Servicios': 'settings',
      'Otros': 'ellipsis-horizontal',
    };
    return iconMap[nombre] || 'pricetag';
  };

  const renderCategoryItem = ({ item }: { item: Categoria }) => {
    const isSelected = item.id === selectedCategoryId;
    const iconName = ((item.icono || getIconForCategory(item.nombre)).replace(/-outline$/, '') + '-outline') as any;

    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => handleSelectCategory(item)}
      >
        <View style={styles.categoryLeft}>
          <View style={[styles.iconContainer, { backgroundColor: item.color || '#FF9500' }]}>
            <Ionicons name={iconName as any} size={24} color="#fff" />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{item.nombre}</Text>
            {item.esPersonalizada && (
              <Text style={styles.personalizedLabel}>Personalizada</Text>
            )}
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#FF9500" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Seleccionar Categoría</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF9500" />
              <Text style={styles.loadingText}>Cargando categorías...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={categorias}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No hay categorías disponibles</Text>
                  </View>
                }
              />
              
              {/* Botón para crear nueva categoría */}
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.createButtonText}>Crear Nueva Categoría</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>

      {/* Modal para crear nueva categoría */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable style={styles.createOverlay} onPress={() => setShowCreateModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.createModalContainer}>
                <Text style={styles.createModalTitle}>Nueva Categoría</Text>
                
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre de la categoría"
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                    maxLength={50}
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={styles.createModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowCreateModal(false);
                      setNewCategoryName('');
                    }}
                    disabled={creating}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleCreateCategory}
                    disabled={creating || !newCategoryName.trim()}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Crear</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContent: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryItemSelected: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF5E6',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  personalizedLabel: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  createModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 10,
    minHeight: 220,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    minHeight: 80,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  createModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF9500',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
});
