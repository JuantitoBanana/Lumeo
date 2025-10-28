package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.EstadoTransaccionModel;
import com.lumeo.lumeo.repositories.EstadoTransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class EstadoTransaccionService extends GenericService<EstadoTransaccionModel, Long> {
    
    @Autowired
    private EstadoTransaccionRepository estadoTransaccionRepository;
    
    @Override
    protected JpaRepository<EstadoTransaccionModel, Long> getRepository() {
        return estadoTransaccionRepository;
    }
}