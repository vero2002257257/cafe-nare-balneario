# 🎯 Configuración de Loyverse API para Impresión Automática

## 📋 Resumen
Esta guía te ayudará a integrar tu sistema de Café Nare con Loyverse POS para lograr **impresión automática** de tickets sin que los empleados cambien de aplicación.

## 🎯 **Resultado Final**
- ✅ **Empleados usan SOLO tu sistema** 
- ✅ **Impresión automática** en impresora térmica Bluetooth
- ✅ **Sin apps adicionales** para empleados
- ✅ **Flujo transparente** y rápido

---

## 📱 Fase 1: Configurar Loyverse POS en la Tablet

### 1.1 Instalar Loyverse POS
```bash
1. Abrir Google Play Store en la tablet
2. Buscar "Loyverse POS" 
3. Instalar la aplicación oficial
4. Crear cuenta o iniciar sesión
```

### 1.2 Configurar el Café
```bash
1. Abrir Loyverse POS
2. Crear nuevo negocio: "Café Nare Balneario"
3. Configurar información básica:
   - Nombre: Café Nare Balneario
   - Tipo: Café/Restaurante
   - Moneda: Peso Colombiano (COP)
```

### 1.3 Conectar Impresora Térmica
```bash
1. En Loyverse POS → Configuración → Impresoras
2. Agregar nueva impresora
3. Seleccionar "Bluetooth"
4. Buscar y emparejar la impresora PT-210
5. Probar impresión → Debe funcionar ✓
```

---

## 🔧 Fase 2: Configurar API de Loyverse

### 2.1 Acceder al Back Office
```bash
1. Ir a https://loyverse.com
2. Iniciar sesión con tu cuenta
3. Entrar al "Back Office"
```

### 2.2 Crear Token de API
```bash
1. En Back Office → Configuración → Access Tokens
2. Hacer clic en "+ Add access token"
3. Configurar:
   - Nombre: "Cafe Nare Integration"
   - Permisos: Todos los disponibles
   - Fecha expiración: Sin expiración o 1 año
4. Copiar el TOKEN generado (¡Guardarlo seguro!)
```

### 2.3 Obtener Store ID
```bash
1. En Back Office → Configuración → Tiendas
2. Copiar el ID de tu tienda
3. Formato: algo como "store_xxxxxxxxx"
```

---

## 🎯 Fase 3: Configurar Integración en tu Sistema

### 3.1 Activar Modo Administrador
```bash
1. Abrir tu sistema de Café Nare
2. Clic en "Modo Administrador" (sidebar)
3. Contraseña: CAFE2024
4. ¡Ya eres admin! ✓
```

### 3.2 Configurar Loyverse API
```bash
1. En Dashboard → "Configurar Loyverse" (botón nuevo)
2. Pegar el ACCESS TOKEN de Loyverse
3. Pegar el STORE ID de Loyverse
4. ¡Configuración guardada! ✓
```

---

## 🚀 Fase 4: Probar la Integración

### 4.1 Hacer Venta de Prueba
```bash
1. Ir a Ventas en tu sistema
2. Agregar productos al carrito
3. Completar venta
4. ¡Debe imprimir automáticamente! 🎫
```

### 4.2 Verificar en Loyverse
```bash
1. Abrir Loyverse POS en la tablet
2. Revisar historial de ventas
3. La venta debe aparecer ahí ✓
```

---

## 🎯 Flujo Final de Trabajo

### Para Empleados (Super Simple):
1. **Abrir tu sistema** Café Nare en tablet
2. **Hacer venta** normalmente 
3. **Completar venta** → ¡Automáticamente imprime!
4. **¡Fin!** - Sin cambiar de app

### Lo que pasa por detrás:
1. Sistema registra venta en Google Sheets ✓
2. Sistema envía venta a Loyverse API ✓ 
3. Loyverse activa impresión automática ✓
4. Ticket sale de impresora térmica ✓

---

## 🛠️ Solución de Problemas

### ❌ "Error al sincronizar con Loyverse"
- **Causa**: Token o Store ID incorrectos
- **Solución**: Verificar configuración en modo admin

### ❌ "No imprime automáticamente"
- **Causa**: Impresora no configurada en Loyverse
- **Solución**: Reconectar impresora en Loyverse POS

### ❌ "Venta no aparece en Loyverse"
- **Causa**: Problemas de conexión API
- **Solución**: Verificar internet y configuración

---

## 📞 Soporte

Si necesitas ayuda:
1. **Revisar logs** en consola del navegador (F12)
2. **Verificar configuración** en modo administrador  
3. **Probar conexión** a Loyverse directamente

---

## 🎉 ¡Felicidades!

¡Ya tienes integración completa con impresión automática! 

**Tu flujo ahora es:**
- ✅ **Una sola app** para empleados
- ✅ **Impresión automática** sin intervención
- ✅ **Sincronización** con sistema profesional
- ✅ **Control total** desde tu sistema

**¡Tu café ahora es 100% profesional! ☕🎫**
