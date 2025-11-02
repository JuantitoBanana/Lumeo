package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.UltimoGastoDTO;
import com.lumeo.lumeo.dtos.TransaccionDTO;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import com.lumeo.lumeo.repositories.UsuarioRepository;
import com.lumeo.lumeo.repositories.DivisaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TransaccionService extends GenericService<TransaccionModel, Long> {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
    @Override
    protected JpaRepository<TransaccionModel, Long> getRepository() {
        return transaccionRepository;
    }
    
    /**
     * Override del método create para establecer id_divisa_original automáticamente
     */
    @Override
    public TransaccionModel create(TransaccionModel transaccion) {
        // Si no tiene id_divisa_original, establecer la divisa actual del usuario
        if (transaccion.getIdDivisaOriginal() == null && transaccion.getIdUsuario() != null) {
            Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(transaccion.getIdUsuario());
            if (usuarioOpt.isPresent()) {
                transaccion.setIdDivisaOriginal(usuarioOpt.get().getIdDivisa());
            }
        }
        
        return super.create(transaccion);
    }
    
    /**
     * Obtiene todas las transacciones de un usuario
     * @param idUsuario ID del usuario
     * @return Lista de transacciones del usuario
     */
    public List<TransaccionModel> findByIdUsuario(Long idUsuario) {
        return transaccionRepository.findByIdUsuario(idUsuario);
    }
    
    /**
     * Obtiene todas las transacciones de un usuario con importes convertidos y posición del símbolo
     * @param idUsuario ID del usuario
     * @return Lista de transacciones como DTO con importes convertidos
     */
    public List<TransaccionDTO> findByIdUsuarioConvertidas(Long idUsuario) {
        System.out.println("🔍 Obteniendo transacciones convertidas para usuario: " + idUsuario);
        
        // Obtener la divisa del usuario y su posición de símbolo
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
        
        List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuario(idUsuario);
        
        // Convertir a DTO con importes convertidos
        final String divisaDestino = codigoDivisaUsuario;
        final String posicion = posicionSimbolo;
        List<TransaccionDTO> transaccionesConvertidas = transacciones.stream()
            .map(transaccion -> convertToFullDTO(transaccion, divisaDestino, posicion))
            .collect(Collectors.toList());
        
        System.out.println("✅ Transacciones convertidas: " + transaccionesConvertidas.size());
        return transaccionesConvertidas;
    }
    
    /**
     * Obtiene los últimos 5 gastos de un usuario
     * @param idUsuario ID del usuario
     * @return Lista de los últimos 5 gastos como DTO con importes convertidos
     */
    public List<UltimoGastoDTO> getUltimosGastos(Long idUsuario) {
        System.out.println("🔍 Obteniendo últimos 5 gastos para usuario: " + idUsuario);
        
        // Obtener la divisa del usuario y su posición de símbolo
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
        
        List<TransaccionModel> gastos = transaccionRepository.findUltimosGastosByIdUsuario(idUsuario);
        
        // Limitar a 5 resultados y convertir a DTO
        final String divisaDestino = codigoDivisaUsuario;
        final String posicion = posicionSimbolo;
        List<UltimoGastoDTO> ultimosGastos = gastos.stream()
            .limit(5)
            .map(transaccion -> convertToDTO(transaccion, divisaDestino, posicion))
            .collect(Collectors.toList());
        
        System.out.println("✅ Últimos gastos encontrados: " + ultimosGastos.size());
        return ultimosGastos;
    }
    
    /**
     * Convierte TransaccionModel a UltimoGastoDTO con conversión de divisa
     */
    private UltimoGastoDTO convertToDTO(TransaccionModel transaccion, String codigoDivisaDestino, String posicionSimbolo) {
        UltimoGastoDTO dto = new UltimoGastoDTO();
        dto.setId(transaccion.getId());
        dto.setTitulo(transaccion.getTitulo());
        dto.setFechaTransaccion(transaccion.getFechaTransaccion());
        dto.setNota(transaccion.getNota());
        dto.setIdCategoria(transaccion.getIdCategoria());
        dto.setPosicionSimbolo(posicionSimbolo);
        
        // Convertir importe desde divisa original
        Double importeOriginal = transaccion.getImporte();
        Double importeConvertido = importeOriginal;
        
        if (transaccion.getIdDivisaOriginal() != null) {
            Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
            if (divisaOriginalOpt.isPresent()) {
                String isoOriginal = divisaOriginalOpt.get().getIso();
                importeConvertido = conversionDivisaService.convertirMonto(
                    importeOriginal,
                    isoOriginal,
                    codigoDivisaDestino
                );
            }
        }
        
        dto.setImporte(importeConvertido);
        dto.setFechaTransaccion(transaccion.getFechaTransaccion());
        dto.setNota(transaccion.getNota());
        dto.setIdCategoria(transaccion.getIdCategoria());
        
        // Cargar información de la categoría si existe (evitando lazy loading issues)
        if (transaccion.getCategoria() != null) {
            try {
                dto.setNombreCategoria(transaccion.getCategoria().getNombre());
                dto.setIconoCategoria(transaccion.getCategoria().getIcono());
                dto.setColorCategoria(transaccion.getCategoria().getColor());
            } catch (Exception e) {
                // Si falla al cargar la categoría, continuar sin ella
                System.out.println("⚠️ No se pudo cargar la categoría para transacción " + transaccion.getId());
            }
        }
        
        return dto;
    }
    
    /**
     * Convierte TransaccionModel a TransaccionDTO completo con conversión de divisa
     */
    private TransaccionDTO convertToFullDTO(TransaccionModel transaccion, String codigoDivisaDestino, String posicionSimbolo) {
        TransaccionDTO dto = new TransaccionDTO();
        dto.setId(transaccion.getId());
        dto.setTitulo(transaccion.getTitulo());
        dto.setFechaTransaccion(transaccion.getFechaTransaccion());
        dto.setNota(transaccion.getNota());
        dto.setIdUsuario(transaccion.getIdUsuario());
        dto.setIdCategoria(transaccion.getIdCategoria());
        dto.setIdGrupo(transaccion.getIdGrupo());
        dto.setIdTipo(transaccion.getIdTipo());
        dto.setIdEstado(transaccion.getIdEstado());
        dto.setIdAdjunto(transaccion.getIdAdjunto());
        dto.setPosicionSimbolo(posicionSimbolo);
        
        // Convertir importe desde divisa original
        Double importeOriginal = transaccion.getImporte();
        Double importeConvertido = importeOriginal;
        
        if (transaccion.getIdDivisaOriginal() != null) {
            Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
            if (divisaOriginalOpt.isPresent()) {
                String isoOriginal = divisaOriginalOpt.get().getIso();
                importeConvertido = conversionDivisaService.convertirMonto(
                    importeOriginal,
                    isoOriginal,
                    codigoDivisaDestino
                );
            }
        }
        
        dto.setImporte(importeConvertido);
        
        // Cargar información de las relaciones si existen (evitando lazy loading issues)
        try {
            if (transaccion.getCategoria() != null) {
                dto.setCategoria(transaccion.getCategoria());
            }
            if (transaccion.getGrupo() != null) {
                dto.setGrupo(transaccion.getGrupo());
            }
            if (transaccion.getTipoTransaccion() != null) {
                dto.setTipoTransaccion(transaccion.getTipoTransaccion());
            }
            if (transaccion.getEstadoTransaccion() != null) {
                dto.setEstadoTransaccion(transaccion.getEstadoTransaccion());
            }
        } catch (Exception e) {
            System.out.println("⚠️ No se pudieron cargar algunas relaciones para transacción " + transaccion.getId());
        }
        
        return dto;
    }
}