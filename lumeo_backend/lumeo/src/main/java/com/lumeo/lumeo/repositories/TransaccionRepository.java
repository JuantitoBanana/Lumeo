package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.TransaccionModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface TransaccionRepository extends JpaRepository<TransaccionModel, Long> {
    
    /**
     * Busca todas las transacciones de un usuario específico
     * @param idUsuario ID del usuario
     * @return Lista de transacciones del usuario
     */
    List<TransaccionModel> findByIdUsuario(Long idUsuario);
    
    /**
     * Busca transacciones de un usuario en un mes y año específicos
     * @param idUsuario ID del usuario
     * @param startDate Fecha de inicio del mes
     * @param endDate Fecha de fin del mes
     * @return Lista de transacciones del mes
     */
    @Query("SELECT t FROM TransaccionModel t WHERE t.idUsuario = :idUsuario AND t.fechaTransaccion >= :startDate AND t.fechaTransaccion <= :endDate")
    List<TransaccionModel> findByIdUsuarioAndFechaBetween(@Param("idUsuario") Long idUsuario, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * Busca los últimos 5 gastos de un usuario (tipo transacción = 2)
     * @param idUsuario ID del usuario
     * @return Lista de los últimos 5 gastos ordenados por fecha descendente
     */
    @Query("SELECT t FROM TransaccionModel t WHERE t.idUsuario = :idUsuario AND t.idTipo = 2 ORDER BY t.fechaTransaccion DESC")
    List<TransaccionModel> findUltimosGastosByIdUsuario(@Param("idUsuario") Long idUsuario);
}