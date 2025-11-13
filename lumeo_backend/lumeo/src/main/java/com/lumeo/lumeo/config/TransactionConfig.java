package com.lumeo.lumeo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Configuración de transacciones
 * Asegura que todas las transacciones se cierren correctamente
 */
@Configuration
@EnableTransactionManagement
public class TransactionConfig {
    // Spring Boot autoconfigura el TransactionManager
    // Esta clase solo asegura que @EnableTransactionManagement esté activo
}
