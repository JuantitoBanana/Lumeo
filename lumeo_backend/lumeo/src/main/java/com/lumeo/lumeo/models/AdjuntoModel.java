package com.lumeo.lumeo.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "adjunto")
public class AdjuntoModel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_transaccion", nullable = false)
    private TransaccionModel transaccion;
    
    @Column(name = "ruta_archivo", nullable = false)
    private String rutaArchivo;
    
    @Column(name = "tipo_archivo")
    private String tipoArchivo;
    
    @Column(name = "tamano_archivo")
    private Long tamanoArchivo;
    
    @Column(name = "fecha_subida", nullable = false, insertable = false, updatable = false)
    private ZonedDateTime fechaSubida;
}