package com.lumeo.lumeo.dtos;

import java.math.BigDecimal;

/**
 * DTO para representar gastos agrupados por categoría
 */
public class GastoPorCategoriaDTO {
    
    private Long idCategoria;
    private String nombreCategoria;
    private BigDecimal totalGasto;
    private String color; // Color para el gráfico circular
    
    public GastoPorCategoriaDTO() {}
    
    public GastoPorCategoriaDTO(Long idCategoria, String nombreCategoria, BigDecimal totalGasto, String color) {
        this.idCategoria = idCategoria;
        this.nombreCategoria = nombreCategoria;
        this.totalGasto = totalGasto != null ? totalGasto : BigDecimal.ZERO;
        this.color = color;
    }

    // Getters y Setters
    public Long getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(Long idCategoria) {
        this.idCategoria = idCategoria;
    }

    public String getNombreCategoria() {
        return nombreCategoria;
    }

    public void setNombreCategoria(String nombreCategoria) {
        this.nombreCategoria = nombreCategoria;
    }

    public BigDecimal getTotalGasto() {
        return totalGasto;
    }

    public void setTotalGasto(BigDecimal totalGasto) {
        this.totalGasto = totalGasto;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }
}