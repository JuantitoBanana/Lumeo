package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.usuarioModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<usuarioModel, Long> {
    
}