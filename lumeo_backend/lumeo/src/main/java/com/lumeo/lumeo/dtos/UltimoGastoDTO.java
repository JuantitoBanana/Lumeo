package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UltimoGastoDTO {
    private Long id;
    private String titulo;
    private Double importe;
    private LocalDate fechaTransaccion;
    private String nota;
    private Long idCategoria;
    
    // Información de la categoría (si existe)
    private String nombreCategoria;
    private String iconoCategoria;
    private String colorCategoria;
    
    // Información de la divisa
    private String posicionSimbolo; // "ANTES" o "DESPUES"
}
