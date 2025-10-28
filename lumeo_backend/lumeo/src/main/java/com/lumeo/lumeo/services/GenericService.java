package com.lumeo.lumeo.services;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public abstract class GenericService<T, ID> {
    
    protected abstract JpaRepository<T, ID> getRepository();
    
    /**
     * Find all entities
     */
    @Transactional(readOnly = true)
    public List<T> findAll() {
        return getRepository().findAll();
    }
    
    /**
     * Find entity by ID
     */
    @Transactional(readOnly = true)
    public Optional<T> findById(ID id) {
        return getRepository().findById(id);
    }
    
    /**
     * Create new entity
     */
    @Transactional
    public T create(T entity) {
        return getRepository().save(entity);
    }
    
    /**
     * Update entity by ID
     */
    @Transactional
    public Optional<T> editById(ID id, T updatedEntity) {
        return getRepository().findById(id)
                .map(existingEntity -> {
                    // Here you can add custom update logic if needed
                    return getRepository().save(updatedEntity);
                });
    }
    
    /**
     * Delete entity by ID
     */
    @Transactional
    public boolean delete(ID id) {
        if (getRepository().existsById(id)) {
            getRepository().deleteById(id);
            return true;
        }
        return false;
    }
    
    /**
     * Check if entity exists by ID
     */
    @Transactional(readOnly = true)
    public boolean existsById(ID id) {
        return getRepository().existsById(id);
    }
    
    /**
     * Count all entities
     */
    @Transactional(readOnly = true)
    public long count() {
        return getRepository().count();
    }
    
    /**
     * Save entity (create or update)
     */
    @Transactional
    public T save(T entity) {
        return getRepository().save(entity);
    }
    
    /**
     * Save multiple entities
     */
    @Transactional
    public List<T> saveAll(List<T> entities) {
        return getRepository().saveAll(entities);
    }
}