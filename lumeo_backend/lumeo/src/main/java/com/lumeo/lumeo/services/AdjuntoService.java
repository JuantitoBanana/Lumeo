package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.AdjuntoModel;
import com.lumeo.lumeo.repositories.AdjuntoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class AdjuntoService extends GenericService<AdjuntoModel, Long> {
    
    @Autowired
    private AdjuntoRepository adjuntoRepository;
    
    @Override
    protected JpaRepository<AdjuntoModel, Long> getRepository() {
        return adjuntoRepository;
    }
}