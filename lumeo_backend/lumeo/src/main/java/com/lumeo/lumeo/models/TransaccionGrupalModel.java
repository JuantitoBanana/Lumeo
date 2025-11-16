package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "transaccion_grupal")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransaccionGrupalModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "titulo")
    private String titulo;
    
    @Column(name = "importe")
    private Double importe;
    
    @Column(name = "fecha_transaccion")
    private LocalDate fechaTransaccion;
    
    @Column(name = "nota")
    private String nota;
    
    @Column(name = "id_grupo")
    private Long idGrupo;
    
    @Column(name = "id_categoria")
    private Long idCategoria;
    
    @Column(name = "id_tipo")
    private Long idTipo;
    
    @Column(name = "id_adjunto")
    private Long idAdjunto;
    
    @Column(name = "id_divisa_original")
    private Long idDivisaOriginal;
    
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_grupo", insertable = false, updatable = false)
    private GrupoModel grupo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", insertable = false, updatable = false)
    private CategoriaModel categoria;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo", insertable = false, updatable = false)
    private TipoTransaccionModel tipoTransaccion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_adjunto", insertable = false, updatable = false)
    private AdjuntoModel adjunto;
    
    @PrePersist
    protected void onCreate() {
        fechaCreacion = LocalDateTime.now();
        fechaModificacion = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        fechaModificacion = LocalDateTime.now();
    }
}
