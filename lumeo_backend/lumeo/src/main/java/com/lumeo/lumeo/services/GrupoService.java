package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.CrearGrupoDTO;
import com.lumeo.lumeo.dtos.GrupoConMiembrosDTO;
import com.lumeo.lumeo.dtos.MiembroGrupoDTO;
import com.lumeo.lumeo.dtos.VerificarUsuarioDTO;
import com.lumeo.lumeo.models.GrupoModel;
import com.lumeo.lumeo.models.UsuarioGrupoModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.repositories.GrupoRepository;
import com.lumeo.lumeo.repositories.UsuarioGrupoRepository;
import com.lumeo.lumeo.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GrupoService extends GenericService<GrupoModel, Long> {
    
    @Autowired
    private GrupoRepository grupoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private UsuarioGrupoRepository usuarioGrupoRepository;
    
    @Override
    protected JpaRepository<GrupoModel, Long> getRepository() {
        return grupoRepository;
    }
    
    /**
     * Verifica si un usuario existe por nombre de usuario
     */
    public VerificarUsuarioDTO verificarUsuario(String nombreUsuario) {
        Optional<usuarioModel> usuario = usuarioRepository.findByNombreUsuario(nombreUsuario);
        
        if (usuario.isPresent()) {
            usuarioModel u = usuario.get();
            return new VerificarUsuarioDTO(
                nombreUsuario,
                true,
                u.getId(),
                u.getNombre(),
                u.getApellido()
            );
        } else {
            return new VerificarUsuarioDTO(nombreUsuario, false, null, null, null);
        }
    }
    
    /**
     * Crea un grupo con los usuarios especificados, incluyendo al creador
     */
    @Transactional
    public GrupoConMiembrosDTO crearGrupoConUsuarios(CrearGrupoDTO crearGrupoDTO, Long idUsuarioCreador) {
        // Crear el grupo
        GrupoModel grupo = new GrupoModel();
        grupo.setNombre(crearGrupoDTO.getNombre());
        grupo.setDescripcion(crearGrupoDTO.getDescripcion());
        grupo.setIdCreador(idUsuarioCreador); // Establecer el creador del grupo
        
        GrupoModel grupoGuardado = grupoRepository.save(grupo);
        
        // Agregar el usuario creador al grupo
        UsuarioGrupoModel relacionCreador = new UsuarioGrupoModel();
        relacionCreador.setIdUsuario(idUsuarioCreador);
        relacionCreador.setIdGrupo(grupoGuardado.getId());
        usuarioGrupoRepository.save(relacionCreador);
        
        List<MiembroGrupoDTO> miembros = new ArrayList<>();
        
        // Agregar el creador a la lista de miembros
        usuarioRepository.findById(idUsuarioCreador).ifPresent(creador -> {
            miembros.add(new MiembroGrupoDTO(
                creador.getId(),
                creador.getNombreUsuario(),
                creador.getNombre(),
                creador.getApellido(),
                creador.getEmail()
            ));
        });
        
        // Agregar los otros usuarios al grupo
        if (crearGrupoDTO.getNombresUsuarios() != null && !crearGrupoDTO.getNombresUsuarios().isEmpty()) {
            for (String nombreUsuario : crearGrupoDTO.getNombresUsuarios()) {
                Optional<usuarioModel> usuario = usuarioRepository.findByNombreUsuario(nombreUsuario);
                
                if (usuario.isPresent() && !usuario.get().getId().equals(idUsuarioCreador)) {
                    // Solo agregar si no es el creador (para evitar duplicados)
                    usuarioModel u = usuario.get();
                    
                    UsuarioGrupoModel relacion = new UsuarioGrupoModel();
                    relacion.setIdUsuario(u.getId());
                    relacion.setIdGrupo(grupoGuardado.getId());
                    usuarioGrupoRepository.save(relacion);
                    
                    miembros.add(new MiembroGrupoDTO(
                        u.getId(),
                        u.getNombreUsuario(),
                        u.getNombre(),
                        u.getApellido(),
                        u.getEmail()
                    ));
                }
            }
        }
        
        return new GrupoConMiembrosDTO(grupoGuardado, miembros);
    }
    
    /**
     * Obtiene un grupo con sus miembros (incluyendo al creador)
     */
    public Optional<GrupoConMiembrosDTO> obtenerGrupoConMiembros(Long idGrupo) {
        Optional<GrupoModel> grupo = grupoRepository.findById(idGrupo);
        
        if (grupo.isEmpty()) {
            return Optional.empty();
        }
        
        GrupoModel grupoModel = grupo.get();
        List<MiembroGrupoDTO> miembros = new ArrayList<>();
        
        // Agregar el creador del grupo primero (si existe)
        if (grupoModel.getIdCreador() != null) {
            Optional<usuarioModel> creador = usuarioRepository.findById(grupoModel.getIdCreador());
            if (creador.isPresent()) {
                usuarioModel c = creador.get();
                miembros.add(new MiembroGrupoDTO(
                    c.getId(),
                    c.getNombreUsuario(),
                    c.getNombre(),
                    c.getApellido(),
                    c.getEmail()
                ));
            }
        }
        
        // Agregar los demás miembros de la tabla usuario_grupo (excluyendo al creador si está duplicado)
        List<UsuarioGrupoModel> relaciones = usuarioGrupoRepository.findByIdGrupo(idGrupo);
        List<MiembroGrupoDTO> otrosMiembros = relaciones.stream()
            .filter(relacion -> !relacion.getIdUsuario().equals(grupoModel.getIdCreador())) // Excluir creador
            .map(relacion -> {
                Optional<usuarioModel> usuario = usuarioRepository.findById(relacion.getIdUsuario());
                if (usuario.isPresent()) {
                    usuarioModel u = usuario.get();
                    return new MiembroGrupoDTO(
                        u.getId(),
                        u.getNombreUsuario(),
                        u.getNombre(),
                        u.getApellido(),
                        u.getEmail()
                    );
                }
                return null;
            })
            .filter(miembro -> miembro != null)
            .collect(Collectors.toList());
        
        miembros.addAll(otrosMiembros);
        
        return Optional.of(new GrupoConMiembrosDTO(grupoModel, miembros));
    }
    
    /**
     * Obtiene todos los grupos de un usuario (tanto como miembro como creador)
     */
    public List<GrupoConMiembrosDTO> obtenerGruposDeUsuario(Long idUsuario) {
        // Obtener grupos donde el usuario es miembro (tabla usuario_grupo)
        List<UsuarioGrupoModel> relaciones = usuarioGrupoRepository.findByIdUsuario(idUsuario);
        List<Long> idsGruposMiembro = relaciones.stream()
            .map(UsuarioGrupoModel::getIdGrupo)
            .collect(Collectors.toList());
        
        // Obtener grupos donde el usuario es creador
        List<GrupoModel> gruposCreador = grupoRepository.findByIdCreador(idUsuario);
        List<Long> idsGruposCreador = gruposCreador.stream()
            .map(GrupoModel::getId)
            .collect(Collectors.toList());
        
        // Combinar ambos conjuntos de IDs sin duplicados
        Set<Long> idsGruposTotales = new HashSet<>();
        idsGruposTotales.addAll(idsGruposMiembro);
        idsGruposTotales.addAll(idsGruposCreador);
        
        // Obtener los datos completos de cada grupo
        return idsGruposTotales.stream()
            .map(this::obtenerGrupoConMiembros)
            .filter(Optional::isPresent)
            .map(Optional::get)
            .collect(Collectors.toList());
    }
    
    /**
     * Elimina un miembro de un grupo
     */
    @Transactional
    public void eliminarMiembroDeGrupo(Long idGrupo, Long idUsuario) {
        usuarioGrupoRepository.deleteByIdGrupoAndIdUsuario(idGrupo, idUsuario);
    }
}