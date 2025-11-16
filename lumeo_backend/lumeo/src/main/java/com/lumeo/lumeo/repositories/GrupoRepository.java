package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.GrupoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrupoRepository extends JpaRepository<GrupoModel, Long> {
    
    List<GrupoModel> findByIdCreador(Long idCreador);
    
}