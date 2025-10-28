package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.CategoriaModel;
import com.lumeo.lumeo.repositories.CategoriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class CategoriaService extends GenericService<CategoriaModel, Long> {
    
    @Autowired
    private CategoriaRepository categoriaRepository;
    
    @Override
    protected JpaRepository<CategoriaModel, Long> getRepository() {
        return categoriaRepository;
    }
}