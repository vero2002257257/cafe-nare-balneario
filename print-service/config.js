module.exports = {
    printer: {
        name: 'POSPrinter POS-80C',
        width: 32, // caracteres por línea
        encoding: 'CP850', // para soporte de ñ y acentos
        options: {
            timeout: 3000,
            paperWidth: 58, // mm
            paperCut: false, // esta impresora no tiene cortador
            feed: 4 // líneas de feed al final
        }
    },
    server: {
        port: 18080,
        token: 'SECRETO_123' // Cambiar en producción
    }
};
