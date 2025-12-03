package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.ResumenFinancieroDTO;
import com.lumeo.lumeo.models.TransaccionModel;
import com.lumeo.lumeo.models.usuarioModel;
import com.lumeo.lumeo.models.DivisaModel;
import com.lumeo.lumeo.repositories.TransaccionRepository;
import com.lumeo.lumeo.repositories.UsuarioRepository;
import com.lumeo.lumeo.repositories.DivisaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ResumenFinancieroService {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
    /**
     * Calcula el resumen financiero para un usuario específico
     * @param usuarioId ID del usuario
     * @return ResumenFinancieroDTO con totales calculados
     */
    public ResumenFinancieroDTO calcularResumenFinanciero(Long usuarioId) {
        System.out.println("🔍 Calculando resumen financiero para usuario: " + usuarioId);
        
        // Obtener la divisa del usuario
        String codigoDivisa = "EUR"; // Por defecto EUR
        String simboloDivisa = "€";
        String posicionSimbolo = "DESPUES"; // Por defecto después (como EUR)
        
        Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuarioOpt.get().getIdDivisa());
            if (divisaOpt.isPresent()) {
                DivisaModel divisa = divisaOpt.get();
                codigoDivisa = divisa.getIso();
                simboloDivisa = divisa.getSimbolo() != null ? divisa.getSimbolo() : divisa.getIso();
                posicionSimbolo = divisa.getPosicionSimbolo() != null ? divisa.getPosicionSimbolo() : "DESPUES";
                System.out.println("💱 Divisa del usuario: " + codigoDivisa + " (" + simboloDivisa + ") - Posición: " + posicionSimbolo);
            }
        }
        
        // Obtener todas las transacciones del usuario (como creador O como destinatario)
        List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuarioOrIdDestinatario(usuarioId, usuarioId);
        System.out.println("📊 Transacciones encontradas: " + transacciones.size());
        
        // Inicializar variables para cálculos
        BigDecimal totalIngresos = BigDecimal.ZERO;
        BigDecimal totalGastos = BigDecimal.ZERO;
        
        // Procesar cada transacción
        for (TransaccionModel transaccion : transacciones) {
            System.out.println("🔍 Procesando transacción: " + transaccion.getId() + " - " + transaccion.getTitulo());
            
            // Determinar si el usuario es el creador o el destinatario
            boolean esCreador = transaccion.getIdUsuario().equals(usuarioId);
            boolean esDestinatario = transaccion.getIdDestinatario() != null && transaccion.getIdDestinatario().equals(usuarioId);
            
            // El importe a usar depende del rol del usuario en la transacción
            Double importeOriginal;
            if (esDestinatario) {
                // Si es destinatario, usar importe_destinatario
                importeOriginal = transaccion.getImporteDestinatario();
                System.out.println("👤 Usuario es DESTINATARIO, usando importe_destinatario: " + importeOriginal);
            } else {
                // Si es creador, usar importe normal
                importeOriginal = transaccion.getImporte();
                System.out.println("👤 Usuario es CREADOR, usando importe: " + importeOriginal);
            }
            
            // Convertir desde la divisa original a la divisa actual del usuario
            Double importe = importeOriginal;
            if (transaccion.getIdDivisaOriginal() != null) {
                Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
                if (divisaOriginalOpt.isPresent()) {
                    String isoOriginal = divisaOriginalOpt.get().getIso();
                    importe = conversionDivisaService.convertirMonto(
                        importeOriginal, 
                        isoOriginal, 
                        codigoDivisa
                    );
                    System.out.println("💱 Convertido de " + isoOriginal + " a " + codigoDivisa + ": " + 
                                     importeOriginal + " → " + importe);
                }
            }
            
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
        
        // Obtener transacciones del mes actual (como creador O destinatario)
        List<TransaccionModel> transaccionesMes = transaccionRepository.findByIdUsuarioOrIdDestinatarioAndFechaBetween(usuarioId, usuarioId, inicioMes, finMes);
        System.out.println("📊 Transacciones del mes encontradas: " + transaccionesMes.size());
        
        BigDecimal ingresosMensuales = BigDecimal.ZERO;
        BigDecimal gastosMensuales = BigDecimal.ZERO;
        
        // Procesar transacciones del mes
        for (TransaccionModel transaccion : transaccionesMes) {
            // Determinar si el usuario es el creador o el destinatario
            boolean esDestinatario = transaccion.getIdDestinatario() != null && transaccion.getIdDestinatario().equals(usuarioId);
            
            // El importe a usar depende del rol del usuario en la transacción
            Double importeOriginal;
            if (esDestinatario) {
                // Si es destinatario, usar importe_destinatario
                importeOriginal = transaccion.getImporteDestinatario();
            } else {
                // Si es creador, usar importe normal
                importeOriginal = transaccion.getImporte();
            }
            
            // Convertir desde la divisa original a la divisa actual del usuario
            Double importe = importeOriginal;
            if (transaccion.getIdDivisaOriginal() != null) {
                Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
                if (divisaOriginalOpt.isPresent()) {
                    String isoOriginal = divisaOriginalOpt.get().getIso();
                    importe = conversionDivisaService.convertirMonto(
                        importeOriginal, 
                        isoOriginal, 
                        codigoDivisa
                    );
                }
            }
            
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
                                       posicionSimbolo, ingresosMensuales, gastosMensuales, ahorroMensual);
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