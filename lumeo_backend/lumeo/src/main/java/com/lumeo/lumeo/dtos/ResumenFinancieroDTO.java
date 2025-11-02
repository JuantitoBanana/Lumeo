package com.lumeo.lumeo.dtos;

import java.math.BigDecimal;

/**
 * DTO para el resumen financiero del dashboard
 */
public class ResumenFinancieroDTO {
    
    private BigDecimal totalIngresos;
    private BigDecimal totalGastos;
    private BigDecimal saldoTotal;
    private String codigoDivisa;
    private String simboloDivisa;
    private String posicionSimbolo; // "ANTES" o "DESPUES"
    
    // Datos mensuales (mes actual)
    private BigDecimal ingresosMensuales;
    private BigDecimal gastosMensuales;
    private BigDecimal ahorroMensual;
    
    public ResumenFinancieroDTO() {}
    
    public ResumenFinancieroDTO(BigDecimal totalIngresos, BigDecimal totalGastos, 
                               BigDecimal saldoTotal, String codigoDivisa, String simboloDivisa,
                               String posicionSimbolo,
                               BigDecimal ingresosMensuales, BigDecimal gastosMensuales, BigDecimal ahorroMensual) {
        this.totalIngresos = totalIngresos != null ? totalIngresos : BigDecimal.ZERO;
        this.totalGastos = totalGastos != null ? totalGastos : BigDecimal.ZERO;
        this.saldoTotal = saldoTotal != null ? saldoTotal : BigDecimal.ZERO;
        this.codigoDivisa = codigoDivisa != null ? codigoDivisa : "EUR";
        this.simboloDivisa = simboloDivisa != null ? simboloDivisa : "€";
        this.posicionSimbolo = posicionSimbolo != null ? posicionSimbolo : "DESPUES";
        this.ingresosMensuales = ingresosMensuales != null ? ingresosMensuales : BigDecimal.ZERO;
        this.gastosMensuales = gastosMensuales != null ? gastosMensuales : BigDecimal.ZERO;
        this.ahorroMensual = ahorroMensual != null ? ahorroMensual : BigDecimal.ZERO;
    }

    // Getters y Setters
    public BigDecimal getTotalIngresos() {
        return totalIngresos;
    }

    public void setTotalIngresos(BigDecimal totalIngresos) {
        this.totalIngresos = totalIngresos;
    }

    public BigDecimal getTotalGastos() {
        return totalGastos;
    }

    public void setTotalGastos(BigDecimal totalGastos) {
        this.totalGastos = totalGastos;
    }

    public BigDecimal getSaldoTotal() {
        return saldoTotal;
    }

    public void setSaldoTotal(BigDecimal saldoTotal) {
        this.saldoTotal = saldoTotal;
    }

    public String getCodigoDivisa() {
        return codigoDivisa;
    }

    public void setCodigoDivisa(String codigoDivisa) {
        this.codigoDivisa = codigoDivisa;
    }

    public String getSimboloDivisa() {
        return simboloDivisa;
    }

    public void setSimboloDivisa(String simboloDivisa) {
        this.simboloDivisa = simboloDivisa;
    }

    public String getPosicionSimbolo() {
        return posicionSimbolo;
    }

    public void setPosicionSimbolo(String posicionSimbolo) {
        this.posicionSimbolo = posicionSimbolo;
    }

    // Getters y Setters para datos mensuales
    public BigDecimal getIngresosMensuales() {
        return ingresosMensuales;
    }

    public void setIngresosMensuales(BigDecimal ingresosMensuales) {
        this.ingresosMensuales = ingresosMensuales;
    }

    public BigDecimal getGastosMensuales() {
        return gastosMensuales;
    }

    public void setGastosMensuales(BigDecimal gastosMensuales) {
        this.gastosMensuales = gastosMensuales;
    }

    public BigDecimal getAhorroMensual() {
        return ahorroMensual;
    }

    public void setAhorroMensual(BigDecimal ahorroMensual) {
        this.ahorroMensual = ahorroMensual;
    }
}