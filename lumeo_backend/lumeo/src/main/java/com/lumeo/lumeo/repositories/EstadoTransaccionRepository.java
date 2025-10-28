package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.EstadoTransaccionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EstadoTransaccionRepository extends JpaRepository<EstadoTransaccionModel, Long> {
    
}