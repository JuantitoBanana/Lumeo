package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.repositories.DivisaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class DivisaService extends GenericService<DivisaModel, Long> {
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Override
    protected JpaRepository<DivisaModel, Long> getRepository() {
        return divisaRepository;
    }
}