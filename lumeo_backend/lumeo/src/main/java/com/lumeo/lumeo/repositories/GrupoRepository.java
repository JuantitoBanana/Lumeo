package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.GrupoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupoRepository extends JpaRepository<GrupoModel, Long> {
    
}