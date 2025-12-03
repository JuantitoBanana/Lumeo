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
     * CON JOIN FETCH para evitar LazyInitializationException
     * @param idUsuario ID del usuario
     * @param idDestinatario ID del destinatario (mismo que idUsuario)
     * @return Lista de transacciones donde el usuario participa
     */
    @Query("SELECT DISTINCT t FROM TransaccionModel t " +
           "LEFT JOIN FETCH t.categoria " +
           "LEFT JOIN FETCH t.tipoTransaccion " +
           "LEFT JOIN FETCH t.estadoTransaccion " +
           "WHERE t.idUsuario = :idUsuario OR t.idDestinatario = :idDestinatario")
    List<TransaccionModel> findByIdUsuarioOrIdDestinatarioWithRelations(@Param("idUsuario") Long idUsuario, @Param("idDestinatario") Long idDestinatario);
    
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
     * Busca transacciones de un usuario en un rango de fechas (como creador O destinatario)
     * @param idUsuario ID del usuario
     * @param idDestinatario ID del destinatario (mismo que idUsuario)
     * @param startDate Fecha de inicio
     * @param endDate Fecha de fin
     * @return Lista de transacciones donde el usuario participa
     */
    @Query("SELECT t FROM TransaccionModel t WHERE (t.idUsuario = :idUsuario OR t.idDestinatario = :idDestinatario) AND t.fechaTransaccion >= :startDate AND t.fechaTransaccion <= :endDate")
    List<TransaccionModel> findByIdUsuarioOrIdDestinatarioAndFechaBetween(@Param("idUsuario") Long idUsuario, @Param("idDestinatario") Long idDestinatario, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * Busca transacciones de un usuario en un rango de fechas con categoría cargada
     * @param idUsuario ID del usuario
     * @param startDate Fecha de inicio
     * @param endDate Fecha de fin
     * @return Lista de transacciones con categoría cargada
     */
    @Query("SELECT DISTINCT t FROM TransaccionModel t " +
           "LEFT JOIN FETCH t.categoria " +
           "WHERE t.idUsuario = :idUsuario " +
           "AND t.fechaTransaccion >= :startDate " +
           "AND t.fechaTransaccion <= :endDate")
    List<TransaccionModel> findByIdUsuarioAndFechaBetweenWithCategoria(@Param("idUsuario") Long idUsuario, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * Busca transacciones de un usuario en un rango de fechas con categoría cargada (como creador O destinatario)
     * @param idUsuario ID del usuario
     * @param idDestinatario ID del destinatario (mismo que idUsuario)
     * @param startDate Fecha de inicio
     * @param endDate Fecha de fin
     * @return Lista de transacciones con categoría cargada donde el usuario participa
     */
    @Query("SELECT DISTINCT t FROM TransaccionModel t " +
           "LEFT JOIN FETCH t.categoria " +
           "WHERE (t.idUsuario = :idUsuario OR t.idDestinatario = :idDestinatario) " +
           "AND t.fechaTransaccion >= :startDate " +
           "AND t.fechaTransaccion <= :endDate")
    List<TransaccionModel> findByIdUsuarioOrIdDestinatarioAndFechaBetweenWithCategoria(@Param("idUsuario") Long idUsuario, @Param("idDestinatario") Long idDestinatario, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
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
     * Calcula el total de gastos (tipo = 2) de un usuario para un mes y año específicos
     * Incluye transacciones donde el usuario es creador O destinatario
     * Para destinatario, suma importe_destinatario
     * @param idUsuario ID del usuario
     * @param idDestinatario ID del destinatario (mismo que idUsuario)
     * @param mes Número del mes (1-12)
     * @param anio Año
     * @return Total de gastos del mes/año especificado
     */
    @Query(value = "SELECT COALESCE( " +
           "  SUM(CASE " +
           "    WHEN t.id_usuario = :idUsuario THEN t.importe " +
           "    WHEN t.id_destinatario = :idDestinatario THEN t.importe_destinatario " +
           "    ELSE 0 " +
           "  END), 0.0) " +
           "FROM transaccion t " +
           "WHERE (t.id_usuario = :idUsuario OR t.id_destinatario = :idDestinatario) " +
           "AND t.id_tipo = 2 " +
           "AND EXTRACT(MONTH FROM t.fecha_transaccion) = :mes " +
           "AND EXTRACT(YEAR FROM t.fecha_transaccion) = :anio", nativeQuery = true)
    Double calcularGastosPorMesAnioIncluyendoDestinatario(@Param("idUsuario") Long idUsuario, 
                                                           @Param("idDestinatario") Long idDestinatario,
                                                           @Param("mes") Integer mes, 
                                                           @Param("anio") Integer anio);
    
    /**
     * Busca transacciones de un usuario filtradas por mes y año
     * @param idUsuario ID del usuario
     * @param mes Número del mes (1-12)
     * @param anio Año como String
     * @return Lista de transacciones que coinciden con el mes y año
     */
    @Query("SELECT t FROM TransaccionModel t " +
           "LEFT JOIN FETCH t.categoria " +
           "LEFT JOIN FETCH t.tipoTransaccion " +
           "LEFT JOIN FETCH t.estadoTransaccion " +
           "WHERE t.idUsuario = :idUsuario " +
           "AND t.idTipo = 2 " +
           "AND MONTH(t.fechaTransaccion) = :mes " +
           "AND YEAR(t.fechaTransaccion) = :anio " +
           "ORDER BY t.fechaTransaccion DESC")
    List<TransaccionModel> findByUsuarioMesAnio(@Param("idUsuario") Long idUsuario,
                                                 @Param("mes") Integer mes,
                                                 @Param("anio") Integer anio);
    
    /**
     * Busca todas las transacciones individuales asociadas a una transacción grupal
     * @param idTransaccionGrupal ID de la transacción grupal
     * @return Lista de transacciones individuales
     */
    @Query("SELECT t FROM TransaccionModel t " +
           "LEFT JOIN FETCH t.categoria " +
           "LEFT JOIN FETCH t.tipoTransaccion " +
           "LEFT JOIN FETCH t.estadoTransaccion " +
           "WHERE t.idTransaccionGrupal = :idTransaccionGrupal")
    List<TransaccionModel> findByIdTransaccionGrupal(@Param("idTransaccionGrupal") Long idTransaccionGrupal);
}