package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "categoria")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CategoriaModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nombre", nullable = false)
    private String nombre;
    
    @Column(name = "es_personalizada")
    private Boolean esPersonalizada;
    
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    @Column(name = "icono")
    private String icono;
    
    @Column(name = "color")
    private String color;
    
    // Relationship with Usuario
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
}