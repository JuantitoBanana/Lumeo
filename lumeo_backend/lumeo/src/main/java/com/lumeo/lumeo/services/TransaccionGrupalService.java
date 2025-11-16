package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.CrearTransaccionGrupalDTO;
import com.lumeo.lumeo.dtos.TransaccionDTO;
import com.lumeo.lumeo.dtos.TransaccionGrupalDTO;
import com.lumeo.lumeo.models.*;
import com.lumeo.lumeo.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransaccionGrupalService extends GenericService<TransaccionGrupalModel, Long> {
    
    @Autowired
    private TransaccionGrupalRepository transaccionGrupalRepository;
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Autowired
    private GrupoRepository grupoRepository;
    
    @Autowired
    private CategoriaRepository categoriaRepository;
    
    @Autowired
    private TipoTransaccionRepository tipoTransaccionRepository;
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
    @Override
    protected JpaRepository<TransaccionGrupalModel, Long> getRepository() {
        return transaccionGrupalRepository;
    }
    
    /**
     * Crea una transacción grupal junto con las transacciones individuales asociadas
     * @param dto DTO con los datos de la transacción grupal
     * @return La transacción grupal creada con las transacciones individuales
     */
    @Transactional
    public TransaccionGrupalModel crearTransaccionGrupal(CrearTransaccionGrupalDTO dto) {
        System.out.println("📝 Creando transacción grupal: " + dto.getTitulo());
        
        // 1. Obtener la divisa del grupo (usar la del primer usuario)
        Long idDivisaOriginal = null;
        if (dto.getTransaccionesIndividuales() != null && !dto.getTransaccionesIndividuales().isEmpty()) {
            Long primerUsuarioId = dto.getTransaccionesIndividuales().get(0).getIdUsuario();
            Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(primerUsuarioId);
            if (usuarioOpt.isPresent()) {
                idDivisaOriginal = usuarioOpt.get().getIdDivisa();
            }
        }
        
        // 2. Crear la transacción grupal
        TransaccionGrupalModel transaccionGrupal = new TransaccionGrupalModel();
        transaccionGrupal.setTitulo(dto.getTitulo());
        transaccionGrupal.setImporte(dto.getImporteTotal());
        transaccionGrupal.setFechaTransaccion(dto.getFechaTransaccion());
        transaccionGrupal.setNota(dto.getNota());
        transaccionGrupal.setIdGrupo(dto.getIdGrupo());
        transaccionGrupal.setIdCategoria(dto.getIdCategoria());
        transaccionGrupal.setIdTipo(dto.getIdTipo());
        transaccionGrupal.setIdAdjunto(dto.getIdAdjunto());
        transaccionGrupal.setIdDivisaOriginal(idDivisaOriginal);
        
        // Guardar la transacción grupal
        transaccionGrupal = transaccionGrupalRepository.save(transaccionGrupal);
        System.out.println("✅ Transacción grupal creada con ID: " + transaccionGrupal.getId());
        
        // 3. Crear las transacciones individuales vinculadas
        Long transaccionGrupalId = transaccionGrupal.getId();
        for (CrearTransaccionGrupalDTO.TransaccionIndividualDTO transIndDto : dto.getTransaccionesIndividuales()) {
            TransaccionModel transaccionIndividual = new TransaccionModel();
            transaccionIndividual.setTitulo(dto.getTitulo());
            transaccionIndividual.setImporte(transIndDto.getImporte());
            transaccionIndividual.setFechaTransaccion(dto.getFechaTransaccion());
            transaccionIndividual.setNota(dto.getNota());
            transaccionIndividual.setIdUsuario(transIndDto.getIdUsuario());
            transaccionIndividual.setIdCategoria(dto.getIdCategoria());
            transaccionIndividual.setIdTransaccionGrupal(transaccionGrupalId);
            transaccionIndividual.setIdTipo(dto.getIdTipo());
            transaccionIndividual.setIdEstado(1L); // Estado pendiente
            transaccionIndividual.setIdAdjunto(dto.getIdAdjunto());
            
            // Establecer la divisa original del usuario
            Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(transIndDto.getIdUsuario());
            if (usuarioOpt.isPresent()) {
                transaccionIndividual.setIdDivisaOriginal(usuarioOpt.get().getIdDivisa());
            }
            
            transaccionRepository.save(transaccionIndividual);
            System.out.println("  ✓ Transacción individual creada para usuario: " + transIndDto.getIdUsuario());
        }
        
        System.out.println("🎉 Transacción grupal completada con " + dto.getTransaccionesIndividuales().size() + " transacciones individuales");
        return transaccionGrupal;
    }
    
    /**
     * Obtiene todas las transacciones grupales de un grupo con importes convertidos
     * @param idGrupo ID del grupo
     * @param idUsuario ID del usuario que consulta (para conversión de divisa)
     * @return Lista de transacciones grupales como DTO
     */
    public List<TransaccionGrupalDTO> findByIdGrupoConvertidas(Long idGrupo, Long idUsuario) {
        System.out.println("🔍 Obteniendo transacciones grupales para grupo: " + idGrupo);
        
        // Obtener la divisa del usuario
        String codigoDivisaUsuario = "EUR";
        String posicionSimbolo = "DESPUES";
        Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(idUsuario);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuarioOpt.get().getIdDivisa());
            if (divisaOpt.isPresent()) {
                codigoDivisaUsuario = divisaOpt.get().getIso();
                posicionSimbolo = divisaOpt.get().getPosicionSimbolo() != null ? divisaOpt.get().getPosicionSimbolo() : "DESPUES";
            }
        }
        
        List<TransaccionGrupalModel> transaccionesGrupales = transaccionGrupalRepository.findByIdGrupo(idGrupo);
        
        // Convertir a DTO
        final String divisaDestino = codigoDivisaUsuario;
        final String posicion = posicionSimbolo;
        
        List<TransaccionGrupalDTO> dtos = transaccionesGrupales.stream()
            .map(tg -> convertToDTO(tg, divisaDestino, posicion))
            .collect(Collectors.toList());
        
        System.out.println("✅ Transacciones grupales obtenidas: " + dtos.size());
        return dtos;
    }
    
    /**
     * Convierte una TransaccionGrupalModel a DTO con importes convertidos
     */
    private TransaccionGrupalDTO convertToDTO(TransaccionGrupalModel model, String divisaDestino, String posicionSimbolo) {
        TransaccionGrupalDTO dto = new TransaccionGrupalDTO();
        dto.setId(model.getId());
        dto.setTitulo(model.getTitulo());
        dto.setFechaTransaccion(model.getFechaTransaccion());
        dto.setNota(model.getNota());
        dto.setIdGrupo(model.getIdGrupo());
        dto.setIdCategoria(model.getIdCategoria());
        dto.setIdTipo(model.getIdTipo());
        dto.setIdAdjunto(model.getIdAdjunto());
        dto.setIdDivisaOriginal(model.getIdDivisaOriginal());
        dto.setPosicionSimbolo(posicionSimbolo);
        
        // Convertir importe
        Double importeOriginal = model.getImporte() != null ? model.getImporte() : 0.0;
        dto.setImporteOriginal(importeOriginal);
        
        if (model.getIdDivisaOriginal() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(model.getIdDivisaOriginal());
            if (divisaOpt.isPresent()) {
                String divisaOrigen = divisaOpt.get().getIso();
                dto.setCodigoDivisaOriginal(divisaOrigen);
                
                double importeConvertido = conversionDivisaService.convertirMonto(
                    importeOriginal, divisaOrigen, divisaDestino
                );
                dto.setImporte(importeConvertido);
            } else {
                dto.setImporte(importeOriginal);
            }
        } else {
            dto.setImporte(importeOriginal);
        }
        
        // Agregar nombres de relaciones
        if (model.getIdGrupo() != null) {
            grupoRepository.findById(model.getIdGrupo()).ifPresent(g -> dto.setNombreGrupo(g.getNombre()));
        }
        
        if (model.getIdCategoria() != null) {
            categoriaRepository.findById(model.getIdCategoria()).ifPresent(c -> dto.setNombreCategoria(c.getNombre()));
        }
        
        if (model.getIdTipo() != null) {
            tipoTransaccionRepository.findById(model.getIdTipo()).ifPresent(t -> dto.setNombreTipo(t.getDescripcion()));
        }
        
        return dto;
    }
    
    /**
     * Obtiene una transacción grupal con sus transacciones individuales y nombres de usuarios
     * @param id ID de la transacción grupal
     * @param idUsuario ID del usuario que consulta (para conversión de divisa)
     * @return Transacción grupal con transacciones individuales
     */
    public TransaccionGrupalDTO findByIdConDetalle(Long id, Long idUsuario) {
        System.out.println("🔍 Obteniendo detalle de transacción grupal: " + id);
        
        // Obtener la divisa del usuario
        String codigoDivisaUsuario = "EUR";
        String posicionSimbolo = "DESPUES";
        Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(idUsuario);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuarioOpt.get().getIdDivisa());
            if (divisaOpt.isPresent()) {
                codigoDivisaUsuario = divisaOpt.get().getIso();
                posicionSimbolo = divisaOpt.get().getPosicionSimbolo() != null ? divisaOpt.get().getPosicionSimbolo() : "DESPUES";
            }
        }
        
        // Obtener la transacción grupal
        Optional<TransaccionGrupalModel> tgOpt = transaccionGrupalRepository.findById(id);
        if (!tgOpt.isPresent()) {
            return null;
        }
        
        TransaccionGrupalModel tg = tgOpt.get();
        final String divisaDestino = codigoDivisaUsuario;
        final String posicion = posicionSimbolo;
        
        // Convertir a DTO
        TransaccionGrupalDTO dto = convertToDTO(tg, divisaDestino, posicion);
        
        // Obtener transacciones individuales
        List<TransaccionModel> transaccionesIndividuales = transaccionRepository.findByIdTransaccionGrupal(id);
        
        // Convertir transacciones individuales a DTO con nombres de usuario
        List<TransaccionDTO> transaccionesDTO = transaccionesIndividuales.stream()
            .map(t -> convertTransaccionToDTO(t, divisaDestino, posicion))
            .collect(Collectors.toList());
        
        dto.setTransaccionesIndividuales(transaccionesDTO);
        
        System.out.println("✅ Detalle obtenido con " + transaccionesDTO.size() + " transacciones individuales");
        return dto;
    }
    
    /**
     * Convierte TransaccionModel a TransaccionDTO con nombre de usuario
     */
    private TransaccionDTO convertTransaccionToDTO(TransaccionModel t, String divisaDestino, String posicionSimbolo) {
        TransaccionDTO dto = new TransaccionDTO();
        dto.setId(t.getId());
        dto.setTitulo(t.getTitulo());
        dto.setFechaTransaccion(t.getFechaTransaccion());
        dto.setNota(t.getNota());
        dto.setIdUsuario(t.getIdUsuario());
        dto.setIdCategoria(t.getIdCategoria());
        dto.setIdTipo(t.getIdTipo());
        dto.setIdEstado(t.getIdEstado());
        dto.setIdAdjunto(t.getIdAdjunto());
        dto.setIdDestinatario(t.getIdDestinatario());
        dto.setImporteDestinatario(t.getImporteDestinatario());
        dto.setPosicionSimbolo(posicionSimbolo);
        
        // Convertir importe
        Double importeOriginal = t.getImporte() != null ? t.getImporte() : 0.0;
        if (t.getIdDivisaOriginal() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(t.getIdDivisaOriginal());
            if (divisaOpt.isPresent()) {
                String divisaOrigen = divisaOpt.get().getIso();
                double importeConvertido = conversionDivisaService.convertirMonto(
                    importeOriginal, divisaOrigen, divisaDestino
                );
                dto.setImporte(importeConvertido);
            } else {
                dto.setImporte(importeOriginal);
            }
        } else {
            dto.setImporte(importeOriginal);
        }
        
        // Agregar información de usuario (nombre de usuario, nombre y apellidos)
        if (t.getIdUsuario() != null) {
            usuarioRepository.findById(t.getIdUsuario()).ifPresent(u -> {
                dto.setNombreUsuario(u.getNombreUsuario());
                dto.setNombre(u.getNombre());
                dto.setApellido(u.getApellido());
            });
        }
        
        // Cargar relaciones
        try {
            if (t.getCategoria() != null) {
                dto.setCategoria(t.getCategoria());
            }
            if (t.getTipoTransaccion() != null) {
                dto.setTipoTransaccion(t.getTipoTransaccion());
            }
            if (t.getEstadoTransaccion() != null) {
                dto.setEstadoTransaccion(t.getEstadoTransaccion());
            }
        } catch (Exception e) {
            System.out.println("⚠️ No se pudieron cargar algunas relaciones para transacción " + t.getId());
        }
        
        return dto;
    }
}
