import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import es from '@/locales/es.json';
import en from '@/locales/en.json';

// Tipos
export type Language = 'es' | 'en';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string>) => string;
  tDB: (key: string, defaultValue?: string) => string;
  availableLanguages: LanguageOption[];
}

// Idiomas disponibles
export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
];

// Traducciones
const translations: Record<Language, any> = {
  es,
  en,
};

// Mapeo de traducciones para datos de BBDD (categorías, etc.)
const DB_TRANSLATIONS: Record<string, Record<Language, string>> = {
  // Categorías
  'Alimentación': { es: 'Alimentación', en: 'Food' },
  'Transporte': { es: 'Transporte', en: 'Transport' },
  'Entretenimiento': { es: 'Entretenimiento', en: 'Entertainment' },
  'Salud': { es: 'Salud', en: 'Health' },
  'Educación': { es: 'Educación', en: 'Education' },
  'Compras': { es: 'Compras', en: 'Shopping' },
  'Facturas': { es: 'Facturas', en: 'Bills' },
  'Otros': { es: 'Otros', en: 'Other' },
  'Salario': { es: 'Salario', en: 'Salary' },
  'Inversión': { es: 'Inversión', en: 'Investment' },
  'Regalo': { es: 'Regalo', en: 'Gift' },
  
  // Tipos de transacción
  'Ingreso': { es: 'Ingreso', en: 'Income' },
  'Gasto': { es: 'Gasto', en: 'Expense' },
  
  // Días de la semana
  'Lunes': { es: 'Lunes', en: 'Monday' },
  'Martes': { es: 'Martes', en: 'Tuesday' },
  'Miércoles': { es: 'Miércoles', en: 'Wednesday' },
  'Jueves': { es: 'Jueves', en: 'Thursday' },
  'Viernes': { es: 'Viernes', en: 'Friday' },
  'Sábado': { es: 'Sábado', en: 'Saturday' },
  'Domingo': { es: 'Domingo', en: 'Sunday' },
  
  // Meses
  'Enero': { es: 'Enero', en: 'January' },
  'Febrero': { es: 'Febrero', en: 'February' },
  'Marzo': { es: 'Marzo', en: 'March' },
  'Abril': { es: 'Abril', en: 'April' },
  'Mayo': { es: 'Mayo', en: 'May' },
  'Junio': { es: 'Junio', en: 'June' },
  'Julio': { es: 'Julio', en: 'July' },
  'Agosto': { es: 'Agosto', en: 'August' },
  'Septiembre': { es: 'Septiembre', en: 'September' },
  'Octubre': { es: 'Octubre', en: 'October' },
  'Noviembre': { es: 'Noviembre', en: 'November' },
  'Diciembre': { es: 'Diciembre', en: 'December' },
};

const STORAGE_KEY = '@lumeo_language';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar idioma guardado al iniciar
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading saved language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  /**
   * Función de traducción para textos estáticos
   * @param key - Clave de traducción en formato "section.subsection.key"
   * @param params - Parámetros opcionales para interpolación {{param}}
   */
  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    // Navegar por el objeto de traducciones
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for language: ${language}`);
        return key; // Devolver la clave si no se encuentra
      }
    }

    // Si el valor no es una cadena, devolver la clave
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }

    // Interpolar parámetros si existen
    if (params) {
      return Object.entries(params).reduce((text, [param, replacement]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
      }, value);
    }

    return value;
  };

  /**
   * Función de traducción para datos de BBDD
   * Traduce valores que vienen de la base de datos (categorías, tipos, etc.)
   * @param key - Valor en español de la BBDD
   * @param defaultValue - Valor por defecto si no se encuentra traducción
   */
  const tDB = (key: string, defaultValue?: string): string => {
    // Si la clave existe en el mapeo de traducciones de BBDD
    if (DB_TRANSLATIONS[key] && DB_TRANSLATIONS[key][language]) {
      return DB_TRANSLATIONS[key][language];
    }

    // Si no existe, devolver el valor por defecto o la clave original
    return defaultValue || key;
  };

  if (isLoading) {
    return null; // O un componente de carga
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        tDB,
        availableLanguages: AVAILABLE_LANGUAGES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
