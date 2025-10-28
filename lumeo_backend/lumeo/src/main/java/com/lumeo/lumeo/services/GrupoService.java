package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.GrupoModel;
import com.lumeo.lumeo.repositories.GrupoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class GrupoService extends GenericService<GrupoModel, Long> {
    
    @Autowired
    private GrupoRepository grupoRepository;
    
    @Override
    protected JpaRepository<GrupoModel, Long> getRepository() {
        return grupoRepository;
    }
}