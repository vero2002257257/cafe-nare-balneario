# 📊 Guía Completa para Manejar Excel - Café Nare Balneario

Esta guía te enseña todo lo que necesitas saber sobre cómo funciona y se maneja el archivo Excel en tu sistema de café.

## 📁 ¿Dónde está mi archivo Excel?

Tu base de datos se guarda automáticamente en:
```
📂 CafeNareBalneario/
  └── 📂 data/
      ├── 📄 cafe_data.xlsx  ← Tu base de datos principal
      └── 📂 backups/
          ├── 📄 backup_2024-01-15_10-30-00.xlsx
          └── 📄 backup_2024-01-14_15-45-00.xlsx
```

## 🔄 ¿Cómo se crea el archivo Excel?

### Creación Automática
1. **Al iniciar la aplicación por primera vez**, se crea automáticamente `cafe_data.xlsx`
2. **Se crean 4 hojas** dentro del archivo:
   - 🛍️ **Productos** - Información de productos
   - 👥 **Clientes** - Base de datos de clientes  
   - 💰 **Ventas** - Registro de ventas
   - 📦 **DetalleVentas** - Productos vendidos en cada venta

### Estructura de las Hojas

#### 🛍️ Hoja "Productos"
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| id | Identificador único | prod_1 |
| name | Nombre del producto | Café Americano |
| description | Descripción | Café negro tradicional |
| category | Categoría | bebidas-calientes |
| price | Precio | 3500 |
| stock | Cantidad disponible | 50 |
| minStock | Stock mínimo | 10 |
| image | Ruta de imagen | /uploads/cafe1.jpg |
| createdAt | Fecha de creación | 2024-01-15T10:30:00Z |
| updatedAt | Última actualización | 2024-01-15T10:30:00Z |

#### 👥 Hoja "Clientes"
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| id | Identificador único | cust_1 |
| name | Nombre completo | María García |
| email | Correo electrónico | maria@email.com |
| phone | Teléfono | 300-123-4567 |
| totalPurchases | Total de compras | 15 |
| totalSpent | Total gastado | 67500 |
| lastPurchase | Última compra | 2024-01-15 |
| createdAt | Fecha de registro | 2024-01-15T10:30:00Z |
| updatedAt | Última actualización | 2024-01-15T10:30:00Z |

#### 💰 Hoja "Ventas"
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| id | Identificador único | sale_1 |
| customerId | ID del cliente | cust_1 |
| customerName | Nombre del cliente | María García |
| total | Total de la venta | 9500 |
| date | Fecha y hora | 2024-01-15T10:30:00Z |
| createdAt | Fecha de creación | 2024-01-15T10:30:00Z |

#### 📦 Hoja "DetalleVentas"
| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| id | Identificador único | sale_1_prod_1 |
| saleId | ID de la venta | sale_1 |
| productId | ID del producto | prod_1 |
| productName | Nombre del producto | Café Americano |
| quantity | Cantidad vendida | 2 |
| price | Precio unitario | 3500 |
| subtotal | Subtotal | 7000 |

## 📂 Cómo Abrir y Ver el Excel

### Opción 1: Microsoft Excel
1. Ir a la carpeta `data/`
2. Doble clic en `cafe_data.xlsx`
3. Se abre con Excel mostrando todas las hojas

### Opción 2: Google Sheets
1. Subir el archivo a Google Drive
2. Abrir con Google Sheets
3. Ver y editar online

### Opción 3: LibreOffice Calc (Gratis)
1. Descargar LibreOffice (gratis)
2. Abrir el archivo `.xlsx`
3. Funciona igual que Excel

## ✏️ ¿Puedo Editar el Excel Directamente?

### ⚠️ **¡IMPORTANTE!** 
- **SÍ puedes editarlo**, pero sigue estas reglas:
- **NUNCA cambies los nombres de las hojas**
- **NUNCA elimines las columnas de encabezado**
- **SIEMPRE haz backup antes de editar**

### ✅ Ediciones Seguras:

#### 1. **Agregar Productos Manualmente**
```excel
En la hoja "Productos":
id: prod_nuevo_1
name: Latte Vainilla
description: Café con leche y vainilla
category: bebidas-calientes
price: 4800
stock: 25
minStock: 5
image: (dejar vacío)
createdAt: 2024-01-15T12:00:00Z
updatedAt: 2024-01-15T12:00:00Z
```

#### 2. **Actualizar Stock**
```excel
Cambiar valor en columna "stock":
Antes: 50
Después: 45
```

#### 3. **Actualizar Precios**
```excel
Cambiar valor en columna "price":
Antes: 3500
Después: 3800
```

#### 4. **Agregar Clientes**
```excel
En la hoja "Clientes":
id: cust_nuevo_1
name: Carlos López
email: carlos@email.com
phone: 300-555-1234
totalPurchases: 0
totalSpent: 0
lastPurchase: (dejar vacío)
createdAt: 2024-01-15T12:00:00Z
updatedAt: 2024-01-15T12:00:00Z
```

### ❌ NO Hagas Esto:
- ❌ Cambiar nombres de hojas (Productos, Clientes, etc.)
- ❌ Eliminar columnas de encabezado
- ❌ Cambiar el orden de las columnas
- ❌ Usar caracteres especiales en IDs
- ❌ Dejar campos obligatorios vacíos

## 🔄 Sincronización con la Aplicación

### ¿Cuándo se actualiza el Excel?
- ✅ **Cada vez que agregas un producto** en la app
- ✅ **Cada vez que haces una venta**
- ✅ **Cada vez que registras un cliente**
- ✅ **Cada vez que actualizas stock**

### ¿Cuándo lee la app el Excel?
- ✅ **Al iniciar la aplicación**
- ✅ **Al cargar cada sección** (productos, clientes, etc.)
- ✅ **Al hacer consultas** del dashboard

### Para Ver Cambios del Excel en la App:
1. **Guardar el archivo Excel**
2. **Reiniciar la aplicación** (`Ctrl+C` y `npm start`)
3. **Refrescar el navegador** (`F5`)

## 💾 Sistema de Backups

### Backups Automáticos
La aplicación crea backups automáticamente en `data/backups/`:
```
📂 backups/
├── backup_2024-01-15_10-30-00.xlsx
├── backup_2024-01-15_15-45-00.xlsx
└── backup_2024-01-16_09-15-00.xlsx
```

### Crear Backup Manual
```bash
# Desde terminal en la carpeta del proyecto
node scripts/backup.js create
```

### Ver Backups Disponibles
```bash
node scripts/backup.js list
```

### Restaurar un Backup
```bash
node scripts/backup.js restore backup_2024-01-15_10-30-00.xlsx
```

## 🔧 Comandos Útiles para Excel

### Verificar Estado del Archivo
```bash
# Ver si el archivo existe y está bien
node -e "console.log('Excel:', require('fs').existsSync('./data/cafe_data.xlsx') ? '✅ OK' : '❌ No encontrado')"
```

### Recrear Archivo Excel (Si se daña)
```bash
# Eliminar archivo dañado
del data\cafe_data.xlsx

# Reiniciar aplicación (recreará el archivo)
npm start
```

### Exportar Datos
```bash
# Crear copia para exportar
node scripts/backup.js create
```

## 📊 Análisis de Datos en Excel

### Fórmulas Útiles

#### 1. **Total de Ventas del Día**
```excel
En una celda nueva:
=SUMIFS(Ventas[total], Ventas[date], ">=2024-01-15", Ventas[date], "<2024-01-16")
```

#### 2. **Producto Más Vendido**
```excel
=INDEX(DetalleVentas[productName], MATCH(MAX(DetalleVentas[quantity]), DetalleVentas[quantity], 0))
```

#### 3. **Cliente que Más Gasta**
```excel
=INDEX(Clientes[name], MATCH(MAX(Clientes[totalSpent]), Clientes[totalSpent], 0))
```

#### 4. **Productos con Stock Bajo**
```excel
Filtrar donde: stock <= minStock
```

### Crear Gráficos
1. **Seleccionar datos** de ventas
2. **Insertar → Gráficos**
3. **Elegir tipo** (barras, líneas, pastel)
4. **Personalizar** colores y títulos

## 🔍 Solución de Problemas

### Problema: Excel no se actualiza
**Solución:**
1. Cerrar Excel si está abierto
2. Reiniciar la aplicación
3. Verificar permisos de escritura

### Problema: Archivo corrupto
**Solución:**
```bash
# Restaurar desde backup
node scripts/backup.js list
node scripts/backup.js restore nombre_del_backup.xlsx
```

### Problema: Datos inconsistentes
**Solución:**
1. Verificar que no falten columnas obligatorias
2. Verificar que los IDs sean únicos
3. Verificar formato de fechas (ISO 8601)

### Problema: No puedo editar el archivo
**Solución:**
1. Cerrar la aplicación (`Ctrl+C`)
2. Cerrar Excel si está abierto
3. Verificar permisos de la carpeta

## 📱 Integración con Google Sheets

### Migrar de Excel a Google Sheets
1. **Subir archivo** a Google Drive
2. **Configurar credenciales** de Google
3. **Cambiar configuración**:
```bash
# Editar .env
USE_GOOGLE_SHEETS=true
GOOGLE_SPREADSHEET_ID=tu_id_aqui
```

### Ventajas de Google Sheets
- ✅ **Acceso desde cualquier lugar**
- ✅ **Sincronización automática**
- ✅ **Colaboración en tiempo real**
- ✅ **Backups automáticos en la nube**

## 🎯 Mejores Prácticas

### 1. **Backups Regulares**
- Crear backup antes de cambios importantes
- Mantener al menos 3 backups recientes
- Probar restauración ocasionalmente

### 2. **Validación de Datos**
- Verificar que precios sean números
- Verificar que stocks sean positivos
- Verificar formato de emails

### 3. **Organización**
- Usar IDs descriptivos pero únicos
- Mantener categorías consistentes
- Actualizar fechas correctamente

### 4. **Seguridad**
- No compartir el archivo en redes públicas
- Hacer backup antes de actualizaciones
- Verificar cambios antes de guardar

## 📞 Soporte

### Problemas Comunes
- **Excel no abre**: Instalar Microsoft Office o LibreOffice
- **Permisos denegados**: Ejecutar como administrador
- **Archivo corrupto**: Restaurar desde backup
- **Datos perdidos**: Verificar carpeta de backups

### Contacto
- 📧 Revisar `README.md` para documentación completa
- 🔧 Usar `scripts/backup.js` para gestión de archivos
- 🆘 Revisar `GUIA_INICIO_RAPIDO.md` para soluciones

---

¡Con esta guía ya puedes manejar completamente tu archivo Excel! 📊✨
