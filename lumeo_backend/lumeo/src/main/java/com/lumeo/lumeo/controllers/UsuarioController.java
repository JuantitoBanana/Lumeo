package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.services.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    
    @Autowired
    private UsuarioService usuarioService;
    
    @GetMapping
    public ResponseEntity<List<usuarioModel>> findAll() {
        return ResponseEntity.ok(usuarioService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<usuarioModel> findById(@PathVariable Long id) {
        return usuarioService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<usuarioModel> create(@RequestBody usuarioModel usuario) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioService.create(usuario));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<usuarioModel> editById(@PathVariable Long id, @RequestBody usuarioModel usuario) {
        return usuarioService.editById(id, usuario)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (usuarioService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}