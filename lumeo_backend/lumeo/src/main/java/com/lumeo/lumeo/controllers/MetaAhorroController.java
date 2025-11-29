package com.lumeo.lumeo.controllers;

import com.lumeo.lumeo.models.MetaAhorroModel;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.dtos.MetaAhorroDTO;
import com.lumeo.lumeo.services.MetaAhorroService;
import com.lumeo.lumeo.services.TransaccionService;
import com.lumeo.lumeo.services.UsuarioService;
import com.lumeo.lumeo.services.ConversionDivisaService;
import com.lumeo.lumeo.repositories.DivisaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/metas-ahorro")
public class MetaAhorroController {
    
    @Autowired
    private MetaAhorroService metaAhorroService;
    
    @Autowired
    private TransaccionService transaccionService;
    
    @Autowired
    private UsuarioService usuarioService;
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @GetMapping
    public ResponseEntity<List<MetaAhorroModel>> findAll() {
        return ResponseEntity.ok(metaAhorroService.findAll());
    }
    
    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<MetaAhorroModel>> findByUsuario(@PathVariable Long idUsuario) {
        return ResponseEntity.ok(metaAhorroService.findByUsuario(idUsuario));
    }
    
    @GetMapping("/usuario/uid/{uid}")
    public ResponseEntity<List<MetaAhorroDTO>> findByUsuarioUid(@PathVariable UUID uid) {
        // Obtener el usuario para saber su divisa actual
        Optional<usuarioModel> usuarioOpt = usuarioService.findByUid(uid);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        usuarioModel usuario = usuarioOpt.get();
        String codigoDivisaUsuario = "EUR"; // Por defecto
        String posicionSimbolo = "DESPUES"; // Por defecto
        
        if (usuario.getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuario.getIdDivisa());
            if (divisaOpt.isPresent()) {
                codigoDivisaUsuario = divisaOpt.get().getIso();
                posicionSimbolo = divisaOpt.get().getPosicionSimbolo() != null ? divisaOpt.get().getPosicionSimbolo() : "DESPUES";
            }
        }
        
        // Obtener las metas y convertir las cantidades
        List<MetaAhorroModel> metas = metaAhorroService.findByUsuarioUid(uid);
        
        final String divisaDestino = codigoDivisaUsuario;
        final String posicion = posicionSimbolo;
        List<MetaAhorroDTO> metasConvertidas = metas.stream().map(meta -> {
            // Convertir las cantidades desde la divisa original a la divisa del usuario
            Double cantidadObjetivoConvertida = meta.getCantidadObjetivo();
            Double cantidadActualConvertida = meta.getCantidadActual();
            
            if (meta.getIdDivisaOriginal() != null) {
                Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(meta.getIdDivisaOriginal());
                if (divisaOriginalOpt.isPresent()) {
                    String isoOriginal = divisaOriginalOpt.get().getIso();
                    
                    // Convertir cantidad objetivo
                    cantidadObjetivoConvertida = conversionDivisaService.convertirMonto(
                        meta.getCantidadObjetivo(),
                        isoOriginal,
                        divisaDestino
                    );
                    
                    // Convertir cantidad actual
                    cantidadActualConvertida = conversionDivisaService.convertirMonto(
                        meta.getCantidadActual(),
                        isoOriginal,
                        divisaDestino
                    );
                }
            }
            
            // Crear DTO con valores convertidos y posición del símbolo
            MetaAhorroDTO dto = new MetaAhorroDTO();
            dto.setId(meta.getId());
            dto.setTitulo(meta.getTitulo());
            dto.setCantidadObjetivo(cantidadObjetivoConvertida);
            dto.setCantidadActual(cantidadActualConvertida);
            dto.setIdUsuario(meta.getIdUsuario());
            dto.setIdDivisaOriginal(meta.getIdDivisaOriginal());
            dto.setFechaCreacion(meta.getFechaCreacion());
            dto.setFechaModificacion(meta.getFechaModificacion());
            dto.setPosicionSimbolo(posicion);
            
            return dto;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(metasConvertidas);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MetaAhorroModel> findById(@PathVariable Long id) {
        return metaAhorroService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<MetaAhorroModel> create(@RequestBody MetaAhorroModel metaAhorro) {
        return ResponseEntity.status(HttpStatus.CREATED).body(metaAhorroService.create(metaAhorro));
    }
    
    @PostMapping("/usuario/uid/{uid}")
    public ResponseEntity<?> createByUid(@PathVariable UUID uid, @RequestBody MetaAhorroModel metaAhorro) {
        Optional<usuarioModel> usuario = usuarioService.findByUid(uid);
        
        if (usuario.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado");
        }
        
        metaAhorro.setIdUsuario(usuario.get().getId());
        
        // Establecer la divisa original como la divisa actual del usuario
        if (metaAhorro.getIdDivisaOriginal() == null) {
            metaAhorro.setIdDivisaOriginal(usuario.get().getIdDivisa());
        }
        
        MetaAhorroModel createdMeta = metaAhorroService.create(metaAhorro);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdMeta);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<MetaAhorroModel> editById(@PathVariable Long id, @RequestBody MetaAhorroModel metaAhorro) {
        return metaAhorroService.editById(id, metaAhorro)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/agregar-cantidad")
    public ResponseEntity<?> agregarCantidad(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Optional<MetaAhorroModel> metaOptional = metaAhorroService.findById(id);
        
        if (metaOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Meta de ahorro no encontrada"));
        }
        
        Double cantidad = request.get("cantidad") != null ? 
            Double.parseDouble(request.get("cantidad").toString()) : null;
        
        if (cantidad == null || cantidad <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "La cantidad debe ser mayor a 0"));
        }
        
        MetaAhorroModel meta = metaOptional.get();
        Double nuevaCantidad = meta.getCantidadActual() + cantidad;
        
        // No permitir que exceda el objetivo
        if (nuevaCantidad > meta.getCantidadObjetivo()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "La cantidad total excedería el objetivo de la meta"));
        }
        
        // Actualizar meta
        meta.setCantidadActual(nuevaCantidad);
        metaAhorroService.create(meta);
        
        // Crear transacción como gasto
        TransaccionModel transaccion = new TransaccionModel();
        transaccion.setTitulo("Aporte a " + meta.getTitulo());
        transaccion.setImporte(cantidad);
        transaccion.setFechaTransaccion(LocalDate.now());
        transaccion.setIdUsuario(meta.getIdUsuario());
        transaccion.setIdTipo(2L); // 2 = Gasto
        transaccion.setIdEstado(2L); // 2 = Completado
        transaccionService.create(transaccion);
        
        // Retornar respuesta simple
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Aporte agregado exitosamente");
        response.put("nuevaCantidadActual", nuevaCantidad);
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (metaAhorroService.delete(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}