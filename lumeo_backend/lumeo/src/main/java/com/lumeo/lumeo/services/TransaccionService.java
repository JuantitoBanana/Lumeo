package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class TransaccionService extends GenericService<TransaccionModel, Long> {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Override
    protected JpaRepository<TransaccionModel, Long> getRepository() {
        return transaccionRepository;
    }
}