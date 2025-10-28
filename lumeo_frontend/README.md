# Lumeo App 🚀

Una aplicación móvil híbrida construida con **React Native + Expo**, conectada a una **API Java** y base de datos **PostgreSQL** alojada en **Supabase**.

---

## 🌐 Documentación

- **🇪🇸 [Documentación en Español](DOCUMENTACION_ES.md)** ← Recomendado
- **🇺🇸 [English Documentation](#-project-overview)** ← Below

---

## 📱 Descripción del Proyecto

Esta aplicación cuenta con un sistema completo de autenticación con:
- ✅ Registro de usuarios con verificación de email
- ✅ Inicio de sesión con persistencia de sesión
- ✅ Sincronización automática de datos entre Supabase Auth y tablas de base de datos personalizadas
- ✅ Seguridad a nivel de fila (Row Level Security) para protección de datos
- ✅ Soporte completo de TypeScript
- ✅ Manejo integral de errores

## 🚀 Inicio Rápido

### 1. Instalar Dependencias
```bash
npm install
```

### 2. Configurar Supabase
Abre `lib/supabase.ts` y agrega tus credenciales:
```typescript
const supabaseUrl = 'TU_SUPABASE_URL';
const supabaseAnonKey = 'TU_SUPABASE_ANON_KEY';
```

Obtén estos valores de: **Panel de Supabase → Settings → API**

### 3. Configurar la Base de Datos
1. Ve al **Panel de Supabase → Editor SQL**
2. Copia el contenido de `supabase_setup.sql`
3. Ejecuta el script

### 4. Iniciar el Servidor de Desarrollo
```bash
npx expo start
```

Presiona:
- `i` para simulador iOS
- `a` para emulador Android
- `w` para navegador web

## 📚 Documentación

### Lectura Esencial
- 📖 **[QUICK_START.md](QUICK_START.md)** - Ponte en marcha en 5 minutos
- 📘 **[AUTH_SETUP_GUIDE.md](AUTH_SETUP_GUIDE.md)** - Guía completa de autenticación
- 📗 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Resumen de la arquitectura
- 📙 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Problemas comunes y soluciones
- 📝 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Fragmentos de código y comandos

## 🏗️ Project Structure

```
lumeo/
├── app/                    # Screens (file-based routing)
│   ├── _layout.tsx        # Root layout with AuthProvider
│   ├── login.tsx          # Login screen
│   ├── signup.tsx         # Sign up screen
│   └── (tabs)/            # Protected tab routes
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state management
├── lib/                   # Libraries and utilities
│   └── supabase.ts        # Supabase client configuration
├── types/                 # TypeScript type definitions
│   └── database.ts        # Database types
├── hooks/                 # Custom React hooks
│   └── useProtectedRoute.ts
├── examples/              # Code examples
│   └── ProfileExample.tsx
└── supabase_setup.sql     # Database setup script
```

## 🔐 Authentication Features

### Sign Up
Users register with:
- First Name
- Last Name
- Username
- Email
- Password (with confirmation)

### Automatic Data Sync
When a user signs up:
1. Supabase Auth creates a user in `auth.users`
2. Database trigger automatically fires
3. User data is copied to `public.usuario` table
4. Session is created and persisted

### Security
- ✅ Passwords are hashed with bcrypt
- ✅ Row Level Security (RLS) protects user data
- ✅ Sessions stored securely in AsyncStorage
- ✅ Auto-refresh tokens prevent expiration

## 💻 Usage Examples

### Check if user is logged in
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();
  
  if (loading) return <Text>Loading...</Text>;
  if (!user) return <Text>Please login</Text>;
  
  return <Text>Welcome {user.email}!</Text>;
}
```

### Query user profile
```typescript
import { supabase } from '@/lib/supabase';

const { data } = await supabase
  .from('usuario')
  .select('*')
  .eq('id', user?.id)
  .single();

console.log(data?.username);
```

### Logout
```typescript
const { signOut } = useAuth();
await signOut();
```

## 🗄️ Database Schema

### auth.users (Managed by Supabase)
- `id` - UUID (primary key)
- `email` - User email
- `encrypted_password` - Hashed password
- `raw_user_meta_data` - Additional user data (JSON)

### public.usuario (Your custom table)
- `id` - UUID (references auth.users.id)
- `username` - Unique username
- `first_name` - User's first name
- `last_name` - User's last name
- `email` - User's email
- `created_at` - Registration timestamp
- `updated_at` - Last update timestamp

## 🛠️ Technology Stack

- **Frontend:** React Native + Expo
- **Language:** TypeScript
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (Supabase)
- **Backend API:** Java (to be connected)
- **State Management:** React Context API
- **Storage:** AsyncStorage
- **Navigation:** Expo Router

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@react-native-async-storage/async-storage": "^1.x.x",
  "react-native-url-polyfill": "^2.x.x"
}
```

## 🧪 Testing

### Test Sign Up
1. Run the app
2. Navigate to Sign Up screen
3. Fill in all fields
4. Verify user appears in both `auth.users` and `public.usuario`

### Test Login
1. Use credentials from sign up
2. Verify successful login
3. Close and reopen app
4. Verify session persists

## 🔗 Connecting to Java API

Your Java API can:
1. Query `public.usuario` for user data
2. Use Row Level Security for data access
3. Validate JWT tokens from Supabase

Example JWT verification in Java:
```java
// Use Supabase JWT secret to verify tokens
// Token is sent in Authorization header: Bearer <token>
```

## 🐛 Troubleshooting

**Can't connect to Supabase?**
- Verify URL and API key in `lib/supabase.ts`
- Check Supabase project is active

**User not in public.usuario?**
- Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Check Supabase logs for errors

**Session not persisting?**
- Ensure AsyncStorage is properly installed
- Check `persistSession: true` in supabase config

See **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for more solutions.

## 📖 Learning Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🤝 Next Steps

1. [ ] Add email verification flow
2. [ ] Implement password reset
3. [ ] Add profile picture upload
4. [ ] Create user profile editing screen
5. [ ] Connect to Java API
6. [ ] Add social authentication (Google, Apple)
7. [ ] Implement push notifications

## 📝 License

This project is part of the Lumeo application.

## 🎉 Get Started Now!

Read **[QUICK_START.md](QUICK_START.md)** to begin developing in 5 minutes!

---

**Happy coding! 🚀**
