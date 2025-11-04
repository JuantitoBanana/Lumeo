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
@Table(name = "presupuesto")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PresupuestoModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "mes")
    private String mes;
    
    @Column(name = "anio")
    private String anio;
    
    @Column(name = "cantidad", nullable = false)
    private Double cantidad;
    
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