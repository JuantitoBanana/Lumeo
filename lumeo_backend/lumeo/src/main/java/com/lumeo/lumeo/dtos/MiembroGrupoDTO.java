package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MiembroGrupoDTO {
    private Long idUsuario;
    private String nombreUsuario;
    private String nombre;
    private String apellido;
    private String email;
}
