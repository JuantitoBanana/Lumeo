package com.lumeo.lumeo.dtos;

import java.math.BigDecimal;

/**
 * DTO para representar datos financieros de un mes específico
 */
public class EvolucionMensualDTO {
    
    private int año;
    private int mes;
    private String nombreMes; // "Enero", "Febrero", etc.
    private String abreviaturaMes; // "Ene", "Feb", etc.
    private BigDecimal totalIngresos;
    private BigDecimal totalGastos;
    private BigDecimal saldo;
    
    public EvolucionMensualDTO() {}
    
    public EvolucionMensualDTO(int año, int mes, String nombreMes, String abreviaturaMes, 
                              BigDecimal totalIngresos, BigDecimal totalGastos) {
        this.año = año;
        this.mes = mes;
        this.nombreMes = nombreMes;
        this.abreviaturaMes = abreviaturaMes;
        this.totalIngresos = totalIngresos != null ? totalIngresos : BigDecimal.ZERO;
        this.totalGastos = totalGastos != null ? totalGastos : BigDecimal.ZERO;
        this.saldo = this.totalIngresos.subtract(this.totalGastos);
    }

    // Getters y Setters
    public int getAño() {
        return año;
    }

    public void setAño(int año) {
        this.año = año;
    }

    public int getMes() {
        return mes;
    }

    public void setMes(int mes) {
        this.mes = mes;
    }

    public String getNombreMes() {
        return nombreMes;
    }

    public void setNombreMes(String nombreMes) {
        this.nombreMes = nombreMes;
    }

    public String getAbreviaturaMes() {
        return abreviaturaMes;
    }

    public void setAbreviaturaMes(String abreviaturaMes) {
        this.abreviaturaMes = abreviaturaMes;
    }

    public BigDecimal getTotalIngresos() {
        return totalIngresos;
    }

    public void setTotalIngresos(BigDecimal totalIngresos) {
        this.totalIngresos = totalIngresos;
        this.saldo = this.totalIngresos.subtract(this.totalGastos);
    }

    public BigDecimal getTotalGastos() {
        return totalGastos;
    }

    public void setTotalGastos(BigDecimal totalGastos) {
        this.totalGastos = totalGastos;
        this.saldo = this.totalIngresos.subtract(this.totalGastos);
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }
}