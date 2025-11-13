@echo off
echo ========================================
echo    LIMPIEZA DE CONEXIONES
echo ========================================
echo.
echo Terminando procesos de Java...
taskkill /F /IM java.exe 2>nul
timeout /t 2 /nobreak >nul
echo Procesos de Java terminados.
echo.
echo Puede iniciar el backend ahora.
pause
