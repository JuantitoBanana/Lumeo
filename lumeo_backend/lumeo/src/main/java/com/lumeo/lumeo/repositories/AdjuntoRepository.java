package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.AdjuntoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdjuntoRepository extends JpaRepository<AdjuntoModel, Long> {
    
}