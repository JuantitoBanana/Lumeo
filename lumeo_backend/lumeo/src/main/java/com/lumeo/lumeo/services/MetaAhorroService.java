package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.repositories.MetaAhorroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class MetaAhorroService extends GenericService<MetaAhorroModel, Long> {
    
    @Autowired
    private MetaAhorroRepository metaAhorroRepository;
    
    @Override
    protected JpaRepository<MetaAhorroModel, Long> getRepository() {
        return metaAhorroRepository;
    }
    
    public List<MetaAhorroModel> findByUsuario(Long idUsuario) {
        return metaAhorroRepository.findByIdUsuario(idUsuario);
    }
    
    public List<MetaAhorroModel> findByUsuarioUid(UUID uid) {
        return metaAhorroRepository.findByUsuarioUid(uid);
    }
}