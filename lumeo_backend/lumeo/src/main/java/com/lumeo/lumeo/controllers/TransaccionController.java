package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.services.TransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transacciones")
public class TransaccionController {
    
    @Autowired
    private TransaccionService transaccionService;
    
    @GetMapping
    public ResponseEntity<List<TransaccionModel>> findAll() {
        return ResponseEntity.ok(transaccionService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TransaccionModel> findById(@PathVariable Long id) {
        return transaccionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<TransaccionModel> create(@RequestBody TransaccionModel transaccion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionService.create(transaccion));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TransaccionModel> editById(@PathVariable Long id, @RequestBody TransaccionModel transaccion) {
        return transaccionService.editById(id, transaccion)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (transaccionService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}