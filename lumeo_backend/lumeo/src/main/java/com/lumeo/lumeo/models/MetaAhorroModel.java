package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "meta_ahorro")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class MetaAhorroModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "titulo", nullable = false)
    private String titulo;
    
    @Column(name = "cantidad_objetivo")
    private Double cantidadObjetivo; // Cantidad ORIGINAL
    
    @Column(name = "cantidad_actual")
    private Double cantidadActual; // Cantidad ORIGINAL
    
    @Column(name = "id_divisa_original")
    private Long idDivisaOriginal; // Divisa en la que se creó la meta
    
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private OffsetDateTime fechaCreacion;
    
    @UpdateTimestamp
    @Column(name = "fecha_modificacion")
    private OffsetDateTime fechaModificacion;
    
    // Relationship with Usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
}