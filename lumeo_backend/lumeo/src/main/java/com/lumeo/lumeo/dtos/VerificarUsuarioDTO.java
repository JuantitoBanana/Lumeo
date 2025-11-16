package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificarUsuarioDTO {
    private String nombreUsuario;
    private boolean existe;
    private Long idUsuario;
    private String nombre;
    private String apellido;
}
