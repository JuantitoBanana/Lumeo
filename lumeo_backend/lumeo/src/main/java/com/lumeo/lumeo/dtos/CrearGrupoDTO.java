package com.lumeo.lumeo.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearGrupoDTO {
    private String nombre;
    private String descripcion;
    private List<String> nombresUsuarios; // Lista de nombres de usuario a agregar al grupo
}
