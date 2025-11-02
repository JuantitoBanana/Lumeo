package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tipo_transaccion")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TipoTransaccionModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "descripcion", nullable = false)
    private String descripcion;
    
    // Alias para compatibilidad con frontend
    public String getNombre() {
        return descripcion;
    }
}