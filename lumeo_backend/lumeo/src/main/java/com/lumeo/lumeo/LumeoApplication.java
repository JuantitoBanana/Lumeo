package com.lumeo.lumeo;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.lumeo.lumeo.models")
@EnableJpaRepositories(basePackages = "com.lumeo.lumeo.repositories")
public class LumeoApplication {

    public static void main(String[] args) {
        // Cargar archivo .env si existe
        try {
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();
            
            // Cargar variables de entorno del .env a System properties
            dotenv.entries().forEach(e -> {
                System.setProperty(e.getKey(), e.getValue());
            });
        } catch (Exception e) {
            System.out.println("⚠️ No se pudo cargar .env (puede ser normal en producción): " + e.getMessage());
        }
        
        SpringApplication.run(LumeoApplication.class, args);
    }

}
