# Servicio de Impresión Térmica

Este es el servicio de impresión térmica para Café Nare Balneario. Se encarga de recibir las solicitudes de impresión y enviarlas a la impresora térmica AON MPR-200.

## Requisitos

- Node.js instalado
- Impresora térmica AON MPR-200 instalada y configurada en Windows como "POSPrinter POS-80C"

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Iniciar el servicio:
```bash
npm start
```

El servicio estará disponible en http://localhost:18080

## Uso

El servicio acepta solicitudes POST en la ruta `/print` con un token de autenticación.

El token puede ser enviado de dos formas:
1. Como header: `X-Print-Token: SECRETO_123`
2. Como parámetro en la URL: `?token=SECRETO_123`

## Configuración

La configuración se encuentra en `config.js`. Puedes ajustar:

- Nombre de la impresora
- Ancho del papel
- Puerto del servidor
- Token de autenticación
