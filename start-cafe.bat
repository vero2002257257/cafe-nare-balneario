@echo off
echo.
echo ☕ INICIANDO CAFÉ NARE BALNEARIO...
echo.

REM Cerrar procesos que usen el puerto 3000
echo 🔄 Liberando puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Cerrando proceso %%a...
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo 🚀 Iniciando aplicación...
echo.

REM Iniciar la aplicación
npm start

pause
