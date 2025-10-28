package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.repositories.MetaAhorroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class MetaAhorroService extends GenericService<MetaAhorroModel, Long> {
    
    @Autowired
    private MetaAhorroRepository metaAhorroRepository;
    
    @Override
    protected JpaRepository<MetaAhorroModel, Long> getRepository() {
        return metaAhorroRepository;
    }
}