package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.TransaccionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransaccionRepository extends JpaRepository<TransaccionModel, Long> {
    
}