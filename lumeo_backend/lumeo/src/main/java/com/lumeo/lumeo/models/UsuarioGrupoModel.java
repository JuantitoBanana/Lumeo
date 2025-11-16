package com.lumeo.lumeo.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "usuario_grupo")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@IdClass(UsuarioGrupoModel.UsuarioGrupoId.class)
public class UsuarioGrupoModel {
    
    @Id
    @Column(name = "id_usuario")
    private Long idUsuario;
    
    @Id
    @Column(name = "id_grupo")
    private Long idGrupo;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", insertable = false, updatable = false)
    private usuarioModel usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_grupo", insertable = false, updatable = false)
    private GrupoModel grupo;
    
    // Clase interna para la clave compuesta
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UsuarioGrupoId implements Serializable {
        private Long idUsuario;
        private Long idGrupo;
    }
}
