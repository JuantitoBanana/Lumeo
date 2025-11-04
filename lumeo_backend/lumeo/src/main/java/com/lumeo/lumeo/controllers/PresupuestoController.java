package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.PresupuestoModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.dtos.PresupuestoDTO;
import com.lumeo.lumeo.services.PresupuestoService;
import com.lumeo.lumeo.services.UsuarioService;
import com.lumeo.lumeo.services.TransaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/presupuestos")
public class PresupuestoController {
    
    @Autowired
    private PresupuestoService presupuestoService;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private TransaccionService transaccionService;
    
    @GetMapping
    public ResponseEntity<List<PresupuestoModel>> findAll() {
        return ResponseEntity.ok(presupuestoService.findAll());
    }
    
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<PresupuestoModel>> findByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(presupuestoService.findByUsuario(idUsuario));
    }
    
    @GetMapping("/usuario/uid/{uid}")
    public ResponseEntity<List<PresupuestoDTO>> findByUsuarioUid(@PathVariable UUID uid) {
        List<PresupuestoModel> presupuestos = presupuestoService.findByUsuarioUid(uid);
        
        List<PresupuestoDTO> presupuestosConGastos = presupuestos.stream().map(presupuesto -> {
            // Convertir mes de nombre a número
            Integer mesNumero = convertirMesANumero(presupuesto.getMes());
            Integer anioNumero = Integer.parseInt(presupuesto.getAnio());
            
            // Calcular total de gastos del mes/año
            Double totalGastos = transaccionService.calcularGastosPorMesAnio(
                presupuesto.getIdUsuario(),
                mesNumero,
                anioNumero
            );
            
            PresupuestoDTO dto = new PresupuestoDTO();
            dto.setId(presupuesto.getId());
            dto.setMes(presupuesto.getMes());
            dto.setAnio(presupuesto.getAnio());
            dto.setCantidad(presupuesto.getCantidad());
            dto.setTotalGastos(totalGastos);
            dto.setIdUsuario(presupuesto.getIdUsuario());
            dto.setFechaCreacion(presupuesto.getFechaCreacion());
            dto.setFechaModificacion(presupuesto.getFechaModificacion());
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(presupuestosConGastos);
    }
    
    /**
     * Convierte el nombre del mes en español a su número correspondiente
     */
    private Integer convertirMesANumero(String mes) {
        switch (mes.toLowerCase()) {
            case "enero": return 1;
            case "febrero": return 2;
            case "marzo": return 3;
            case "abril": return 4;
            case "mayo": return 5;
            case "junio": return 6;
            case "julio": return 7;
            case "agosto": return 8;
            case "septiembre": return 9;
            case "octubre": return 10;
            case "noviembre": return 11;
            case "diciembre": return 12;
            default: return 1; // Default a enero si no reconoce
        }
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
    
    @PostMapping("/usuario/uid/{uid}")
    public ResponseEntity<?> createByUid(@PathVariable UUID uid, @RequestBody PresupuestoModel presupuesto) {
        Optional<usuarioModel> usuario = usuarioService.findByUid(uid);
        
        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado");
        }
        
        presupuesto.setIdUsuario(usuario.get().getId());
        
        PresupuestoModel createdPresupuesto = presupuestoService.create(presupuesto);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPresupuesto);
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