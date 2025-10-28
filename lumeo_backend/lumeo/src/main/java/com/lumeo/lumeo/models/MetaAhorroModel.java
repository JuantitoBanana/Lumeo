package com.lumeo.lumeo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "meta_ahorro")
public class MetaAhorroModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "titulo", nullable = false)
    private String titulo;
    
    @Column(name = "cantidad_objetivo")
    private Double cantidadObjetivo;
    
    @Column(name = "cantidad_actual")
    private Double cantidadActual;
    
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    // Relationship with Usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
}