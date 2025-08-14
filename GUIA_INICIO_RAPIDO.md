# 🚀 Guía de Inicio Rápido - Café Nare Balneario

¡Bienvenido al sistema de gestión para tu café! Esta guía te ayudará a tener la aplicación funcionando en menos de 5 minutos.

## ⚡ Instalación Express (3 pasos)

### 1️⃣ Instalar Dependencias
```bash
# Abrir terminal en la carpeta del proyecto
npm install
```

### 2️⃣ Iniciar la Aplicación
```bash
npm start
```

### 3️⃣ Abrir en el Navegador
Visita: **http://localhost:3000**

¡Listo! Ya tienes tu sistema funcionando con datos de ejemplo.

## 📱 Primer Uso

### Dashboard Inicial
Al abrir la aplicación verás:
- 📊 **Panel principal** con estadísticas
- 📦 **4 productos de ejemplo** (cafés, postres)
- 👥 **2 clientes de ejemplo**
- 💰 **Ventas de ejemplo**

### Crear tu Primer Producto
1. 📦 Ir a "Productos" en el menú
2. ➕ Clic en "Nuevo Producto"
3. ✏️ Llenar información:
   - **Nombre**: ej. "Cappuccino Grande"
   - **Categoría**: ej. "Bebidas Calientes"
   - **Precio**: ej. 4500
   - **Stock**: ej. 20
4. 💾 Guardar

### Realizar tu Primera Venta
1. 💰 Ir a "Ventas" → "Nueva Venta"
2. 🔍 Buscar producto por nombre
3. ➕ Agregar productos a la venta
4. 🎯 Completar venta

## 🎨 Características Principales

### ✅ Ya Incluido en la Aplicación:
- ✅ **Interfaz móvil-friendly**
- ✅ **Tema café profesional**
- ✅ **Productos con imágenes**
- ✅ **Control de inventario**
- ✅ **Sistema de ventas**
- ✅ **Gestión de clientes**
- ✅ **Dashboard en tiempo real**
- ✅ **Base de datos Excel automática**
- ✅ **Backups automáticos**
- ✅ **Responsive design**

## 🔧 Configuración Avanzada (Opcional)

### Google Sheets Integration
Si quieres usar Google Sheets en lugar de Excel:

1. **Copiar archivo de configuración:**
```bash
cp env.example .env
```

2. **Editar `.env`:**
```env
USE_GOOGLE_SHEETS=true
GOOGLE_SPREADSHEET_ID=tu_id_aqui
```

3. **Configurar credenciales:**
```bash
mkdir config
# Agregar google-credentials.json a config/
node scripts/setup-google-auth.js
```

### Personalización Rápida

#### Cambiar Nombre del Café
En `index.html`, línea 12:
```html
<title>Tu Café - Gestión</title>
```

#### Cambiar Colores
En `styles.css`, líneas 2-10:
```css
:root {
    --primary-brown: #8B4513;  /* Tu color principal */
    --cream: #FFF8DC;          /* Tu color claro */
    /* ... más colores */
}
```

## 📊 Datos Incluidos

### Productos de Ejemplo:
- ☕ **Café Americano** - $3,500
- ☕ **Cappuccino** - $4,500  
- 🥐 **Croissant** - $2,500
- 🧃 **Jugo de Naranja** - $3,000

### Clientes de Ejemplo:
- 👤 **María García** - 15 compras
- 👤 **Juan Pérez** - 8 compras

## 🔄 Comandos Útiles

```bash
# Crear backup manual
node scripts/backup.js create

# Ver backups disponibles
node scripts/backup.js list

# Limpiar archivos temporales
node scripts/cleanup.js all

# Modo desarrollo (recarga automática)
npm run dev
```

## 📱 Uso en Móvil

### Características Móviles:
- 📱 **Menú hamburguesa** para navegación
- 👆 **Botones grandes** fáciles de tocar
- 📊 **Diseño adaptable** a cualquier pantalla
- ⚡ **Carga rápida** en conexiones lentas

### Recomendaciones:
- 📌 **Agregar a pantalla de inicio** del móvil
- 🔄 **Usar en modo horizontal** para tablets
- 📶 **Funciona offline** con Excel local

## 🆘 Solución de Problemas

### Error: Puerto en uso
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <numero> /F

# Mac/Linux  
lsof -ti:3000 | xargs kill -9
```

### Error: No abre la aplicación
1. ✅ Verificar que Node.js esté instalado
2. ✅ Ejecutar `npm install` primero
3. ✅ Verificar que el puerto 3000 esté libre
4. 🌐 Abrir http://localhost:3000 en el navegador

### Error: No guarda datos
1. 📁 Verificar que se creó la carpeta `data/`
2. 💾 Verificar permisos de escritura
3. 🔄 Reiniciar la aplicación

## 📞 Soporte Rápido

### Preguntas Frecuentes:

**P: ¿Puedo usar en varios dispositivos?**
R: ✅ Sí, accede desde cualquier dispositivo en la misma red

**P: ¿Se pierden los datos al cerrar?**
R: ✅ No, todo se guarda automáticamente en Excel

**P: ¿Funciona sin internet?**
R: ✅ Sí, con Excel local funciona completamente offline

**P: ¿Puedo cambiar los colores?**
R: ✅ Sí, edita el archivo `styles.css`

## 🎯 Próximos Pasos

Una vez que tengas la aplicación funcionando:

1. 📦 **Agregar tus productos reales**
2. 👥 **Registrar tus clientes**
3. 💰 **Comenzar a registrar ventas**
4. 📊 **Monitorear el dashboard**
5. 🔄 **Configurar backups regulares**

## 🌟 ¡Disfruta tu nuevo sistema!

Tu café ahora tiene un sistema moderno y profesional para:
- ✅ Controlar inventario
- ✅ Registrar ventas
- ✅ Gestionar clientes
- ✅ Generar reportes
- ✅ Operar desde cualquier dispositivo

¡Que tengas muchas ventas exitosas! ☕️✨
