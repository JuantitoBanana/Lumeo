package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.PresupuestoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PresupuestoRepository extends JpaRepository<PresupuestoModel, Long> {
    
}