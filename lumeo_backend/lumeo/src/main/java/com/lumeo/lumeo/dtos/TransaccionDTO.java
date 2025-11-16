package com.lumeo.lumeo.dtos;

import com.lumeo.lumeo.models.CategoriaModel;
import com.lumeo.lumeo.models.GrupoModel;
import com.lumeo.lumeo.models.TipoTransaccionModel;
import com.lumeo.lumeo.models.EstadoTransaccionModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransaccionDTO {
    private Long id;
    private String titulo;
    private Double importe;
    private LocalDate fechaTransaccion;
    private String nota;
    private Long idUsuario;
    private Long idCategoria;
    private Long idGrupo;
    private Long idTipo;
    private Long idEstado;
    private Long idAdjunto;
    private Long idDestinatario;
    private Double importeDestinatario;
    
    // Información del usuario (para transacciones grupales y destinatarios)
    private String nombreUsuario;
    private String nombre;
    private String apellido;
    
    // Relaciones (cuando se necesiten)
    private CategoriaModel categoria;
    private GrupoModel grupo;
    private TipoTransaccionModel tipoTransaccion;
    private EstadoTransaccionModel estadoTransaccion;
    
    // Información de la divisa
    private String posicionSimbolo; // "ANTES" o "DESPUES"
}
