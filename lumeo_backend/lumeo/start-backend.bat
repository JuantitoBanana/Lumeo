@echo off
echo ========================================
echo    LUMEO BACKEND - Spring Boot
echo ========================================
echo.
echo CONFIGURACION SESSION POOLER (PgBouncer):
echo - Puerto: 5432 (Session Pooler con pool dedicado)
echo - Pool de conexiones: 10 conexiones max
echo - 15 conexiones dedicadas en Supabase
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
