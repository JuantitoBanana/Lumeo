package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.AdjuntoModel;
import com.lumeo.lumeo.services.AdjuntoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/adjuntos")
public class AdjuntoController {
    
    @Autowired
    private AdjuntoService adjuntoService;
    
    @GetMapping
    public ResponseEntity<List<AdjuntoModel>> findAll() {
        return ResponseEntity.ok(adjuntoService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AdjuntoModel> findById(@PathVariable Long id) {
        return adjuntoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<AdjuntoModel> create(@RequestBody AdjuntoModel adjunto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adjuntoService.create(adjunto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AdjuntoModel> editById(@PathVariable Long id, @RequestBody AdjuntoModel adjunto) {
        return adjuntoService.editById(id, adjunto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (adjuntoService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}