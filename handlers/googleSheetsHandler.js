const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetsHandler {
    constructor() {
        this.credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || './google-credentials.json';
        this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
        this.auth = null;
        this.sheets = null;
        
        this.sheetNames = {
            products: 'Productos',
            customers: 'Clientes', 
            sales: 'Ventas'
        };
        
        this.ranges = {
            products: 'Productos!A:F',
            customers: 'Clientes!A:E',
            sales: 'Ventas!A:F'
        };
    }

    async initialize() {
        try {
            // Check if Google Sheets is properly configured
            if (!this.spreadsheetId) {
                throw new Error('GOOGLE_SHEETS_ID environment variable not set');
            }

            if (!fs.existsSync(this.credentialsPath)) {
                throw new Error('Google credentials file not found. Please add google-credentials.json to project root');
            }

            await this.authenticate();
            await this.validateSpreadsheet();
            
            console.log('Google Sheets handler initialized successfully');
        } catch (error) {
            console.error('Error initializing Google Sheets handler:', error);
            throw error;
        }
    }

    async authenticate() {
        try {
            const credentials = JSON.parse(fs.readFileSync(this.credentialsPath));
            
            // Use Service Account authentication
            this.auth = new google.auth.GoogleAuth({
                credentials: credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });
            
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            
        } catch (error) {
            console.error('Error authenticating with Google Sheets:', error);
            throw error;
        }
    }

    async validateSpreadsheet() {
        try {
            // Check if spreadsheet exists and has required sheets
            const spreadsheet = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            
            const existingSheets = spreadsheet.data.sheets.map(sheet => sheet.properties.title);
            
            // Create missing sheets
            for (const [key, sheetName] of Object.entries(this.sheetNames)) {
                if (!existingSheets.includes(sheetName)) {
                    await this.createSheet(sheetName, this.getSheetHeaders(key));
                }
            }
            
        } catch (error) {
            console.error('Error validating spreadsheet:', error);
            throw error;
        }
    }

    getSheetHeaders(sheetType) {
        const headers = {
            products: ['id', 'nombre', 'categoria', 'precio', 'stock', 'descripcion'],
            customers: ['id', 'nombre', 'telefono', 'email', 'fechaRegistro'],
            sales: ['id', 'fecha', 'clienteId', 'productos', 'total', 'vendedor']
        };
        
        return headers[sheetType] || [];
    }

    async createSheet(sheetName, headers) {
        try {
            // Add the sheet
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: this.spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });
            
            // Add headers
            if (headers.length > 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.spreadsheetId,
                    range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [headers]
                    }
                });
            }
            
            console.log(`Created sheet: ${sheetName}`);
        } catch (error) {
            console.error(`Error creating sheet ${sheetName}:`, error);
            throw error;
        }
    }

    async readSheet(range) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: range
            });
            
            const rows = response.data.values || [];
            if (rows.length === 0) return [];
            
            const headers = rows[0];
            const data = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
            
            return data;
        } catch (error) {
            console.error(`Error reading sheet ${range}:`, error);
            return [];
        }
    }

    async writeSheet(range, data, headers) {
        try {
            const values = [headers, ...data.map(item => headers.map(header => item[header] || ''))];
            
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: { values }
            });
            
        } catch (error) {
            console.error(`Error writing to sheet ${range}:`, error);
            throw error;
        }
    }

    async appendToSheet(range, data, headers) {
        try {
            const values = data.map(item => headers.map(header => item[header] || ''));
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });
            
        } catch (error) {
            console.error(`Error appending to sheet ${range}:`, error);
            throw error;
        }
    }

    // Products methods
    async getProducts() {
        return await this.readSheet(this.ranges.products);
    }

    async addProduct(productData) {
        try {
            const headers = this.getSheetHeaders('products');
            await this.appendToSheet(this.ranges.products, [productData], headers);
            return productData;
        } catch (error) {
            console.error('Error adding product to Google Sheets:', error);
            throw error;
        }
    }

    async updateProduct(productId, updateData) {
        try {
            const products = await this.getProducts();
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex === -1) return null;
            
            products[productIndex] = { ...products[productIndex], ...updateData };
            
            const headers = this.getSheetHeaders('products');
            await this.writeSheet(this.ranges.products, products, headers);
            
            return products[productIndex];
        } catch (error) {
            console.error('Error updating product in Google Sheets:', error);
            throw error;
        }
    }

    async updateProductStock(productId, stockChange, isDecrement = false) {
        try {
            const products = await this.getProducts();
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex === -1) return null;
            
            const currentStock = parseInt(products[productIndex].stock) || 0;
            const newStock = isDecrement ? 
                Math.max(0, currentStock + stockChange) : // stockChange is negative for decrement
                Math.max(0, stockChange); // stockChange is the new value
            
            products[productIndex].stock = newStock;
            products[productIndex].updatedAt = new Date().toISOString();
            
            const headers = this.getSheetHeaders('products');
            await this.writeSheet(this.ranges.products, products, headers);
            
            return products[productIndex];
        } catch (error) {
            console.error('Error updating product stock in Google Sheets:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            const products = await this.getProducts();
            const productIndex = products.findIndex(p => p.id === productId);
            
            if (productIndex === -1) return null;
            
            products.splice(productIndex, 1);
            
            const headers = this.getSheetHeaders('products');
            await this.writeSheet(this.ranges.products, products, headers);
            
            return true;
        } catch (error) {
            console.error('Error deleting product from Google Sheets:', error);
            throw error;
        }
    }

    // Customers methods
    async getCustomers() {
        return await this.readSheet(this.ranges.customers);
    }

    async addCustomer(customerData) {
        try {
            const headers = this.getSheetHeaders('customers');
            await this.appendToSheet(this.ranges.customers, [customerData], headers);
            return customerData;
        } catch (error) {
            console.error('Error adding customer to Google Sheets:', error);
            throw error;
        }
    }

    async updateCustomer(customerId, updateData) {
        try {
            const customers = await this.getCustomers();
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex === -1) return null;
            
            customers[customerIndex] = { ...customers[customerIndex], ...updateData };
            
            const headers = this.getSheetHeaders('customers');
            await this.writeSheet(this.ranges.customers, customers, headers);
            
            return customers[customerIndex];
        } catch (error) {
            console.error('Error updating customer in Google Sheets:', error);
            throw error;
        }
    }

    async updateCustomerStats(customerId, saleTotal) {
        try {
            const customers = await this.getCustomers();
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex === -1) return null;
            
            const customer = customers[customerIndex];
            customer.totalPurchases = (parseInt(customer.totalPurchases) || 0) + 1;
            customer.totalSpent = (parseFloat(customer.totalSpent) || 0) + saleTotal;
            customer.lastPurchase = new Date().toISOString().split('T')[0];
            customer.updatedAt = new Date().toISOString();
            
            const headers = this.getSheetHeaders('customers');
            await this.writeSheet(this.ranges.customers, customers, headers);
            
            return customer;
        } catch (error) {
            console.error('Error updating customer stats in Google Sheets:', error);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        try {
            const customers = await this.getCustomers();
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex === -1) return null;
            
            customers.splice(customerIndex, 1);
            
            const headers = this.getSheetHeaders('customers');
            await this.writeSheet(this.ranges.customers, customers, headers);
            
            return true;
        } catch (error) {
            console.error('Error deleting customer from Google Sheets:', error);
            throw error;
        }
    }

    // Sales methods
    async getSales() {
        try {
            const sales = await this.readSheet(this.ranges.sales);
            
            // Parse the productos field back to items array
            const salesWithItems = sales.map(sale => {
                let items = [];
                try {
                    items = JSON.parse(sale.productos || '[]');
                } catch (e) {
                    items = [];
                }
                return { 
                    id: sale.id,
                    customerId: sale.clienteId,
                    customerName: sale.clienteId || 'Cliente General',
                    total: parseFloat(sale.total) || 0,
                    date: sale.fecha,
                    items: items,
                    vendedor: sale.vendedor || 'Sistema'
                };
            });
            
            return salesWithItems;
        } catch (error) {
            console.error('Error getting sales from Google Sheets:', error);
            return [];
        }
    }

    async addSale(saleData) {
        try {
            // Convert sale data to match sheet headers
            const saleRecord = {
                id: saleData.id,
                fecha: saleData.date,
                clienteId: saleData.customerId || '',
                productos: JSON.stringify(saleData.items),
                total: saleData.total,
                vendedor: 'Sistema'
            };
            
            const salesHeaders = this.getSheetHeaders('sales');
            await this.appendToSheet(this.ranges.sales, [saleRecord], salesHeaders);
            
            return saleData;
        } catch (error) {
            console.error('Error adding sale to Google Sheets:', error);
            throw error;
        }
    }

    // Utility methods
    async createBackup() {
        try {
            // For Google Sheets, we can create a copy of the spreadsheet
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupTitle = `Backup_CafeNare_${timestamp}`;
            
            const response = await this.sheets.spreadsheets.create({
                resource: {
                    properties: {
                        title: backupTitle
                    }
                }
            });
            
            const backupSpreadsheetId = response.data.spreadsheetId;
            
            // Copy all sheets to backup
            for (const [key, sheetName] of Object.entries(this.sheetNames)) {
                const data = await this.readSheet(this.ranges[key]);
                const headers = this.getSheetHeaders(key);
                
                // Create sheet in backup
                await this.createSheetInSpreadsheet(backupSpreadsheetId, sheetName, headers);
                
                // Copy data
                if (data.length > 0) {
                    await this.writeToSpreadsheet(backupSpreadsheetId, `${sheetName}!A:${String.fromCharCode(64 + headers.length)}`, data, headers);
                }
            }
            
            console.log('Google Sheets backup created:', backupTitle);
            return `Google Sheets backup: ${backupTitle} (ID: ${backupSpreadsheetId})`;
        } catch (error) {
            console.error('Error creating Google Sheets backup:', error);
            throw error;
        }
    }

    async createSheetInSpreadsheet(spreadsheetId, sheetName, headers) {
        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });
            
            if (headers.length > 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: `${sheetName}!A1:${String.fromCharCode(64 + headers.length)}1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [headers]
                    }
                });
            }
        } catch (error) {
            console.error(`Error creating sheet in backup spreadsheet:`, error);
            throw error;
        }
    }

    async writeToSpreadsheet(spreadsheetId, range, data, headers) {
        try {
            const values = data.map(item => headers.map(header => item[header] || ''));
            
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: { values }
            });
        } catch (error) {
            console.error('Error writing to backup spreadsheet:', error);
            throw error;
        }
    }

    async exportToExcel() {
        // For Google Sheets, we can export as Excel format
        try {
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });
            
            // Note: This would require additional implementation to convert to Excel
            // For now, we'll return the Google Sheets URL
            const exportUrl = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}/export?format=xlsx`;
            
            return exportUrl;
        } catch (error) {
            console.error('Error exporting Google Sheets to Excel:', error);
            throw error;
        }
    }

    async cleanup() {
        console.log('Google Sheets handler cleanup completed');
    }
}

module.exports = GoogleSheetsHandler;
