package com.lumeo.lumeo.services;

import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UsuarioService extends GenericService<usuarioModel, Long> {
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Override
    protected JpaRepository<usuarioModel, Long> getRepository() {
        return usuarioRepository;
    }
    
    public Optional<usuarioModel> findByUid(UUID uid) {
        return usuarioRepository.findByUid(uid);
    }
    
    public Optional<usuarioModel> findByNombreUsuario(String nombreUsuario) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario);
    }
}