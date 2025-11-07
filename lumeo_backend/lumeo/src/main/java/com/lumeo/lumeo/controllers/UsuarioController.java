package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.services.UsuarioService;
import com.lumeo.lumeo.services.ResumenFinancieroService;
import com.lumeo.lumeo.services.GraficosService;
import com.lumeo.lumeo.services.ConversionDivisaService;
import com.lumeo.lumeo.dtos.ResumenFinancieroDTO;
import com.lumeo.lumeo.dtos.GastoPorCategoriaDTO;
import com.lumeo.lumeo.dtos.EvolucionMensualDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
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
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
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
    
    @GetMapping("/uid/{uid}")
    public ResponseEntity<usuarioModel> findByUid(@PathVariable String uid) {
        try {
            java.util.UUID uuid = java.util.UUID.fromString(uid);
            return usuarioService.findByUid(uuid)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/nombre-usuario/{nombreUsuario}")
    public ResponseEntity<usuarioModel> findByNombreUsuario(@PathVariable String nombreUsuario) {
        Optional<usuarioModel> usuario = usuarioService.findByNombreUsuario(nombreUsuario);
        if (usuario.isPresent()) {
            return ResponseEntity.ok(usuario.get());
        } else {
            // Devolver 200 con null en lugar de 404 para evitar errores en el frontend
            return ResponseEntity.ok(null);
        }
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
    
    @PutMapping("/uid/{uid}")
    public ResponseEntity<usuarioModel> editByUid(@PathVariable String uid, @RequestBody usuarioModel usuario) {
        try {
            java.util.UUID uuid = java.util.UUID.fromString(uid);
            Optional<usuarioModel> usuarioExistente = usuarioService.findByUid(uuid);
            
            if (usuarioExistente.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            usuarioModel usuarioActual = usuarioExistente.get();
            Long idDivisaAnterior = usuarioActual.getIdDivisa();
            
            // Actualizar solo los campos que no son null
            if (usuario.getNombre() != null) {
                usuarioActual.setNombre(usuario.getNombre());
            }
            if (usuario.getApellido() != null) {
                usuarioActual.setApellido(usuario.getApellido());
            }
            if (usuario.getEmail() != null) {
                usuarioActual.setEmail(usuario.getEmail());
            }
            
            // Si se está cambiando la divisa, convertir todos los montos
            if (usuario.getIdDivisa() != null && !usuario.getIdDivisa().equals(idDivisaAnterior)) {
                Long idDivisaNueva = usuario.getIdDivisa();
                
                // Si el usuario no tenía divisa asignada, usar EUR (id=1) como default
                if (idDivisaAnterior == null) {
                    idDivisaAnterior = 1L; // EUR por defecto
                }
                
                System.out.println("🔄 Convirtiendo montos del usuario " + usuarioActual.getId() + 
                                 " de divisa " + idDivisaAnterior + " a " + idDivisaNueva);
                
                // Convertir todos los montos del usuario
                conversionDivisaService.convertirTodosMontosUsuario(
                    usuarioActual.getId(), 
                    idDivisaAnterior, 
                    idDivisaNueva
                );
                
                usuarioActual.setIdDivisa(idDivisaNueva);
            }
            
            usuarioModel usuarioActualizado = usuarioService.create(usuarioActual);
            return ResponseEntity.ok(usuarioActualizado);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("Error al actualizar usuario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
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
                "DESPUES",
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