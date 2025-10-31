package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.services.UsuarioService;
import com.lumeo.lumeo.services.ResumenFinancieroService;
import com.lumeo.lumeo.services.GraficosService;
import com.lumeo.lumeo.dtos.ResumenFinancieroDTO;
import com.lumeo.lumeo.dtos.GastoPorCategoriaDTO;
import com.lumeo.lumeo.dtos.EvolucionMensualDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    
    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private ResumenFinancieroService resumenFinancieroService;
    
    @Autowired
    private GraficosService graficosService;
    
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
    
    @GetMapping("/{id}/resumen-financiero")
    public ResponseEntity<ResumenFinancieroDTO> getResumenFinanciero(@PathVariable Long id) {
        try {
            ResumenFinancieroDTO resumen = resumenFinancieroService.calcularResumenFinanciero(id);
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            // Si hay error, devolver datos vacíos por defecto
            ResumenFinancieroDTO resumenVacio = new ResumenFinancieroDTO(
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                "EUR",
                "€",
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO
            );
            return ResponseEntity.ok(resumenVacio);
        }
    }
    
    @GetMapping("/{id}/gastos-por-categoria")
    public ResponseEntity<List<GastoPorCategoriaDTO>> getGastosPorCategoria(@PathVariable Long id) {
        try {
            List<GastoPorCategoriaDTO> gastos = graficosService.obtenerGastosPorCategoria(id);
            return ResponseEntity.ok(gastos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}/evolucion-mensual")
    public ResponseEntity<List<EvolucionMensualDTO>> getEvolucionMensual(
            @PathVariable Long id,
            @RequestParam(defaultValue = "2") int meses) {
        try {
            List<EvolucionMensualDTO> evolucion = graficosService.obtenerEvolucionMensual(id, meses);
            return ResponseEntity.ok(evolucion);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}