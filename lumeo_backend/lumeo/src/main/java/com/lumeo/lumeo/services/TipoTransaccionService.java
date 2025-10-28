package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.TipoTransaccionModel;
import com.lumeo.lumeo.repositories.TipoTransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

@Service
public class TipoTransaccionService extends GenericService<TipoTransaccionModel, Long> {
    
    @Autowired
    private TipoTransaccionRepository tipoTransaccionRepository;
    
    @Override
    protected JpaRepository<TipoTransaccionModel, Long> getRepository() {
        return tipoTransaccionRepository;
    }
}