const express = require('express');
const cors = require('cors');
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;
const config = require('./config');
const app = express();

app.use(cors());
app.use(express.json());

// Middleware de autenticación
function checkToken(req, res, next) {
    const token = req.headers['x-print-token'];
    // Durante pruebas, aceptamos el token en query params o headers
    const queryToken = req.query.token;
    
    if (token === config.server.token || queryToken === config.server.token) {
        return next();
    }
    
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️ Advertencia: Acceso sin token válido en modo desarrollo');
        return next();
    }
    
    return res.status(401).json({ error: 'Token inválido' });
}

// Inicializar impresora
async function initPrinter() {
    const printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: 'printer:' + config.printer.name,
        characterSet: 'PC850_MULTILINGUAL',
        removeSpecialCharacters: false,
        width: config.printer.width,
        options: config.printer.options
    });
    
    return printer;
}

// Formatear precio
function formatPrice(amount) {
    return amount.toLocaleString('es-CO');
}

// Imprimir ticket
async function printTicket(printer, ticket) {
    try {
        // Encabezado
        printer.alignCenter();
        printer.bold(true);
        printer.println(ticket.header.title);
        printer.println('Factura #' + ticket.header.invoice);
        printer.bold(false);
        printer.println(ticket.header.datetime);
        printer.println('Cajero: ' + ticket.header.cashier);
        
        printer.drawLine();
        
        // Items
        printer.alignLeft();
        ticket.items.forEach(item => {
            const itemText = item.qty + 'x ' + item.name;
            const price = formatPrice(item.price);
            const line = itemText + ' '.repeat(Math.max(0, 32 - itemText.length - price.length)) + price;
            printer.println(line);
        });
        
        printer.drawLine();
        
        // Totales
        printer.alignRight();
        printer.println('Subtotal: ' + formatPrice(ticket.totals.subtotal));
        printer.println('IVA: ' + formatPrice(ticket.totals.iva));
        printer.bold(true);
        printer.println('TOTAL: ' + formatPrice(ticket.totals.total));
        printer.bold(false);
        
        printer.drawLine();
        
        // Forma de pago
        printer.alignLeft();
        printer.println('Pago: ' + ticket.footer.pay);
        if (ticket.footer.change > 0) {
            printer.println('Cambio: ' + formatPrice(ticket.footer.change));
        }
        
        // Pie de página
        printer.alignCenter();
        printer.println('');
        printer.println(ticket.footer.message);
        
        // Feed final
        printer.feed(4);
        
        return await printer.execute();
    } catch (error) {
        throw error;
    }
}

// Endpoint para imprimir
app.post('/print', checkToken, async (req, res) => {
    try {
        const ticketData = req.body;
        const printer = await initPrinter();
        
        const isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            throw new Error('Impresora no conectada');
        }
        
        await printTicket(printer, ticketData);
        
        res.json({ 
            success: true, 
            message: 'Ticket impreso correctamente' 
        });
    } catch (error) {
        console.error('Error procesando ticket:', error);
        res.status(500).json({ 
            error: 'Error al imprimir', 
            details: error.message 
        });
    }
});

// Endpoint para verificar estado
app.get('/status', checkToken, async (req, res) => {
    try {
        const printer = await initPrinter();
        const isConnected = await printer.isPrinterConnected();
        
        res.json({
            success: true,
            printer: {
                name: config.printer.name,
                connected: isConnected,
                ready: isConnected
            }
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Error obteniendo estado', 
            details: error.message 
        });
    }
});

const port = config.server.port || 18080;
app.listen(port, () => {
    console.log('Servicio de impresión escuchando en http://localhost:' + port);
});