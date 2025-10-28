package com.lumeo.lumeo.controllers;

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
}