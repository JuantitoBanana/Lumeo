package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.PresupuestoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PresupuestoRepository extends JpaRepository<PresupuestoModel, Long> {
    @Query("SELECT p FROM PresupuestoModel p WHERE p.idUsuario = :idUsuario ORDER BY p.fechaCreacion DESC")
    List<PresupuestoModel> findByIdUsuario(@Param("idUsuario") Long idUsuario);
    
    @Query("SELECT p FROM PresupuestoModel p WHERE p.usuario.uid = :uid ORDER BY p.fechaCreacion DESC")
    List<PresupuestoModel> findByUsuarioUid(@Param("uid") UUID uid);
}