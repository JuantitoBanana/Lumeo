package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearTransaccionGrupalDTO {
    private String titulo;
    private Double importeTotal;
    private LocalDate fechaTransaccion;
    private String nota;
    private Long idGrupo;
    private Long idCategoria;
    private Long idTipo;
    private Long idAdjunto;
    
    // Lista de transacciones individuales a crear
    private List<TransaccionIndividualDTO> transaccionesIndividuales;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TransaccionIndividualDTO {
        private Long idUsuario;
        private Double importe;
    }
}
