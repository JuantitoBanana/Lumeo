package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MetaAhorroDTO {
    private Long id;
    private String titulo;
    private Double cantidadObjetivo;
    private Double cantidadActual;
    private Long idUsuario;
    private Long idDivisaOriginal;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaModificacion;
    
    // Información de la divisa
    private String posicionSimbolo; // "ANTES" o "DESPUES"
}
