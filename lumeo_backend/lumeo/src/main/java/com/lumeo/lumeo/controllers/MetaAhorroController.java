package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.services.MetaAhorroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/metas-ahorro")
public class MetaAhorroController {
    
    @Autowired
    private MetaAhorroService metaAhorroService;
    
    @GetMapping
    public ResponseEntity<List<MetaAhorroModel>> findAll() {
        return ResponseEntity.ok(metaAhorroService.findAll());
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
    
    @PutMapping("/{id}")
    public ResponseEntity<MetaAhorroModel> editById(@PathVariable Long id, @RequestBody MetaAhorroModel metaAhorro) {
        return metaAhorroService.editById(id, metaAhorro)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (metaAhorroService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}