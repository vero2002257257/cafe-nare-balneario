# ☕ Café Nare Balneario - Sistema de Gestión

Una aplicación web completa y moderna para la gestión integral de tu negocio de café. Maneja productos, inventario, ventas y clientes con una interfaz intuitiva y móvil-friendly.

![Café Nare Balneario](https://img.shields.io/badge/Estado-Listo%20para%20Producción-brightgreen)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-green)

## 🌟 Características Principales

### 📱 **Interfaz Móvil-Friendly**
- Diseño responsive que se adapta a cualquier dispositivo
- Menú hamburguesa para navegación intuitiva en móviles
- Optimizado para tablets y smartphones

### 🎨 **Tema Café Profesional**
- Colores cálidos: marrón, beige, crema y verde café
- Tipografía moderna (Poppins) y legible
- Animaciones suaves y transiciones elegantes
- Iconos de Font Awesome

### 📦 **Gestión de Productos**
- Crear, editar y eliminar productos
- Campos: nombre, descripción, categoría, precio, stock
- Subida de imágenes para productos
- Vista en tarjetas o lista
- Filtros por categoría y búsqueda

### 📊 **Control de Inventario**
- Monitoreo de stock en tiempo real
- Alertas de stock bajo automáticas
- Actualización manual de inventario
- Estados visuales (Normal, Bajo, Crítico)

### 💰 **Sistema de Ventas**
- Interfaz intuitiva para crear ventas
- Selección rápida de productos
- Control de cantidades con validación de stock
- Registro automático de transacciones
- Historial completo de ventas

### 👥 **Gestión de Clientes**
- Base de datos de clientes frecuentes
- Historial de compras por cliente
- Estadísticas de compras y gastos totales
- Información de contacto

### 📈 **Dashboard Ejecutivo**
- Resumen de ventas del día
- Estadísticas en tiempo real
- Alertas de stock bajo
- Ventas recientes

### 💾 **Almacenamiento Flexible**
- **Excel**: Archivos locales (.xlsx) para uso offline
- **Google Sheets**: Sincronización en la nube en tiempo real
- Backups automáticos
- Exportación de datos

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js 16+ instalado
- npm o yarn
- Navegador web moderno

### 1. Clonar e Instalar
```bash
# Descargar el proyecto
git clone <url-del-proyecto>
cd CafeNareBalneario

# Instalar dependencias
npm install
```

### 2. Configuración Básica (Excel)
```bash
# Crear carpeta de datos
mkdir data

# Iniciar aplicación
npm start
```

La aplicación estará disponible en: **http://localhost:3000**

### 3. Configuración Avanzada (Google Sheets)

Para usar Google Sheets como base de datos:

#### A. Configurar Google Cloud Project
1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar existente
3. Habilitar Google Sheets API
4. Crear credenciales (OAuth 2.0)
5. Descargar el archivo JSON de credenciales

#### B. Configurar la Aplicación
```bash
# Crear carpeta de configuración
mkdir config

# Copiar credenciales de Google
cp /ruta/a/credenciales.json config/google-credentials.json

# Crear archivo de entorno
echo "USE_GOOGLE_SHEETS=true" > .env
echo "GOOGLE_SPREADSHEET_ID=tu_spreadsheet_id" >> .env
```

#### C. Obtener Token de Autenticación
```bash
# Ejecutar script de configuración
node scripts/setup-google-auth.js
```

#### D. Crear Spreadsheet
1. Crear un Google Spreadsheet nuevo
2. Copiar el ID del URL (parte entre `/d/` y `/edit`)
3. Agregarlo al archivo `.env`

### 4. Iniciar la Aplicación
```bash
# Modo desarrollo (con recarga automática)
npm run dev

# Modo producción
npm start
```

## 📱 Uso de la Aplicación

### Dashboard Principal
- **Ventas del día**: Muestra el total de ventas de hoy
- **Productos**: Contador total de productos activos
- **Stock bajo**: Alerta de productos con inventario crítico
- **Clientes**: Total de clientes registrados

### Gestión de Productos

#### Crear Producto
1. Ir a "Productos" en el menú
2. Clic en "Nuevo Producto"
3. Llenar información:
   - **Nombre**: Obligatorio
   - **Descripción**: Opcional
   - **Categoría**: Obligatorio (Bebidas Calientes, Frías, Postres, etc.)
   - **Precio**: Obligatorio
   - **Stock inicial**: Obligatorio
   - **Stock mínimo**: Para alertas (default: 5)
   - **Imagen**: Opcional (máximo 5MB)

#### Editar/Eliminar
- Usar botones de acción en cada tarjeta de producto
- Los cambios se guardan automáticamente

### Sistema de Ventas

#### Crear Nueva Venta
1. Ir a "Ventas" → "Nueva Venta"
2. Seleccionar cliente (opcional)
3. Buscar y agregar productos:
   - Escribir nombre del producto
   - Seleccionar de sugerencias
   - Ajustar cantidades
4. Revisar total
5. "Completar Venta"

### Gestión de Inventario
- Ver stock actual de todos los productos
- Estados visuales:
  - 🟢 **Normal**: Stock suficiente
  - 🟡 **Bajo**: Stock por debajo del mínimo
  - 🔴 **Crítico**: Stock agotado

### Clientes
- Registrar nuevos clientes con nombre, email y teléfono
- Ver estadísticas automáticas de compras
- Historial de transacciones

## 🛠️ Configuración Avanzada

### Variables de Entorno
Crear archivo `.env` en la raíz:

```env
# Puerto del servidor
PORT=3000

# Configuración de Google Sheets
USE_GOOGLE_SHEETS=false
GOOGLE_SPREADSHEET_ID=tu_id_aqui

# Configuración de uploads
MAX_FILE_SIZE=5242880

# Configuración de base de datos
EXCEL_FILE_PATH=./data/cafe_data.xlsx
```

### Estructura de Carpetas
```
CafeNareBalneario/
├── 📁 config/              # Configuración
│   ├── google-credentials.json
│   └── google-token.json
├── 📁 data/                # Base de datos Excel
│   ├── cafe_data.xlsx
│   └── 📁 backups/
├── 📁 handlers/            # Manejadores de datos
│   ├── excelHandler.js
│   └── googleSheetsHandler.js
├── 📁 uploads/             # Imágenes de productos
├── 📁 scripts/             # Scripts auxiliares
├── 📄 server.js            # Servidor principal
├── 📄 index.html           # Aplicación web
├── 📄 styles.css           # Estilos
├── 📄 script.js            # JavaScript frontend
└── 📄 package.json         # Dependencias
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start

# Crear backup manual
node scripts/backup.js

# Limpiar uploads antiguos
node scripts/cleanup.js

# Configurar Google Sheets
node scripts/setup-google-auth.js
```

## 📊 API Endpoints

### Productos
- `GET /api/products` - Obtener todos los productos
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `PUT /api/products/:id/stock` - Actualizar stock
- `DELETE /api/products/:id` - Eliminar producto

### Clientes
- `GET /api/customers` - Obtener clientes
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente

### Ventas
- `GET /api/sales` - Obtener ventas
- `POST /api/sales` - Crear venta
- `GET /api/sales/:id` - Obtener venta específica

### Reportes
- `GET /api/reports/dashboard` - Datos del dashboard
- `GET /api/reports/sales` - Reporte de ventas

### Utilidades
- `GET /api/health` - Estado del servidor
- `POST /api/backup` - Crear backup
- `GET /api/export/excel` - Exportar a Excel

## 🎨 Personalización

### Colores del Tema
Modificar en `styles.css`:
```css
:root {
    --primary-brown: #8B4513;    /* Marrón principal */
    --light-brown: #D2B48C;      /* Marrón claro */
    --dark-brown: #5D2F0A;       /* Marrón oscuro */
    --cream: #FFF8DC;            /* Crema */
    --beige: #F5F5DC;            /* Beige */
    --coffee-green: #6B8E23;     /* Verde café */
}
```

### Logo y Branding
- Reemplazar el ícono en el header
- Modificar el título en `index.html`
- Agregar logo en la carpeta `assets/`

## 🚀 Despliegue en Producción

### Opción 1: Servidor Local
```bash
# Instalar PM2 para gestión de procesos
npm install -g pm2

# Iniciar con PM2
pm2 start server.js --name cafe-nare

# Configurar inicio automático
pm2 startup
pm2 save
```

### Opción 2: Heroku
```bash
# Instalar Heroku CLI
# Crear aplicación
heroku create cafe-nare-balneario

# Configurar variables de entorno
heroku config:set USE_GOOGLE_SHEETS=true
heroku config:set GOOGLE_SPREADSHEET_ID=tu_id

# Desplegar
git push heroku main
```

### Opción 3: VPS/Cloud
1. Subir archivos al servidor
2. Instalar Node.js
3. Configurar nginx como proxy reverso
4. Instalar certificado SSL
5. Configurar firewall

## 🔒 Seguridad

### Buenas Prácticas Implementadas
- ✅ Validación de datos en frontend y backend
- ✅ Sanitización de uploads
- ✅ Límites de tamaño de archivo
- ✅ Headers de seguridad CORS
- ✅ Manejo seguro de errores

### Recomendaciones Adicionales
- Usar HTTPS en producción
- Configurar firewall
- Backup regular de datos
- Monitoreo de logs
- Actualizar dependencias regularmente

## 🐛 Solución de Problemas

### Error: Puerto en uso
```bash
# Encontrar proceso usando el puerto
netstat -ano | findstr :3000

# Terminar proceso (Windows)
taskkill /PID <pid> /F

# Terminar proceso (Linux/Mac)
kill -9 <pid>
```

### Error: Google Sheets no conecta
1. Verificar credenciales en `config/google-credentials.json`
2. Verificar token en `config/google-token.json`
3. Verificar permisos del spreadsheet
4. Ejecutar `node scripts/setup-google-auth.js`

### Error: Archivo Excel corrupto
```bash
# Restaurar desde backup
cp data/backups/backup_<fecha>.xlsx data/cafe_data.xlsx

# O crear archivo nuevo
rm data/cafe_data.xlsx
npm start
```

### Error: Imágenes no cargan
1. Verificar carpeta `uploads/` existe
2. Verificar permisos de escritura
3. Verificar tamaño de archivo (máx 5MB)

## 📞 Soporte

### Contacto
- **Email**: soporte@cafenare.com
- **Teléfono**: +57 300 123 4567
- **Horario**: Lunes a Viernes, 8:00 AM - 6:00 PM

### Recursos Útiles
- [Documentación de Node.js](https://nodejs.org/docs/)
- [Guía de Google Sheets API](https://developers.google.com/sheets/api)
- [Font Awesome Icons](https://fontawesome.com/icons)

## 📄 Licencia

MIT License - Puedes usar, modificar y distribuir libremente.

## 🙏 Créditos

Desarrollado con ❤️ para **Café Nare Balneario**

### Tecnologías Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Base de Datos**: Excel (xlsx) / Google Sheets
- **UI**: Font Awesome, Google Fonts (Poppins)
- **Deployment**: PM2, Heroku-ready

---

¡Gracias por elegir nuestro sistema de gestión para tu café! ☕✨
