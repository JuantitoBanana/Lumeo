package com.lumeo.lumeo.dtos;

import com.lumeo.lumeo.models.GrupoModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GrupoConMiembrosDTO {
    private GrupoModel grupo;
    private List<MiembroGrupoDTO> miembros;
}
