package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.repositories.DivisaRepository;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import com.lumeo.lumeo.repositories.MetaAhorroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ConversionDivisaService {
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Autowired
    private MetaAhorroRepository metaAhorroRepository;
    
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // API gratuita de tasas de cambio (sin necesidad de API key para uso básico)
    private static final String API_URL = "https://api.exchangerate-api.com/v4/latest/";
    
    // Caché de tasas de cambio con timestamp
    private final Map<String, CachedRates> ratesCache = new ConcurrentHashMap<>();
    private static final long CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora
    
    /**
     * Clase interna para almacenar tasas con timestamp
     */
    private static class CachedRates {
        JsonNode rates;
        long timestamp;
        
        CachedRates(JsonNode rates, long timestamp) {
            this.rates = rates;
            this.timestamp = timestamp;
        }
        
        boolean isValid() {
            return (System.currentTimeMillis() - timestamp) < CACHE_DURATION_MS;
        }
    }
    
    /**
     * Convierte un monto de una divisa a otra usando tasas en tiempo real
     * OPTIMIZADO: Caché de tasas de cambio para evitar peticiones HTTP repetidas
     */
    public Double convertirMonto(Double monto, String isoOrigen, String isoDestino) {
        // Si el monto es nulo, devolver null
        if (monto == null) {
            return null;
        }
        
        // Si las divisas son iguales, no hace falta convertir
        if (isoOrigen.equals(isoDestino)) {
            return monto;
        }
        
        try {
            // Verificar caché primero
            CachedRates cachedRates = ratesCache.get(isoOrigen);
            JsonNode rates;
            
            if (cachedRates != null && cachedRates.isValid()) {
                // Usar caché
                System.out.println("💾 Usando caché de tasas para " + isoOrigen);
                rates = cachedRates.rates;
            } else {
                // Obtener tasas frescas de la API
                System.out.println("🔄 Obteniendo tasas frescas para " + isoOrigen);
                String url = API_URL + isoOrigen;
                String response = restTemplate.getForObject(url, String.class);
                
                if (response == null) {
                    System.err.println("No se pudo obtener respuesta de la API de divisas");
                    return monto;
                }
                
                // Parsear la respuesta JSON
                JsonNode root = objectMapper.readTree(response);
                rates = root.get("rates");
                
                // Guardar en caché
                ratesCache.put(isoOrigen, new CachedRates(rates, System.currentTimeMillis()));
                System.out.println("✅ Tasas guardadas en caché para " + isoOrigen);
            }
            
            if (rates == null || !rates.has(isoDestino)) {
                System.err.println("No se encontró tasa de cambio para " + isoDestino);
                return monto;
            }
            
            // Obtener la tasa de conversión
            Double tasa = rates.get(isoDestino).asDouble();
            
            // Convertir el monto
            Double montoConvertido = monto * tasa;
            
            // Redondear a 2 decimales
            return Math.round(montoConvertido * 100.0) / 100.0;
        } catch (Exception e) {
            System.err.println("Error al convertir divisa: " + e.getMessage());
            e.printStackTrace();
            return monto; // Devolver monto original si falla la conversión
        }
    }
    
    /**
     * Limpia el caché de tasas de cambio
     */
    public void clearCache() {
        ratesCache.clear();
        System.out.println("🧹 Caché de tasas de cambio limpiada");
    }
    
    /**
     * Inicializa el campo id_divisa_original para transacciones existentes
     * IMPORTANTE: NO modifica los importes, solo registra la divisa original
     */
    @Transactional
    public void convertirTransaccionesUsuario(Long idUsuario, Long idDivisaAnterior, Long idDivisaNueva) {
        // Solo inicializar id_divisa_original si no existe
        List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuario(idUsuario);
        
        for (TransaccionModel transaccion : transacciones) {
            if (transaccion.getIdDivisaOriginal() == null) {
                transaccion.setIdDivisaOriginal(idDivisaAnterior);
                transaccionRepository.save(transaccion);
            }
        }
        
        System.out.println("Inicializados campos id_divisa_original para " + transacciones.size() + " transacciones");
    }
    
    /**
     * Inicializa el campo id_divisa_original para metas de ahorro existentes
     * IMPORTANTE: NO modifica las cantidades, solo registra la divisa original
     */
    @Transactional
    public void convertirMetasAhorroUsuario(Long idUsuario, Long idDivisaAnterior, Long idDivisaNueva) {
        // Solo inicializar id_divisa_original si no existe
        List<MetaAhorroModel> metas = metaAhorroRepository.findByIdUsuario(idUsuario);
        
        for (MetaAhorroModel meta : metas) {
            if (meta.getIdDivisaOriginal() == null) {
                meta.setIdDivisaOriginal(idDivisaAnterior);
                metaAhorroRepository.save(meta);
            }
        }
        
        System.out.println("Inicializados campos id_divisa_original para " + metas.size() + " metas de ahorro");
    }
    
    /**
     * Convierte todos los montos de un usuario a una nueva divisa
     */
    @Transactional
    public void convertirTodosMontosUsuario(Long idUsuario, Long idDivisaAnterior, Long idDivisaNueva) {
        if (idDivisaAnterior.equals(idDivisaNueva)) {
            System.out.println("Las divisas son iguales, no se requiere conversión");
            return;
        }
        
        convertirTransaccionesUsuario(idUsuario, idDivisaAnterior, idDivisaNueva);
        convertirMetasAhorroUsuario(idUsuario, idDivisaAnterior, idDivisaNueva);
    }
    
    /**
     * Obtiene el símbolo de una divisa por su código ISO
     */
    public String obtenerSimboloDivisa(String iso) {
        try {
            java.util.Currency javaCurrency = java.util.Currency.getInstance(iso);
            return javaCurrency.getSymbol();
        } catch (Exception e) {
            System.err.println("Error al obtener símbolo de divisa: " + e.getMessage());
            return iso;
        }
    }
}
