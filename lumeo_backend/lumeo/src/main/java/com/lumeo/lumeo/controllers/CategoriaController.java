package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.CategoriaModel;
import com.lumeo.lumeo.services.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {
    
    @Autowired
    private CategoriaService categoriaService;
    
    @GetMapping
    public ResponseEntity<List<CategoriaModel>> findAll() {
        return ResponseEntity.ok(categoriaService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CategoriaModel> findById(@PathVariable Long id) {
        return categoriaService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<CategoriaModel> create(@RequestBody CategoriaModel categoria) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaService.create(categoria));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CategoriaModel> editById(@PathVariable Long id, @RequestBody CategoriaModel categoria) {
        return categoriaService.editById(id, categoria)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (categoriaService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Obtiene las categorías disponibles para un usuario específico
     * Incluye categorías públicas y personalizadas del usuario
     */
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<CategoriaModel>> getCategoriasParaUsuario(@PathVariable Long idUsuario) {
        List<CategoriaModel> categorias = categoriaService.getCategoriasDisponiblesParaUsuario(idUsuario);
        return ResponseEntity.ok(categorias);
    }
}