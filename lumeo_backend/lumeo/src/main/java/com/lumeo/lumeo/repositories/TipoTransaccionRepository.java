package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.TipoTransaccionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoTransaccionRepository extends JpaRepository<TipoTransaccionModel, Long> {
    
}