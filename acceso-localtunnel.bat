@echo off
echo.
echo 🌐 ACCESO GLOBAL CON LOCALTUNNEL - CAFÉ NARE
echo =============================================
echo.
echo 🎯 LocalTunnel - Alternativa más simple que Ngrok
echo    ✅ No requiere registro
echo    ✅ URL personalizable
echo    ✅ Totalmente gratis
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no está instalado
    echo 📥 Instalar desde: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js detectado
echo.

REM Instalar LocalTunnel si no está instalado
echo 📦 Verificando LocalTunnel...
npm list -g localtunnel >nul 2>&1
if errorlevel 1 (
    echo 📥 Instalando LocalTunnel...
    npm install -g localtunnel
    
    if errorlevel 1 (
        echo ❌ Error instalando LocalTunnel
        echo 💡 Intenta ejecutar como administrador
        pause
        exit /b 1
    )
    
    echo ✅ LocalTunnel instalado correctamente
)

echo.

REM Verificar si la aplicación está corriendo
echo 🔍 Verificando aplicación en puerto 3000...
netstat -ano | findstr :3000 | findstr LISTENING >nul
if errorlevel 1 (
    echo ⚠️  Aplicación no está corriendo
    echo.
    echo 🚀 Iniciando aplicación...
    start cmd /k "npm start"
    echo.
    echo ⏳ Esperando 10 segundos...
    timeout /t 10 /nobreak >nul
)

REM Solicitar nombre personalizado
echo.
set /p SUBDOMAIN="📝 Nombre para tu URL (ej: cafe-nare-tuapellido): "
if "%SUBDOMAIN%"=="" set SUBDOMAIN=cafe-nare

echo.
echo 🌐 Creando túnel público...
echo.
echo 🎯 Tu aplicación estará disponible en:
echo    https://%SUBDOMAIN%.loca.lt
echo.
echo 📱 Acceso desde cualquier dispositivo:
echo    ✅ Abre cualquier navegador
echo    ✅ Ve a: https://%SUBDOMAIN%.loca.lt
echo    ✅ Funciona desde cualquier país
echo.
echo 🔄 Para cerrar: Ctrl+C
echo.

lt --port 3000 --subdomain %SUBDOMAIN%

echo.
echo 🔄 Túnel cerrado.
echo.
echo 💡 TIPS:
echo    - La URL https://%SUBDOMAIN%.loca.lt estará disponible mientras esté activo
echo    - Puedes usar la misma URL la próxima vez
echo    - Para cambiar el nombre, edita este script
echo.
pause
