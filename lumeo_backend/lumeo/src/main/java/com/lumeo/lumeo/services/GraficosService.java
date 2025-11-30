package com.lumeo.lumeo.services;

import com.lumeo.lumeo.dtos.GastoPorCategoriaDTO;
import com.lumeo.lumeo.dtos.EvolucionMensualDTO;
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
import java.time.format.TextStyle;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Locale;
import java.util.Optional;

@Service
public class GraficosService {
    
    @Autowired
    private TransaccionRepository transaccionRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private DivisaRepository divisaRepository;
    
    @Autowired
    private ConversionDivisaService conversionDivisaService;
    
    // Colores predefinidos para el gráfico circular
    private static final String[] COLORES_GRAFICOS = {
        "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
        "#FF9F40", "#FF6384", "#C9CBCF", "#4BC0C0", "#FF6384"
    };
    
    /**
     * Obtiene los gastos del mes actual agrupados por categoría
     * @param usuarioId ID del usuario
     * @return Lista de gastos por categoría
     */
    public List<GastoPorCategoriaDTO> obtenerGastosPorCategoria(Long usuarioId) {
        System.out.println("🔍 Obteniendo gastos por categoría para usuario: " + usuarioId);
        
        // Obtener la divisa del usuario
        String codigoDivisaUsuario = "EUR";
        Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuarioOpt.get().getIdDivisa());
            if (divisaOpt.isPresent()) {
                codigoDivisaUsuario = divisaOpt.get().getIso();
            }
        }
        
        // Obtener fechas del mes actual
        LocalDate hoy = LocalDate.now();
        LocalDate inicioMes = hoy.withDayOfMonth(1);
        LocalDate finMes = hoy.withDayOfMonth(hoy.lengthOfMonth());
        
        System.out.println("📅 Período: " + inicioMes + " a " + finMes);
        
        // Obtener transacciones del mes actual con categoría cargada
        List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuarioAndFechaBetweenWithCategoria(usuarioId, inicioMes, finMes);
        System.out.println("📊 Transacciones encontradas: " + transacciones.size());
        
        // Agrupar gastos por categoría
        Map<Long, GastoPorCategoriaDTO> gastosPorCategoria = new HashMap<>();
        
        for (TransaccionModel transaccion : transacciones) {
            // Solo procesar gastos (id_tipo = 2) que tengan categoría con es_personalizada = false
            if (transaccion.getIdTipo() != null && transaccion.getIdTipo() == 2L && 
                transaccion.getIdCategoria() != null &&
                transaccion.getCategoria() != null &&
                Boolean.FALSE.equals(transaccion.getCategoria().getEsPersonalizada())) {
                
                // El campo 'importe' contiene el importe ORIGINAL
                Double importeOriginal = transaccion.getImporte();
                
                // Convertir desde la divisa original a la divisa actual del usuario
                Double importe = importeOriginal;
                if (transaccion.getIdDivisaOriginal() != null) {
                    Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
                    if (divisaOriginalOpt.isPresent()) {
                        String isoOriginal = divisaOriginalOpt.get().getIso();
                        importe = conversionDivisaService.convertirMonto(
                            importeOriginal,
                            isoOriginal,
                            codigoDivisaUsuario
                        );
                    }
                }
                
                Long idCategoria = transaccion.getIdCategoria();
                
                if (importe != null) {
                    BigDecimal montoGasto = BigDecimal.valueOf(Math.abs(importe));
                    
                    if (gastosPorCategoria.containsKey(idCategoria)) {
                        // Sumar al gasto existente
                        GastoPorCategoriaDTO gastoExistente = gastosPorCategoria.get(idCategoria);
                        gastoExistente.setTotalGasto(gastoExistente.getTotalGasto().add(montoGasto));
                    } else {
                        // Crear nueva entrada
                        String nombreCategoria = obtenerNombreCategoria(transaccion);
                        String color = obtenerColorCategoria(transaccion, gastosPorCategoria.size());
                        
                        GastoPorCategoriaDTO nuevoGasto = new GastoPorCategoriaDTO(
                            idCategoria, nombreCategoria, montoGasto, color
                        );
                        gastosPorCategoria.put(idCategoria, nuevoGasto);
                    }
                }
            }
        }
        
        List<GastoPorCategoriaDTO> resultado = new ArrayList<>(gastosPorCategoria.values());
        System.out.println("📊 Categorías con gastos: " + resultado.size());
        
        return resultado;
    }
    
    /**
     * Obtiene el nombre de la categoría de una transacción
     */
    private String obtenerNombreCategoria(TransaccionModel transaccion) {
        try {
            if (transaccion.getCategoria() != null && transaccion.getCategoria().getNombre() != null) {
                return transaccion.getCategoria().getNombre();
            }
        } catch (Exception e) {
            System.out.println("⚠️ No se pudo obtener nombre de categoría: " + e.getMessage());
        }
        return "Categoría " + transaccion.getIdCategoria();
    }
    
    /**
     * Obtiene el color de la categoría de una transacción
     */
    private String obtenerColorCategoria(TransaccionModel transaccion, int indice) {
        try {
            if (transaccion.getCategoria() != null && transaccion.getCategoria().getColor() != null) {
                return transaccion.getCategoria().getColor();
            }
        } catch (Exception e) {
            System.out.println("⚠️ No se pudo obtener color de categoría: " + e.getMessage());
        }
        // Usar color por defecto si no está disponible
        return COLORES_GRAFICOS[indice % COLORES_GRAFICOS.length];
    }
    
    /**
     * Obtiene la evolución mensual de ingresos y gastos (últimos N meses)
     * @param usuarioId ID del usuario
     * @param numeroMeses Número de meses hacia atrás a consultar
     * @return Lista de evolución mensual
     */
    public List<EvolucionMensualDTO> obtenerEvolucionMensual(Long usuarioId, int numeroMeses) {
        System.out.println("🔍 Obteniendo evolución mensual para usuario: " + usuarioId + ", últimos " + numeroMeses + " meses");
        
        // Obtener la divisa del usuario
        String codigoDivisaUsuario = "EUR";
        Optional<usuarioModel> usuarioOpt = usuarioRepository.findById(usuarioId);
        if (usuarioOpt.isPresent() && usuarioOpt.get().getIdDivisa() != null) {
            Optional<DivisaModel> divisaOpt = divisaRepository.findById(usuarioOpt.get().getIdDivisa());
            if (divisaOpt.isPresent()) {
                codigoDivisaUsuario = divisaOpt.get().getIso();
            }
        }
        
        List<EvolucionMensualDTO> evolucion = new ArrayList<>();
        LocalDate fechaActual = LocalDate.now();
        
        for (int i = numeroMeses - 1; i >= 0; i--) {
            LocalDate mesConsulta = fechaActual.minusMonths(i);
            LocalDate inicioMes = mesConsulta.withDayOfMonth(1);
            LocalDate finMes = mesConsulta.withDayOfMonth(mesConsulta.lengthOfMonth());
            
            System.out.println("📅 Consultando mes: " + mesConsulta.getMonth() + " " + mesConsulta.getYear());
            
            // Obtener transacciones del mes
            List<TransaccionModel> transacciones = transaccionRepository.findByIdUsuarioAndFechaBetween(usuarioId, inicioMes, finMes);
            
            BigDecimal totalIngresos = BigDecimal.ZERO;
            BigDecimal totalGastos = BigDecimal.ZERO;
            
            // Procesar transacciones
            for (TransaccionModel transaccion : transacciones) {
                // El campo 'importe' contiene el importe ORIGINAL
                Double importeOriginal = transaccion.getImporte();
                
                // Convertir desde la divisa original a la divisa actual del usuario
                Double importe = importeOriginal;
                if (transaccion.getIdDivisaOriginal() != null) {
                    Optional<DivisaModel> divisaOriginalOpt = divisaRepository.findById(transaccion.getIdDivisaOriginal());
                    if (divisaOriginalOpt.isPresent()) {
                        String isoOriginal = divisaOriginalOpt.get().getIso();
                        importe = conversionDivisaService.convertirMonto(
                            importeOriginal,
                            isoOriginal,
                            codigoDivisaUsuario
                        );
                    }
                }
                
                Long idTipo = transaccion.getIdTipo();
                
                if (importe != null && idTipo != null) {
                    BigDecimal montoDecimal = BigDecimal.valueOf(Math.abs(importe));
                    
                    if (idTipo == 1L) {
                        // Ingreso
                        totalIngresos = totalIngresos.add(montoDecimal);
                    } else if (idTipo == 2L) {
                        // Gasto
                        totalGastos = totalGastos.add(montoDecimal);
                    }
                }
            }
            
            // Crear DTO del mes
            String nombreMes = mesConsulta.getMonth().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es"));
            String abreviaturaMes = mesConsulta.getMonth().getDisplayName(TextStyle.SHORT, Locale.forLanguageTag("es"));
            
            EvolucionMensualDTO mesDTO = new EvolucionMensualDTO(
                mesConsulta.getYear(),
                mesConsulta.getMonthValue(),
                nombreMes,
                abreviaturaMes,
                totalIngresos,
                totalGastos
            );
            
            evolucion.add(mesDTO);
            System.out.println("📊 " + nombreMes + ": Ingresos=" + totalIngresos + ", Gastos=" + totalGastos);
        }
        
        return evolucion;
    }
}