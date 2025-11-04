package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresupuestoDTO {
    private Long id;
    private String mes;
    private String anio;
    private Double cantidad;
    private Double totalGastos;
    private Long idUsuario;
    private OffsetDateTime fechaCreacion;
    private OffsetDateTime fechaModificacion;
}
