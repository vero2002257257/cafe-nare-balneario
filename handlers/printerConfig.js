module.exports = {
    printer: {
        type: 'network',
        interface: 'bluetooth',
        options: {
            width: 32,
            encoding: 'gb18030',
            characterSet: 'CHINA',
            removeSpecialCharacters: false,
            appendToBuffer: true,
            openCashDrawer: false,
            timeout: 3000
        }
    },
    receipt: {
        businessName: 'CAFÉ ÑARE BALNEARIO',
        footerMessage: '¡Gracias por su compra!',
        printCopies: 1
    }
};
