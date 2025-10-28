package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.TipoTransaccionModel;
import com.lumeo.lumeo.services.TipoTransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tipos-transaccion")
public class TipoTransaccionController {
    
    @Autowired
    private TipoTransaccionService tipoTransaccionService;
    
    @GetMapping
    public ResponseEntity<List<TipoTransaccionModel>> findAll() {
        return ResponseEntity.ok(tipoTransaccionService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TipoTransaccionModel> findById(@PathVariable Long id) {
        return tipoTransaccionService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<TipoTransaccionModel> create(@RequestBody TipoTransaccionModel tipoTransaccion) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tipoTransaccionService.create(tipoTransaccion));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TipoTransaccionModel> editById(@PathVariable Long id, @RequestBody TipoTransaccionModel tipoTransaccion) {
        return tipoTransaccionService.editById(id, tipoTransaccion)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (tipoTransaccionService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}