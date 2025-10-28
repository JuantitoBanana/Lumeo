package com.lumeo.lumeo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "presupuesto")
public class PresupuestoModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "limite_presupuesto", nullable = false)
    private Double limitePresupuesto;
    
    @Column(name = "fecha_limite")
    private LocalDate fechaLimite;
    
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    // Relationship with Usuario
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
}