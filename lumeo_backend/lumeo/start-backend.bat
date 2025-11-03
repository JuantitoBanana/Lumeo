@echo off
echo ========================================
echo    LUMEO BACKEND - Spring Boot
echo ========================================
echo.
echo Iniciando backend en http://localhost:8080
echo.
cd /d C:\Users\usuario\Documents\ProyectoLumeo\Lumeo\lumeo_backend\lumeo
call mvnw.cmd clean spring-boot:run
pause
