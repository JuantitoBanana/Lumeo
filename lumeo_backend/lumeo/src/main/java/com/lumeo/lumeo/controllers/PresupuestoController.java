package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.PresupuestoModel;
import com.lumeo.lumeo.services.PresupuestoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {
    
    @Autowired
    private PresupuestoService presupuestoService;
    
    @GetMapping
    public ResponseEntity<List<PresupuestoModel>> findAll() {
        return ResponseEntity.ok(presupuestoService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PresupuestoModel> findById(@PathVariable Long id) {
        return presupuestoService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PresupuestoModel> create(@RequestBody PresupuestoModel presupuesto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(presupuestoService.create(presupuesto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PresupuestoModel> editById(@PathVariable Long id, @RequestBody PresupuestoModel presupuesto) {
        return presupuestoService.editById(id, presupuesto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (presupuestoService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}