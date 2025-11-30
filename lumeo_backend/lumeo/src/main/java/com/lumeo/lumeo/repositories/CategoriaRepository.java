package com.lumeo.lumeo.repositories;

import com.lumeo.lumeo.models.CategoriaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<CategoriaModel, Long> {
    
    /**
     * Obtiene las categorías disponibles para un usuario específico:
     * - Categorías públicas (es_personalizada = false)
     * - Categorías personalizadas del usuario (es_personalizada = true AND id_usuario = :idUsuario)
     */
    @Query("SELECT c FROM CategoriaModel c WHERE " +
           "(c.esPersonalizada = false OR c.esPersonalizada IS NULL) " +
           "OR (c.esPersonalizada = true AND c.idUsuario = :idUsuario)")
    List<CategoriaModel> findCategoriasDisponiblesParaUsuario(@Param("idUsuario") Long idUsuario);
}