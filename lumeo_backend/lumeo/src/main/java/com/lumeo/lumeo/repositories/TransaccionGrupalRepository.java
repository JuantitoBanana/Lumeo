package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.TransaccionGrupalModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransaccionGrupalRepository extends JpaRepository<TransaccionGrupalModel, Long> {
    
    /**
     * Busca todas las transacciones grupales de un grupo específico
     * @param idGrupo ID del grupo
     * @return Lista de transacciones grupales del grupo ordenadas por fecha descendente
     */
    @Query("SELECT tg FROM TransaccionGrupalModel tg WHERE tg.idGrupo = :idGrupo ORDER BY tg.fechaTransaccion DESC")
    List<TransaccionGrupalModel> findByIdGrupo(@Param("idGrupo") Long idGrupo);
}
