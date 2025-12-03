@echo off
echo ========================================
echo  CERRANDO PROCESOS JAVA HUERFANOS
echo ========================================
echo.
echo Buscando procesos Java en ejecucion...
tasklist | findstr /i "java.exe"
echo.
echo Cerrando todos los procesos Java...
taskkill /F /IM java.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Procesos Java cerrados correctamente.
) else (
    echo ℹ️ No se encontraron procesos Java en ejecucion.
)
echo.
timeout /t 2 >nul
