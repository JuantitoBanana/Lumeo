import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route Hook
 * 
 * This hook protects routes from unauthorized access.
 * It automatically redirects users based on their authentication state:
 * - If not logged in and trying to access protected routes → redirect to login
 * - If logged in and on auth screens → redirect to app
 * 
 * Usage:
 * Add this to your root _layout.tsx:
 * 
 * export default function RootLayout() {
 *   useProtectedRoute(); // Add this line
 *   
 *   return (
 *     <AuthProvider>
 *       ...
 *     </AuthProvider>
 *   );
 * }
 */
export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!user && !inAuthGroup) {
      // User is not signed in and is trying to access a protected route
      // Redirect to login
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // User is signed in but still on an auth screen
      // Redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, segments, loading]);
}

/**
 * Example usage in a component:
 * 
 * function ProfileScreen() {
 *   const { user } = useAuth();
 *   
 *   if (!user) {
 *     return <Text>Please login</Text>;
 *   }
 *   
 *   return (
 *     <View>
 *       <Text>Welcome {user.email}!</Text>
 *     </View>
 *   );
 * }
 */
