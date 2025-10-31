package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.UltimoGastoDTO;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransaccionService extends GenericService<TransaccionModel, Long> {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Override
    protected JpaRepository<TransaccionModel, Long> getRepository() {
        return transaccionRepository;
    }
    
    /**
     * Obtiene los últimos 5 gastos de un usuario
     * @param idUsuario ID del usuario
     * @return Lista de los últimos 5 gastos como DTO
     */
    public List<UltimoGastoDTO> getUltimosGastos(Long idUsuario) {
        System.out.println("🔍 Obteniendo últimos 5 gastos para usuario: " + idUsuario);
        List<TransaccionModel> gastos = transaccionRepository.findUltimosGastosByIdUsuario(idUsuario);
        
        // Limitar a 5 resultados y convertir a DTO
        List<UltimoGastoDTO> ultimosGastos = gastos.stream()
            .limit(5)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
        
        System.out.println("✅ Últimos gastos encontrados: " + ultimosGastos.size());
        return ultimosGastos;
    }
    
    /**
     * Convierte TransaccionModel a UltimoGastoDTO
     */
    private UltimoGastoDTO convertToDTO(TransaccionModel transaccion) {
        UltimoGastoDTO dto = new UltimoGastoDTO();
        dto.setId(transaccion.getId());
        dto.setTitulo(transaccion.getTitulo());
        dto.setImporte(transaccion.getImporte());
        dto.setFechaTransaccion(transaccion.getFechaTransaccion());
        dto.setNota(transaccion.getNota());
        dto.setIdCategoria(transaccion.getIdCategoria());
        
        // Cargar información de la categoría si existe (evitando lazy loading issues)
        if (transaccion.getCategoria() != null) {
            try {
                dto.setNombreCategoria(transaccion.getCategoria().getNombre());
                // Por ahora, icono y color serán null (se pueden agregar después al modelo)
                dto.setIconoCategoria(null);
                dto.setColorCategoria(null);
            } catch (Exception e) {
                // Si falla al cargar la categoría, continuar sin ella
                System.out.println("⚠️ No se pudo cargar la categoría para transacción " + transaccion.getId());
            }
        }
        
        return dto;
    }
}