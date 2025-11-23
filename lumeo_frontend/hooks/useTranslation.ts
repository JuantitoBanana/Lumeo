import { useI18n } from '@/contexts/I18nContext';

/**
 * Hook simplificado para usar traducciones en componentes
 * 
 * @example
 * const { t, tDB, language, changeLanguage } = useTranslation();
 * 
 * // Traducir texto estático
 * t('profile.title') // "Perfil" o "Profile"
 * 
 * // Traducir texto estático con parámetros
 * t('profile.memberSince', { date: '2024' }) // "Miembro desde 2024"
 * 
 * // Traducir datos de BBDD
 * tDB('Alimentación') // "Food" en inglés, "Alimentación" en español
 */
export function useTranslation() {
  const { language, setLanguage, t, tDB, availableLanguages } = useI18n();

  return {
    /** Idioma actual ('es' | 'en') */
    language,
    
    /** Cambiar idioma */
    changeLanguage: setLanguage,
    
    /** Traducir texto estático */
    t,
    
    /** Traducir datos de BBDD */
    tDB,
    
    /** Idiomas disponibles */
    availableLanguages,
  };
}
