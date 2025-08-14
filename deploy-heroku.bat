@echo off
echo.
echo 🌐 DESPLEGANDO CAFÉ NARE A INTERNET GLOBAL...
echo.

REM Verificar si Git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Git no está instalado
    echo 📥 Descargar Git desde: https://git-scm.com/download/win
    pause
    exit /b 1
)

REM Verificar si Heroku CLI está instalado
heroku --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Heroku CLI no está instalado
    echo 📥 Descargar desde: https://devcenter.heroku.com/articles/heroku-cli
    pause
    exit /b 1
)

echo ✅ Git y Heroku CLI detectados
echo.

REM Solicitar nombre de la aplicación
set /p APP_NAME="📝 Ingresa el nombre para tu app (ej: cafe-nare-tuapellido): "
if "%APP_NAME%"=="" (
    echo ❌ Nombre de aplicación requerido
    pause
    exit /b 1
)

echo.
echo 🔐 Iniciando sesión en Heroku...
heroku login

echo.
echo 🚀 Creando aplicación: %APP_NAME%
heroku create %APP_NAME%

if errorlevel 1 (
    echo ⚠️  La aplicación ya existe o hay un error
    echo 🔄 Intentando usar aplicación existente...
    heroku git:remote -a %APP_NAME%
)

echo.
echo ⚙️ Configurando variables de entorno...
heroku config:set USE_GOOGLE_SHEETS=false
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=cafe-nare-secret-key-2024

echo.
echo 📦 Preparando código para despliegue...

REM Inicializar Git si no existe
if not exist ".git" (
    git init
    echo ✅ Repositorio Git inicializado
)

REM Agregar archivos
git add .
git commit -m "Café Nare - Sistema completo para internet"

echo.
echo 🚀 Desplegando a Heroku...
git push heroku main

if errorlevel 1 (
    echo.
    echo ⚠️  Error en el despliegue. Intentando forzar...
    git push heroku main --force
)

echo.
echo ✅ ¡DESPLIEGUE COMPLETADO!
echo.
echo 🌐 Tu aplicación está disponible en:
echo    https://%APP_NAME%.herokuapp.com
echo.
echo 📱 Acceso desde cualquier dispositivo:
echo    ✅ Celular: Abrir navegador → https://%APP_NAME%.herokuapp.com
echo    ✅ Tablet: Mismo proceso
echo    ✅ PC: Mismo proceso
echo    ✅ Desde cualquier país: Funciona globalmente
echo.
echo 🔄 Para actualizar la aplicación en el futuro:
echo    1. Hacer cambios en el código
echo    2. git add .
echo    3. git commit -m "Actualización"
echo    4. git push heroku main
echo.

REM Abrir la aplicación en el navegador
echo 🌐 Abriendo aplicación en el navegador...
heroku open

pause
