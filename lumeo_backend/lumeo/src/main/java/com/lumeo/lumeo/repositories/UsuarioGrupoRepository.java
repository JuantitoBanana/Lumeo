package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.UsuarioGrupoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UsuarioGrupoRepository extends JpaRepository<UsuarioGrupoModel, UsuarioGrupoModel.UsuarioGrupoId> {
    List<UsuarioGrupoModel> findByIdGrupo(Long idGrupo);
    List<UsuarioGrupoModel> findByIdUsuario(Long idUsuario);
    java.util.Optional<UsuarioGrupoModel> findByIdGrupoAndIdUsuario(Long idGrupo, Long idUsuario);
    void deleteByIdGrupoAndIdUsuario(Long idGrupo, Long idUsuario);
    void deleteByIdGrupo(Long idGrupo);
}
