package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.MetaAhorroModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MetaAhorroRepository extends JpaRepository<MetaAhorroModel, Long> {
    @Query("SELECT m FROM MetaAhorroModel m WHERE m.idUsuario = :idUsuario ORDER BY m.fechaCreacion DESC")
    List<MetaAhorroModel> findByIdUsuario(@Param("idUsuario") Long idUsuario);
    
    @Query("SELECT m FROM MetaAhorroModel m WHERE m.usuario.uid = :uid ORDER BY m.fechaCreacion DESC")
    List<MetaAhorroModel> findByUsuarioUid(@Param("uid") UUID uid);
}