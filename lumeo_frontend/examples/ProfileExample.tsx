import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/**
 * EXAMPLE: Profile Screen Component
 * 
 * This example demonstrates:
 * 1. How to use the useAuth hook
 * 2. How to access user data
 * 3. How to query the public.usuario table
 * 4. How to implement logout
 */

// Import the correct type from your database types
import { Usuario } from '../types/database';

export default function ProfileExample() {
  const { user, signOut } = useAuth();
  const [userData, setUserData] = React.useState<Usuario | null>(null);
  const [loading, setLoading] = React.useState(true);

  // Fetch user data from public.usuario table
  React.useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  /**
   * Fetch additional user data from public.usuario table
   * NOTE: Your database uses 'uid' field to link to auth.users.id (not 'id')
   * This data includes nombre_usuario, nombre, apellido, idioma, etc.
   */
  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('uid', user?.id)  // IMPORTANT: Use 'uid' not 'id'!
        .single();

      if (error) throw error;

      setUserData(data);
    } catch (error: any) {
      console.error('Error fetching user data:', error.message);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update user profile
   * Example of how to update data in public.usuario
   * NOTE: Use 'uid' to match the user, and update fecha_modificacion
   */
  const updateProfile = async (updates: Partial<Usuario>) => {
    try {
      const { error } = await supabase
        .from('usuario')
        .update({
          ...updates,
          fecha_modificacion: new Date().toISOString(), // Update modification date
        })
        .eq('uid', user?.id);  // IMPORTANT: Use 'uid' not 'id'!

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
      fetchUserData(); // Refresh the data
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Navigation will be handled automatically by AuthContext
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <View style={styles.container}>
        <Text>Please log in to view your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* User information from auth.users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Info</Text>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.value}>{user.id}</Text>
        
        <Text style={styles.label}>Email (from auth):</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>

      {/* User information from public.usuario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Info (Your Database)</Text>
        
        <Text style={styles.label}>Database ID:</Text>
        <Text style={styles.value}>{userData.id}</Text>
        
        <Text style={styles.label}>Username:</Text>
        <Text style={styles.value}>{userData.nombre_usuario}</Text>
        
        <Text style={styles.label}>Full Name:</Text>
        <Text style={styles.value}>
          {userData.nombre} {userData.apellido}
        </Text>
        
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData.email}</Text>
        
        <Text style={styles.label}>Language:</Text>
        <Text style={styles.value}>{userData.idioma || 'Not set'}</Text>
        
        <Text style={styles.label}>Member Since:</Text>
        <Text style={styles.value}>
          {new Date(userData.fecha_creacion).toLocaleDateString()}
        </Text>
        
        <Text style={styles.label}>Last Modified:</Text>
        <Text style={styles.value}>
          {userData.fecha_modificacion 
            ? new Date(userData.fecha_modificacion).toLocaleDateString()
            : 'Never'}
        </Text>
      </View>

      {/* Example: Update profile button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => updateProfile({ nombre: 'Updated' })}
      >
        <Text style={styles.buttonText}>Update First Name (Example)</Text>
      </TouchableOpacity>

      {/* Logout button */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#FF9500',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * OTHER COMMON PATTERNS FOR YOUR DATABASE:
 * 
 * 1. Check if user is authenticated:
 * ```
 * const { user } = useAuth();
 * if (!user) return <LoginScreen />;
 * ```
 * 
 * 2. Get current session:
 * ```
 * const { session } = useAuth();
 * const token = session?.access_token;
 * ```
 * 
 * 3. Query user by uid (links to auth.users.id):
 * ```
 * const { data } = await supabase
 *   .from('usuario')
 *   .select('*')
 *   .eq('uid', user?.id)  // Use uid!
 *   .single();
 * ```
 * 
 * 4. Query with relationships (user with currency):
 * ```
 * const { data } = await supabase
 *   .from('usuario')
 *   .select(`
 *     *,
 *     divisa:id_divisa (
 *       id,
 *       descripcion,
 *       iso
 *     )
 *   `)
 *   .eq('uid', user?.id)
 *   .single();
 * 
 * console.log(data?.divisa?.iso); // USD, EUR, etc.
 * ```
 * 
 * 5. Get user's transactions:
 * ```
 * // First get the usuario record
 * const { data: usuario } = await supabase
 *   .from('usuario')
 *   .select('id')
 *   .eq('uid', user?.id)
 *   .single();
 * 
 * // Then query transactions using the bigint id
 * const { data: transactions } = await supabase
 *   .from('transaccion')
 *   .select('*')
 *   .eq('id_usuario', usuario?.id);
 * ```
 * 
 * 6. Realtime subscriptions:
 * ```
 * const channel = supabase
 *   .channel('usuario-changes')
 *   .on('postgres_changes', 
 *     { event: 'UPDATE', schema: 'public', table: 'usuario' },
 *     (payload) => console.log('User updated:', payload)
 *   )
 *   .subscribe();
 * ```
 */
