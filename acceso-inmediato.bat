@echo off
echo.
echo ⚡ ACCESO INMEDIATO A INTERNET - CAFÉ NARE
echo ==========================================
echo.
echo 🎯 Esta opción te da acceso INMEDIATO desde internet
echo    ✅ No requiere configuración
echo    ✅ Listo en 2 minutos
echo    ⚠️  URL temporal (cambia cada vez)
echo.

REM Verificar si ngrok está instalado
ngrok version >nul 2>&1
if errorlevel 1 (
    echo ❌ Ngrok no está instalado
    echo.
    echo 📥 OPCIONES PARA INSTALAR NGROK:
    echo.
    echo Opción 1 - Descargar manual:
    echo    1. Ir a: https://ngrok.com/download
    echo    2. Descargar para Windows
    echo    3. Extraer ngrok.exe a esta carpeta
    echo    4. Ejecutar este script nuevamente
    echo.
    echo Opción 2 - Con chocolatey ^(si lo tienes^):
    echo    choco install ngrok
    echo.
    echo Opción 3 - Usar LocalTunnel ^(alternativa^):
    echo    npm install -g localtunnel
    echo    Luego usar: acceso-localtunnel.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Ngrok detectado
echo.

REM Verificar si la aplicación está corriendo
echo 🔍 Verificando si la aplicación está corriendo en puerto 3000...
netstat -ano | findstr :3000 | findstr LISTENING >nul
if errorlevel 1 (
    echo ⚠️  La aplicación no está corriendo
    echo.
    echo 🚀 Iniciando aplicación primero...
    start cmd /k "npm start"
    echo.
    echo ⏳ Esperando 10 segundos para que inicie...
    timeout /t 10 /nobreak >nul
)

echo.
echo 🌐 Creando túnel público con Ngrok...
echo.
echo 📋 INSTRUCCIONES:
echo    1. Se abrirá una ventana con la URL pública
echo    2. Copia la URL que empiece con https://
echo    3. Esa URL funciona desde cualquier celular/PC del mundo
echo    4. Para cerrar: Ctrl+C en la ventana de Ngrok
echo.

REM Registrarse en ngrok si es la primera vez
echo 🔐 Si es tu primera vez con Ngrok:
echo    1. Ve a: https://ngrok.com/signup
echo    2. Regístrate gratis
echo    3. Copia tu token de autenticación
echo    4. Ejecuta: ngrok authtoken TU_TOKEN
echo.

pause

echo.
echo 🚀 Iniciando túnel público...
echo.
echo 🌍 Tu aplicación estará disponible en una URL como:
echo    https://abc123.ngrok.io
echo.

ngrok http 3000

echo.
echo 🔄 Túnel cerrado. Para volver a activarlo, ejecuta este script nuevamente.
pause
