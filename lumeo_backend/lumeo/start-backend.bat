@echo off
echo ========================================
echo    LUMEO BACKEND - Spring Boot
echo ========================================
echo.
cd /d C:\Users\usuario\Documents\ProyectoLumeo\Lumeo\lumeo_backend\lumeo

REM Cargar variables de entorno desde .env
for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
    set "%%a=%%b"
)

REM Configurar Java
set MAVEN_OPTS=-Djava.net.preferIPv4Stack=true

echo Iniciando backend...
echo.

call mvnw.cmd spring-boot:run
pause
