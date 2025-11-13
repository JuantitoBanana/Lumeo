package com.lumeo.lumeo.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        // Configuración básica
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        
        // Pool settings - Configuración agresiva para cerrar conexiones
        config.setMaximumPoolSize(2);
        config.setMinimumIdle(0);
        config.setConnectionTimeout(10000);
        config.setValidationTimeout(3000);
        config.setMaxLifetime(60000); // 1 minuto - Reciclar conexiones rápidamente
        config.setIdleTimeout(30000); // 30 segundos - Cerrar conexiones inactivas rápidamente
        config.setAutoCommit(true);
        config.setLeakDetectionThreshold(60000); // 1 minuto
        
        // Desactivar keepalive
        config.setKeepaliveTime(0);
        
        // Pool name
        config.setPoolName("LumeoHikariPool");
        
        // Register shutdown hook para cerrar conexiones al terminar
        config.setRegisterMbeans(false);
        
        // Desactivar prepared statements cache
        config.addDataSourceProperty("prepareThreshold", "0");
        config.addDataSourceProperty("preparedStatementCacheQueries", "0");
        config.addDataSourceProperty("preparedStatementCacheSizeMiB", "0");
        
        HikariDataSource dataSource = new HikariDataSource(config);
        
        // Asegurar cierre correcto al terminar la aplicación
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            if (dataSource != null && !dataSource.isClosed()) {
                System.out.println("Cerrando pool de conexiones...");
                dataSource.close();
                System.out.println("Pool de conexiones cerrado correctamente.");
            }
        }));
        
        return dataSource;
    }
}
