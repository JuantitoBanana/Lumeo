package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.services.DivisaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/divisas")
public class DivisaController {
    
    @Autowired
    private DivisaService divisaService;
    
    @GetMapping
    public ResponseEntity<List<DivisaModel>> findAll() {
        return ResponseEntity.ok(divisaService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<DivisaModel> findById(@PathVariable Long id) {
        return divisaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<DivisaModel> create(@RequestBody DivisaModel divisa) {
        return ResponseEntity.status(HttpStatus.CREATED).body(divisaService.create(divisa));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DivisaModel> editById(@PathVariable Long id, @RequestBody DivisaModel divisa) {
        return divisaService.editById(id, divisa)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (divisaService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}