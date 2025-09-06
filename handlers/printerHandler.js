class PrinterHandler {
    constructor() {
        this.config = {
            businessName: 'CAFÉ NARE BALNEARIO',
            businessType: 'Cafetería',
            address: 'Balneario Alejandrino',
            phone: 'Tel: 3128946326',
            website: 'cafenare.alejandrino'
        };
    }

    async printReceipt(saleData) {
        const html = this.generateReceiptHTML(saleData);
        return { 
            html,
            print: true,
            preview: true
        };
    }

    generateReceiptHTML(saleData) {
        const date = new Date();
        const formattedDate = date.toLocaleDateString();
        const formattedTime = date.toLocaleTimeString();

        let itemsHtml = '';
        let total = 0;

        // Generar HTML para cada item
        saleData.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemsHtml += `
                <tr>
                    <td>${item.quantity}x ${item.name}</td>
                    <td style="text-align: right">$${itemTotal.toFixed(2)}</td>
                </tr>`;
        });

        // Plantilla completa del recibo
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: monospace;
                        margin: 0;
                        padding: 20px;
                        max-width: 300px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .business-name {
                        font-size: 20px;
                        font-weight: bold;
                    }
                    .info {
                        font-size: 14px;
                        margin: 5px 0;
                    }
                    .divider {
                        border-top: 1px dashed #000;
                        margin: 10px 0;
                    }
                    table {
                        width: 100%;
                        margin: 10px 0;
                    }
                    .total {
                        font-size: 16px;
                        font-weight: bold;
                        text-align: right;
                        margin-top: 10px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="business-name">${this.config.businessName}</div>
                    <div class="info">${this.config.businessType}</div>
                    <div class="info">${this.config.address}</div>
                    <div class="info">${this.config.phone}</div>
                </div>
                
                <div class="divider"></div>
                
                <div class="info">
                    Fecha: ${formattedDate}<br>
                    Hora: ${formattedTime}<br>
                    Ticket #: ${saleData.id || 'N/A'}
                </div>
                
                <div class="divider"></div>
                
                <div>ITEMS:</div>
                <table>
                    ${itemsHtml}
                </table>
                
                <div class="divider"></div>
                
                <div class="total">
                    TOTAL: $${total.toFixed(2)}
                </div>
                
                <div class="divider"></div>
                
                <div class="footer">
                    ¡Gracias por su visita!<br>
                    Esperamos verlo pronto<br>
                    ${this.config.website}
                </div>
            </body>
            </html>
        `;
    }
}

module.exports = PrinterHandler;
