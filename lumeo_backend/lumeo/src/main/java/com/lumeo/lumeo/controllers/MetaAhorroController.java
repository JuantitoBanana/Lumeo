package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.services.MetaAhorroService;
import com.lumeo.lumeo.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/metas-ahorro")
public class MetaAhorroController {
    
    @Autowired
    private MetaAhorroService metaAhorroService;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @GetMapping
    public ResponseEntity<List<MetaAhorroModel>> findAll() {
        return ResponseEntity.ok(metaAhorroService.findAll());
    }
    
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<MetaAhorroModel>> findByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(metaAhorroService.findByUsuario(idUsuario));
    }
    
    @GetMapping("/usuario/uid/{uid}")
    public ResponseEntity<List<MetaAhorroModel>> findByUsuarioUid(@PathVariable UUID uid) {
        return ResponseEntity.ok(metaAhorroService.findByUsuarioUid(uid));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MetaAhorroModel> findById(@PathVariable Long id) {
        return metaAhorroService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<MetaAhorroModel> create(@RequestBody MetaAhorroModel metaAhorro) {
        return ResponseEntity.status(HttpStatus.CREATED).body(metaAhorroService.create(metaAhorro));
    }
    
    @PostMapping("/usuario/uid/{uid}")
    public ResponseEntity<?> createByUid(@PathVariable UUID uid, @RequestBody MetaAhorroModel metaAhorro) {
        Optional<usuarioModel> usuario = usuarioService.findByUid(uid);
        
        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado");
        }
        
        metaAhorro.setIdUsuario(usuario.get().getId());
        MetaAhorroModel createdMeta = metaAhorroService.create(metaAhorro);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMeta);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MetaAhorroModel> editById(@PathVariable Long id, @RequestBody MetaAhorroModel metaAhorro) {
        return metaAhorroService.editById(id, metaAhorro)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/agregar-cantidad")
    public ResponseEntity<?> agregarCantidad(@PathVariable Long id, @RequestBody Double cantidad) {
        Optional<MetaAhorroModel> metaOptional = metaAhorroService.findById(id);
        
        if (metaOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Meta de ahorro no encontrada");
        }
        
        if (cantidad == null || cantidad < 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La cantidad debe ser mayor o igual a 0");
        }
        
        MetaAhorroModel meta = metaOptional.get();
        Double nuevaCantidad = meta.getCantidadActual() + cantidad;
        
        // No permitir que exceda el objetivo
        if (nuevaCantidad > meta.getCantidadObjetivo()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("La cantidad total no puede exceder el objetivo de la meta");
        }
        
        meta.setCantidadActual(nuevaCantidad);
        MetaAhorroModel metaActualizada = metaAhorroService.create(meta);
        
        return ResponseEntity.ok(metaActualizada);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (metaAhorroService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}