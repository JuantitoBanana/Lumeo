package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "transaccion")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class TransaccionModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "titulo", nullable = false)
    private String titulo;
    
    @Column(name = "importe")
    private Double importe;
    
    @Column(name = "fecha_transaccion")
    private LocalDate fechaTransaccion;
    
    @Column(name = "nota")
    private String nota;
    
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    @Column(name = "id_categoria")
    private Long idCategoria;
    
    @Column(name = "id_grupo")
    private Long idGrupo;
    
    @Column(name = "id_tipo")
    private Long idTipo;
    
    @Column(name = "id_estado")
    private Long idEstado;
    
    @Column(name = "id_adjunto")
    private Long idAdjunto;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria", insertable = false, updatable = false)
    private CategoriaModel categoria;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_grupo", insertable = false, updatable = false)
    private GrupoModel grupo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_tipo", insertable = false, updatable = false)
    private TipoTransaccionModel tipoTransaccion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_estado", insertable = false, updatable = false)
    private EstadoTransaccionModel estadoTransaccion;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_adjunto", insertable = false, updatable = false)
    private AdjuntoModel adjunto;
}