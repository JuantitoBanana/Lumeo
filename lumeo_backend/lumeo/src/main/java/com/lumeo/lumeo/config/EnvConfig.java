package com.lumeo.lumeo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;

/**
 * Configuración para cargar variables de entorno desde archivo .env
 * Permite mantener las credenciales de base de datos fuera del código fuente
 */
@Configuration
@PropertySource(value = "file:.env", ignoreResourceNotFound = true)
public class EnvConfig {
    // Esta clase simplemente carga el archivo .env como PropertySource
    // Spring Boot automáticamente usará estas propiedades para ${DB_URL}, etc.
}