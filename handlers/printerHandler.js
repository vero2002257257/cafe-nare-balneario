const { ThermalPrinter, Types: PrinterTypes } = require('node-thermal-printer');
const printerConfig = require('./printerConfig');

class PrinterHandler {
    constructor() {
        this.printer = null;
        this.isInitialized = false;
        this.config = printerConfig;
    }

    async initialize() {
        try {
            // MPR-200 específicamente usa una configuración más simple
            this.printer = new ThermalPrinter({
                type: PrinterTypes.STAR, // MPR-200 es compatible con comandos STAR
                interface: 'bluetooth', // Siempre será bluetooth para MPR-200
                options: this.config.printer.options,
                width: 32, // MPR-200 usa 32 caracteres de ancho
                characterSet: 'CHINA', // Mejor soporte para caracteres especiales
                removeSpecialCharacters: false
            });
            
            this.isInitialized = true;
            console.log('MPR-200 printer initialized');
            return true;
        } catch (error) {
            console.error('Error initializing MPR-200:', error);
            this.isInitialized = false;
            throw error;
        }
    }

    async printReceipt(saleData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Header - MPR-200 tiene un ancho más limitado
            this.printer.alignCenter();
            this.printer.bold(true);
            this.printer.println(this.config.receipt.businessName);
            this.printer.bold(false);
            this.printer.println('================================');

            // Date and time
            this.printer.alignLeft();
            const now = new Date();
            this.printer.println(`Fecha: ${now.toLocaleDateString('es-ES', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            })}`);
            this.printer.println(`Hora: ${now.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
            })}`);
            this.printer.println('--------------------------------');

            // Items - Formato optimizado para MPR-200
            this.printer.alignLeft();
            saleData.items.forEach(item => {
                this.printer.println(item.productName);
                this.printer.println(`${item.quantity} x $${item.price.toFixed(2)}`);
                this.printer.alignRight();
                this.printer.println(`$${(item.price * item.quantity).toFixed(2)}`);
                this.printer.alignLeft();
                this.printer.println('--------------------------------');
            });

            // Total - Formato más visible para MPR-200
            this.printer.alignRight();
            this.printer.bold(true);
            this.printer.println(`TOTAL: $${saleData.total.toFixed(2)}`);
            this.printer.bold(false);

            // Footer - Optimizado para MPR-200
            this.printer.println('================================');
            this.printer.alignCenter();
            this.printer.println(this.config.receipt.footerMessage);
            this.printer.println(''); // Espacio extra para el corte manual
            this.printer.println(''); // La MPR-200 no tiene cortador automático
            this.printer.println(''); // Tres líneas en blanco para corte manual

            // Enviar a imprimir
            await this.printer.execute();
            console.log('Impresión completada en MPR-200');
            return true;
        } catch (error) {
            console.error('Error printing receipt:', error);
            throw error;
        }
    }
}

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }
}

module.exports = PrinterHandler;
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

module.exports = new PrinterHandler();
