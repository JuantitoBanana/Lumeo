package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.EstadoTransaccionModel;
import com.lumeo.lumeo.services.EstadoTransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/estados-transaccion")
public class EstadoTransaccionController {
    
    @Autowired
    private EstadoTransaccionService estadoTransaccionService;
    
    @GetMapping
    public ResponseEntity<List<EstadoTransaccionModel>> findAll() {
        return ResponseEntity.ok(estadoTransaccionService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EstadoTransaccionModel> findById(@PathVariable Long id) {
        return estadoTransaccionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<EstadoTransaccionModel> create(@RequestBody EstadoTransaccionModel estadoTransaccion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(estadoTransaccionService.create(estadoTransaccion));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<EstadoTransaccionModel> editById(@PathVariable Long id, @RequestBody EstadoTransaccionModel estadoTransaccion) {
        return estadoTransaccionService.editById(id, estadoTransaccion)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (estadoTransaccionService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}