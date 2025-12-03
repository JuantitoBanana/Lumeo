@echo off
echo ========================================
echo    LUMEO BACKEND - Spring Boot
echo ========================================
echo.

REM Cerrar cualquier instancia previa de Java para evitar conflictos de conexiones
call kill-java-processes.bat

echo CONFIGURACION MODO EMERGENCIA:
echo - Puerto: 5432 (Supavisor IPv4 Pooler)
echo - Pool: 1 conexion + DevTools DESHABILITADO
echo - Health Check DB: DESHABILITADO
echo.
echo IMPORTANTE: Si sigue fallando, ejecuta check-connections.sql
echo en tu Dashboard de Supabase para ver conexiones activas.
echo - Prepared statements: SOPORTADOS
echo - IPv4 forzado para estabilidad
echo.
echo Iniciando backend en http://localhost:8080
echo.
cd /d C:\Users\usuario\Documents\ProyectoLumeo\Lumeo\lumeo_backend\lumeo

REM Forzar IPv4 para mejor compatibilidad
set MAVEN_OPTS=-Djava.net.preferIPv4Stack=true -Djava.net.preferIPv6Addresses=false -Xms256m -Xmx512m

echo.
echo Ejecutando: mvnw.cmd spring-boot:run
echo.
call mvnw.cmd spring-boot:run
pause
