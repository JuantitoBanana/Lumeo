package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.ResumenFinancieroDTO;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.money.Monetary;
import javax.money.MonetaryAmount;
import javax.money.CurrencyUnit;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ResumenFinancieroService {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    /**
     * Calcula el resumen financiero para un usuario específico
     * @param usuarioId ID del usuario
     * @return ResumenFinancieroDTO con totales calculados
     */
    public ResumenFinancieroDTO calcularResumenFinanciero(Long usuarioId) {
        System.out.println("🔍 Calculando resumen financiero para usuario: " + usuarioId);
        
        // Obtener todas las transacciones del usuario
        List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuario(usuarioId);
        System.out.println("📊 Transacciones encontradas: " + transacciones.size());
        
        // Inicializar variables para cálculos
        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalGastos = BigDecimal.ZERO;
        String codigoDivisa = "EUR"; // Por defecto EUR
        String simboloDivisa = "€";
        
        // Procesar cada transacción
        for (TransaccionModel transaccion : transacciones) {
            System.out.println("🔍 Procesando transacción: " + transaccion.getId() + " - " + transaccion.getTitulo());
            
            Double importe = transaccion.getImporte();
            Long idTipo = transaccion.getIdTipo();
            
            System.out.println("💰 Importe: " + importe + ", Tipo: " + idTipo);
            
            if (importe != null && idTipo != null) {
                BigDecimal montoDecimal = BigDecimal.valueOf(Math.abs(importe)); // Usar valor absoluto
                
                // Distinguir según id_tipo: 1 = Ingreso, 2 = Gasto
                if (idTipo == 1L) {
                    // Es un ingreso
                    totalIngresos = totalIngresos.add(montoDecimal);
                    System.out.println("✅ Ingreso agregado: " + montoDecimal + " | Total ingresos: " + totalIngresos);
                } else if (idTipo == 2L) {
                    // Es un gasto
                    totalGastos = totalGastos.add(montoDecimal);
                    System.out.println("✅ Gasto agregado: " + montoDecimal + " | Total gastos: " + totalGastos);
                }
            } else {
                System.out.println("⚠️ Transacción con valores nulos: importe=" + importe + ", idTipo=" + idTipo);
            }
        }
        
        // Por ahora usamos EUR como divisa por defecto
        // En el futuro se puede obtener de la configuración del usuario
        
        // Calcular saldo total (ingresos - gastos)
        BigDecimal saldoTotal = totalIngresos.subtract(totalGastos);
        
        System.out.println("📊 RESULTADO FINAL:");
        System.out.println("   Total Ingresos: " + totalIngresos);
        System.out.println("   Total Gastos: " + totalGastos);
        System.out.println("   Saldo Total: " + saldoTotal);
        
        // Calcular datos del mes actual
        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate finMes = hoy.withDayOfMonth(hoy.lengthOfMonth());
        
        System.out.println("📅 Calculando datos mensuales de " + inicioMes + " a " + finMes);
        
        // Obtener transacciones del mes actual
        List<TransaccionModel> transaccionesMes = transaccionRepository.findByIdUsuarioAndFechaBetween(usuarioId, inicioMes, finMes);
        System.out.println("📊 Transacciones del mes encontradas: " + transaccionesMes.size());
        
        BigDecimal ingresosMensuales = BigDecimal.ZERO;
        BigDecimal gastosMensuales = BigDecimal.ZERO;
        
        // Procesar transacciones del mes
        for (TransaccionModel transaccion : transaccionesMes) {
            Double importe = transaccion.getImporte();
            Long idTipo = transaccion.getIdTipo();
            
            if (importe != null && idTipo != null) {
                BigDecimal montoDecimal = BigDecimal.valueOf(Math.abs(importe));
                
                if (idTipo == 1L) {
                    // Es un ingreso
                    ingresosMensuales = ingresosMensuales.add(montoDecimal);
                } else if (idTipo == 2L) {
                    // Es un gasto
                    gastosMensuales = gastosMensuales.add(montoDecimal);
                }
            }
        }
        
        BigDecimal ahorroMensual = ingresosMensuales.subtract(gastosMensuales);
        
        System.out.println("📊 RESULTADO MENSUAL:");
        System.out.println("   Ingresos Mensuales: " + ingresosMensuales);
        System.out.println("   Gastos Mensuales: " + gastosMensuales);
        System.out.println("   Ahorro Mensual: " + ahorroMensual);
        
        return new ResumenFinancieroDTO(totalIngresos, totalGastos, saldoTotal, codigoDivisa, simboloDivisa,
                                       ingresosMensuales, gastosMensuales, ahorroMensual);
    }
    
    /**
     * Convierte un monto usando JavaMoney API (preparado para conversiones futuras)
     * @param monto Monto a convertir
     * @param codigoDivisaOrigen Código de divisa origen
     * @param codigoDivisaDestino Código de divisa destino
     * @return Monto convertido
     */
    public MonetaryAmount convertirDivisa(BigDecimal monto, String codigoDivisaOrigen, String codigoDivisaDestino) {
        CurrencyUnit divisaOrigen = Monetary.getCurrency(codigoDivisaOrigen);
        MonetaryAmount montoOrigen = Monetary.getDefaultAmountFactory()
                .setCurrency(divisaOrigen)
                .setNumber(monto)
                .create();
        
        // Por ahora retornamos el mismo monto (en el futuro se puede agregar conversión real)
        // Para conversión real necesitarías un proveedor de tasas de cambio
        return montoOrigen;
    }
    
    /**
     * Obtiene el símbolo de una divisa
     * @param codigoDivisa Código ISO de la divisa
     * @return Símbolo de la divisa
     */
    private String obtenerSimboloDivisa(String codigoDivisa) {
        try {
            return java.util.Currency.getInstance(codigoDivisa).getSymbol();
        } catch (Exception e) {
            // Si no se puede obtener el símbolo, usar el código
            return codigoDivisa;
        }
    }
}