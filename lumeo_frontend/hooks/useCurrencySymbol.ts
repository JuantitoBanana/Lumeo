import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usuarioService } from '../services/usuario.service';
import { DivisaService } from '../services/divisa.service';
import { eventEmitter, APP_EVENTS } from '../lib/event-emitter';

/**
 * Hook personalizado para obtener el símbolo de divisa del usuario actual
 * Se actualiza automáticamente cuando cambia la divisa del usuario
 */
export const useCurrencySymbol = () => {
  const { user } = useAuth();
  const [currencySymbol, setCurrencySymbol] = useState<string>('€');
  const [currencyCode, setCurrencyCode] = useState<string>('EUR');
  const [symbolPosition, setSymbolPosition] = useState<string>('DESPUES');
  const [loading, setLoading] = useState<boolean>(true);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);

  const fetchCurrencySymbol = async () => {
    // Evitar llamadas duplicadas
    if (isFetchingRef.current) {
      console.log('⏭️ Ya hay una petición en curso, saltando...');
      return;
    }

    if (!user?.id) {
      setCurrencySymbol('€');
      setCurrencyCode('EUR');
      setLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Obtener datos del usuario desde el backend
      const usuario = await usuarioService.getByUid(user.id);
      
      // Verificar si el componente sigue montado
      if (!mountedRef.current) return;
      
      if (usuario && usuario.idDivisa) {
        // Obtener información de la divisa
        const divisa = await DivisaService.getById(usuario.idDivisa);
        
        if (!mountedRef.current) return;
        
        if (divisa) {
          setCurrencySymbol(divisa.simbolo || divisa.iso);
          setCurrencyCode(divisa.iso);
          setSymbolPosition(divisa.posicionSimbolo || 'DESPUES');
        } else {
          setCurrencySymbol('€');
          setCurrencyCode('EUR');
          setSymbolPosition('DESPUES');
        }
      } else {
        // Divisa por defecto
        setCurrencySymbol('€');
        setCurrencyCode('EUR');
        setSymbolPosition('DESPUES');
      }
    } catch (error: any) {
      // Solo loguear si no fue cancelado
      if (error?.message !== 'CANCELED' && !error?.canceled) {
        console.error('Error al obtener símbolo de divisa:', error);
      }
      
      if (!mountedRef.current) return;
      
      setCurrencySymbol('€');
      setCurrencyCode('EUR');
      setSymbolPosition('DESPUES');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    fetchCurrencySymbol();

    // Escuchar cambios de divisa
    const unsubscribe = eventEmitter.on(APP_EVENTS.CURRENCY_CHANGED, () => {
      console.log('💱 Detectado cambio de divisa, recargando...');
      fetchCurrencySymbol();
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [user?.id]);

  return { currencySymbol, currencyCode, symbolPosition, loading };
};
