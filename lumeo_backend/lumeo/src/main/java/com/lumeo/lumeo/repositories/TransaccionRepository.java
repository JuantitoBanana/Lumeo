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
     * Busca todas las transacciones donde el usuario es creador o destinatario
     * @param idUsuario ID del usuario
     * @param idDestinatario ID del destinatario (mismo que idUsuario)
     * @return Lista de transacciones donde el usuario participa
     */
    @Query("SELECT t FROM TransaccionModel t WHERE t.idUsuario = :idUsuario OR t.idDestinatario = :idDestinatario")
    List<TransaccionModel> findByIdUsuarioOrIdDestinatario(@Param("idUsuario") Long idUsuario, @Param("idDestinatario") Long idDestinatario);
    
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
    
    /**
     * Calcula el total de gastos de un usuario para un mes y año específicos
     * @param idUsuario ID del usuario
     * @param mes Número del mes (1-12)
     * @param anio Año
     * @return Total de gastos del mes/año especificado
     */
    @Query(value = "SELECT COALESCE(SUM(t.importe), 0.0) FROM transaccion t " +
           "WHERE t.id_usuario = :idUsuario " +
           "AND t.id_tipo = 2 " +
           "AND EXTRACT(MONTH FROM t.fecha_transaccion) = :mes " +
           "AND EXTRACT(YEAR FROM t.fecha_transaccion) = :anio", nativeQuery = true)
    Double calcularGastosPorMesAnio(@Param("idUsuario") Long idUsuario, 
                                     @Param("mes") Integer mes, 
                                     @Param("anio") Integer anio);
    
    /**
     * Busca transacciones de un usuario filtradas por mes y año
     * @param idUsuario ID del usuario
     * @param mes Número del mes (1-12)
     * @param anio Año como String
     * @return Lista de transacciones que coinciden con el mes y año
     */
    @Query(value = "SELECT * FROM transaccion t " +
           "WHERE t.id_usuario = :idUsuario " +
           "AND t.id_tipo = 2 " +
           "AND EXTRACT(MONTH FROM t.fecha_transaccion) = :mes " +
           "AND EXTRACT(YEAR FROM t.fecha_transaccion) = :anio " +
           "ORDER BY t.fecha_transaccion DESC", nativeQuery = true)
    List<TransaccionModel> findByUsuarioMesAnio(@Param("idUsuario") Long idUsuario,
                                                 @Param("mes") Integer mes,
                                                 @Param("anio") Integer anio);
    
    /**
     * Busca todas las transacciones individuales asociadas a una transacción grupal
     * @param idTransaccionGrupal ID de la transacción grupal
     * @return Lista de transacciones individuales
     */
    @Query("SELECT t FROM TransaccionModel t WHERE t.idTransaccionGrupal = :idTransaccionGrupal")
    List<TransaccionModel> findByIdTransaccionGrupal(@Param("idTransaccionGrupal") Long idTransaccionGrupal);
}