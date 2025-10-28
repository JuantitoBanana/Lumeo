package com.lumeo.lumeo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.lumeo.lumeo.models")
@EnableJpaRepositories(basePackages = "com.lumeo.lumeo.repositories")
public class LumeoApplication {

    public static void main(String[] args) {
        SpringApplication.run(LumeoApplication.class, args);
    }

}
