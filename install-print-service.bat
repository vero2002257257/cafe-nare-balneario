@echo off
echo Instalando servicio de impresión...

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js no está instalado
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

:: Crear directorio si no existe
if not exist "print-service" mkdir print-service

:: Instalar dependencias
cd print-service
echo Instalando dependencias...
npm init -y
npm install express cors printer

:: Crear archivo bat para iniciar el servicio
echo @echo off > start-print-service.bat
echo echo Iniciando servicio de impresión... >> start-print-service.bat
echo node print-server.js >> start-print-service.bat
echo pause >> start-print-service.bat

echo.
echo Instalación completada.
echo Para iniciar el servicio, ejecuta start-print-service.bat
pause
