package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.dtos.CrearGrupoDTO;
import com.lumeo.lumeo.dtos.GrupoConMiembrosDTO;
import com.lumeo.lumeo.dtos.VerificarUsuarioDTO;
import com.lumeo.lumeo.models.GrupoModel;
import com.lumeo.lumeo.services.GrupoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grupos")
public class GrupoController {
    
    @Autowired
    private GrupoService grupoService;
    
    @GetMapping
    public ResponseEntity<List<GrupoModel>> findAll() {
        return ResponseEntity.ok(grupoService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<GrupoModel> findById(@PathVariable Long id) {
        return grupoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<GrupoModel> create(@RequestBody GrupoModel grupo) {
        return ResponseEntity.status(HttpStatus.CREATED).body(grupoService.create(grupo));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<GrupoModel> editById(@PathVariable Long id, @RequestBody GrupoModel grupo) {
        return grupoService.editById(id, grupo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (grupoService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Verifica si un usuario existe por nombre de usuario
     */
    @GetMapping("/verificar-usuario/{nombreUsuario}")
    public ResponseEntity<VerificarUsuarioDTO> verificarUsuario(@PathVariable String nombreUsuario) {
        VerificarUsuarioDTO resultado = grupoService.verificarUsuario(nombreUsuario);
        return ResponseEntity.ok(resultado);
    }
    
    /**
     * Crea un grupo con usuarios
     */
    @PostMapping("/crear-con-usuarios")
    public ResponseEntity<GrupoConMiembrosDTO> crearGrupoConUsuarios(
            @RequestBody CrearGrupoDTO crearGrupoDTO,
            @RequestParam Long idUsuarioCreador) {
        try {
            GrupoConMiembrosDTO resultado = grupoService.crearGrupoConUsuarios(crearGrupoDTO, idUsuarioCreador);
            return ResponseEntity.status(HttpStatus.CREATED).body(resultado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Obtiene un grupo con sus miembros
     */
    @GetMapping("/{id}/con-miembros")
    public ResponseEntity<GrupoConMiembrosDTO> obtenerGrupoConMiembros(@PathVariable Long id) {
        return grupoService.obtenerGrupoConMiembros(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Obtiene todos los grupos de un usuario
     */
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<GrupoConMiembrosDTO>> obtenerGruposDeUsuario(@PathVariable Long idUsuario) {
        List<GrupoConMiembrosDTO> grupos = grupoService.obtenerGruposDeUsuario(idUsuario);
        return ResponseEntity.ok(grupos);
    }
    
    /**
     * Agrega un miembro a un grupo existente
     */
    @PostMapping("/{idGrupo}/agregar-miembro")
    public ResponseEntity<Void> agregarMiembroAGrupo(
            @PathVariable Long idGrupo,
            @RequestBody java.util.Map<String, String> body) {
        try {
            String nombreUsuario = body.get("nombreUsuario");
            if (nombreUsuario == null || nombreUsuario.trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            grupoService.agregarMiembroAGrupo(idGrupo, nombreUsuario);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Elimina un miembro de un grupo
     */
    @DeleteMapping("/{idGrupo}/miembro/{idUsuario}")
    public ResponseEntity<Void> eliminarMiembroDeGrupo(@PathVariable Long idGrupo, @PathVariable Long idUsuario) {
        try {
            grupoService.eliminarMiembroDeGrupo(idGrupo, idUsuario);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}