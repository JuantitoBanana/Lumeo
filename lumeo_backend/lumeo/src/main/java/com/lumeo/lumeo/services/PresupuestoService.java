package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.PresupuestoModel;
import com.lumeo.lumeo.repositories.PresupuestoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class PresupuestoService extends GenericService<PresupuestoModel, Long> {
    
    @Autowired
    private PresupuestoRepository presupuestoRepository;
    
    @Override
    protected JpaRepository<PresupuestoModel, Long> getRepository() {
        return presupuestoRepository;
    }
    
    public List<PresupuestoModel> findByUsuario(Long idUsuario) {
        return presupuestoRepository.findByIdUsuario(idUsuario);
    }
    
    public List<PresupuestoModel> findByUsuarioUid(UUID uid) {
        return presupuestoRepository.findByUsuarioUid(uid);
    }
}