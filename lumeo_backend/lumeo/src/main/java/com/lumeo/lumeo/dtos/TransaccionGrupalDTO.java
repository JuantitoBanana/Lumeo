package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransaccionGrupalDTO {
    private Long id;
    private String titulo;
    private Double importe; // Importe convertido a la divisa del usuario
    private Double importeOriginal; // Importe en la divisa original
    private LocalDate fechaTransaccion;
    private String nota;
    private Long idGrupo;
    private String nombreGrupo;
    private Long idCategoria;
    private String nombreCategoria;
    private Long idTipo;
    private String nombreTipo;
    private Long idAdjunto;
    private Long idDivisaOriginal;
    private String codigoDivisaOriginal;
    private String posicionSimbolo;
    
    // Lista de transacciones individuales asociadas
    private List<TransaccionDTO> transaccionesIndividuales;
}
