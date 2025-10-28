/**
 * Type definitions for the application
 * Matches your EXISTING Supabase database schema
 */

// User data from public.usuario table (YOUR ACTUAL DATABASE STRUCTURE)
export interface Usuario {
  id: number;                       // bigint - auto-increment primary key
  uid: string | null;               // uuid - links to auth.users.id
  email: string;
  nombre: string | null;            // First name (Spanish: nombre)
  apellido: string | null;          // Last name (Spanish: apellido)
  nombre_usuario: string | null;    // Username (Spanish: nombre_usuario)
  idioma: string | null;            // Language preference (Spanish: idioma)
  id_divisa: number | null;         // Foreign key to divisa table
  fecha_creacion: string;           // Creation timestamp
  fecha_modificacion: string | null; // Last modification timestamp
}

// Currency table
export interface Divisa {
  id: number;
  descripcion: string | null;      // Currency description
  iso: string | null;               // ISO code (USD, EUR, etc.)
}

// Transaction table
export interface Transaccion {
  id: number;
  titulo: string;                   // Transaction title
  importe: number | null;           // Amount
  fecha_transaccion: string | null; // Transaction date
  nota: string | null;              // Notes
  id_usuario: number | null;        // Foreign key to usuario
  id_categoria: number | null;      // Foreign key to categoria
  id_grupo: number | null;          // Foreign key to grupo
  id_tipo: number | null;           // Foreign key to tipo_transaccion
  id_estado: number | null;         // Foreign key to estado_transaccion
  id_adjunto: number | null;        // Foreign key to adjunto
}

// Category table
export interface Categoria {
  id: number;
  nombre: string;                   // Category name
  es_personalizada: boolean | null; // Is custom category
  id_usuario: number | null;        // Foreign key to usuario (null for default categories)
}

// Budget table
export interface Presupuesto {
  id: number;
  limite_presupuesto: number;       // Budget limit
  fecha_limite: string | null;      // Due date
  id_usuario: number | null;        // Foreign key to usuario
}

// Savings goal table
export interface MetaAhorro {
  id: number;
  titulo: string;                   // Goal title
  cantidad_objetivo: number | null; // Target amount
  cantidad_actual: number | null;   // Current amount
  id_usuario: number | null;        // Foreign key to usuario
}

// User metadata passed during signup (keep in English for React components)
export interface UserMetadata {
  firstName: string;
  lastName: string;
  username: string;
}

// Supabase Database types
export interface Database {
  public: {
    Tables: {
      usuario: {
        Row: Usuario;
        Insert: Omit<Usuario, 'id' | 'fecha_creacion'>;
        Update: Partial<Omit<Usuario, 'id'>>;
      };
      divisa: {
        Row: Divisa;
        Insert: Omit<Divisa, 'id'>;
        Update: Partial<Omit<Divisa, 'id'>>;
      };
      transaccion: {
        Row: Transaccion;
        Insert: Omit<Transaccion, 'id'>;
        Update: Partial<Omit<Transaccion, 'id'>>;
      };
      categoria: {
        Row: Categoria;
        Insert: Omit<Categoria, 'id'>;
        Update: Partial<Omit<Categoria, 'id'>>;
      };
      presupuesto: {
        Row: Presupuesto;
        Insert: Omit<Presupuesto, 'id'>;
        Update: Partial<Omit<Presupuesto, 'id'>>;
      };
      meta_ahorro: {
        Row: MetaAhorro;
        Insert: Omit<MetaAhorro, 'id'>;
        Update: Partial<Omit<MetaAhorro, 'id'>>;
      };
    };
  };
}
