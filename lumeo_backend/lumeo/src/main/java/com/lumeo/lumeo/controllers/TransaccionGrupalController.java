package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.dtos.CrearTransaccionGrupalDTO;
import com.lumeo.lumeo.dtos.TransaccionGrupalDTO;
import com.lumeo.lumeo.models.TransaccionGrupalModel;
import com.lumeo.lumeo.services.TransaccionGrupalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transacciones-grupales")
public class TransaccionGrupalController {
    
    @Autowired
    private TransaccionGrupalService transaccionGrupalService;
    
    /**
     * Crea una transacción grupal con las transacciones individuales asociadas
     */
    @PostMapping
    public ResponseEntity<TransaccionGrupalModel> crear(@RequestBody CrearTransaccionGrupalDTO dto) {
        TransaccionGrupalModel transaccionGrupal = transaccionGrupalService.crearTransaccionGrupal(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(transaccionGrupal);
    }
    
    /**
     * Obtiene todas las transacciones grupales de un grupo
     * @param idGrupo ID del grupo
     * @param idUsuario ID del usuario que consulta (para conversión de divisa)
     */
    @GetMapping("/grupo/{idGrupo}")
    public ResponseEntity<List<TransaccionGrupalDTO>> findByGrupo(
            @PathVariable Long idGrupo,
            @RequestParam Long idUsuario) {
        List<TransaccionGrupalDTO> transacciones = transaccionGrupalService.findByIdGrupoConvertidas(idGrupo, idUsuario);
        return ResponseEntity.ok(transacciones);
    }
    
    /**
     * Obtiene una transacción grupal por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TransaccionGrupalModel> findById(@PathVariable Long id) {
        return transaccionGrupalService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Obtiene el detalle completo de una transacción grupal con las transacciones individuales
     * @param id ID de la transacción grupal
     * @param idUsuario ID del usuario que consulta (para conversión de divisa)
     */
    @GetMapping("/{id}/detalle")
    public ResponseEntity<TransaccionGrupalDTO> findByIdConDetalle(
            @PathVariable Long id,
            @RequestParam Long idUsuario) {
        TransaccionGrupalDTO transaccion = transaccionGrupalService.findByIdConDetalle(id, idUsuario);
        if (transaccion != null) {
            return ResponseEntity.ok(transaccion);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * Elimina una transacción grupal
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (transaccionGrupalService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
