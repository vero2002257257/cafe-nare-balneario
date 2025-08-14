const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

class ExcelHandler {
    constructor(filePath) {
        this.filePath = filePath;
        this.dataDir = path.dirname(filePath);
        this.backupDir = path.join(this.dataDir, 'backups');
        this.worksheets = {
            products: 'Productos',
            customers: 'Clientes',
            sales: 'Ventas',
            saleItems: 'DetalleVentas'
        };
        
        // Ensure directories exist
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    async initialize() {
        try {
            // Create initial Excel file if it doesn't exist
            if (!fs.existsSync(this.filePath)) {
                await this.createInitialFile();
            }
            
            // Validate file structure
            await this.validateFileStructure();
            
            console.log('Excel handler initialized successfully');
        } catch (error) {
            console.error('Error initializing Excel handler:', error);
            throw error;
        }
    }

    async createInitialFile() {
        const workbook = XLSX.utils.book_new();

        // Create Products worksheet
        const productsData = [
            ['id', 'name', 'description', 'category', 'price', 'stock', 'minStock', 'image', 'createdAt', 'updatedAt']
        ];
        const productsWS = XLSX.utils.aoa_to_sheet(productsData);
        XLSX.utils.book_append_sheet(workbook, productsWS, this.worksheets.products);

        // Create Customers worksheet
        const customersData = [
            ['id', 'name', 'email', 'phone', 'totalPurchases', 'totalSpent', 'lastPurchase', 'createdAt', 'updatedAt']
        ];
        const customersWS = XLSX.utils.aoa_to_sheet(customersData);
        XLSX.utils.book_append_sheet(workbook, customersWS, this.worksheets.customers);

        // Create Sales worksheet
        const salesData = [
            ['id', 'customerId', 'customerName', 'total', 'date', 'createdAt']
        ];
        const salesWS = XLSX.utils.aoa_to_sheet(salesData);
        XLSX.utils.book_append_sheet(workbook, salesWS, this.worksheets.sales);

        // Create Sale Items worksheet
        const saleItemsData = [
            ['id', 'saleId', 'productId', 'productName', 'quantity', 'price', 'subtotal']
        ];
        const saleItemsWS = XLSX.utils.aoa_to_sheet(saleItemsData);
        XLSX.utils.book_append_sheet(workbook, saleItemsWS, this.worksheets.saleItems);

        // Write the file
        XLSX.writeFile(workbook, this.filePath);
        console.log('Initial Excel file created');
    }

    async validateFileStructure() {
        try {
            const workbook = XLSX.readFile(this.filePath);
            
            // Check if all required worksheets exist
            for (const [key, sheetName] of Object.entries(this.worksheets)) {
                if (!workbook.Sheets[sheetName]) {
                    throw new Error(`Missing worksheet: ${sheetName}`);
                }
            }
            
            return true;
        } catch (error) {
            console.error('File structure validation failed:', error);
            // Try to recreate the file
            await this.createInitialFile();
            return true;
        }
    }

    readWorkbook() {
        try {
            return XLSX.readFile(this.filePath);
        } catch (error) {
            console.error('Error reading Excel file:', error);
            throw new Error('No se pudo leer el archivo Excel');
        }
    }

    writeWorkbook(workbook) {
        try {
            XLSX.writeFile(workbook, this.filePath);
        } catch (error) {
            console.error('Error writing Excel file:', error);
            throw new Error('No se pudo escribir el archivo Excel');
        }
    }

    worksheetToJson(worksheet) {
        if (!worksheet) return [];
        
        try {
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            return jsonData;
        } catch (error) {
            console.error('Error converting worksheet to JSON:', error);
            return [];
        }
    }

    jsonToWorksheet(data, headers) {
        try {
            const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
            return worksheet;
        } catch (error) {
            console.error('Error converting JSON to worksheet:', error);
            throw error;
        }
    }

    // Products methods
    async getProducts() {
        try {
            const workbook = this.readWorkbook();
            const worksheet = workbook.Sheets[this.worksheets.products];
            return this.worksheetToJson(worksheet);
        } catch (error) {
            console.error('Error getting products:', error);
            return [];
        }
    }

    async addProduct(productData) {
        try {
            const workbook = this.readWorkbook();
            const products = await this.getProducts();
            
            products.push(productData);
            
            const worksheet = this.jsonToWorksheet(products);
            workbook.Sheets[this.worksheets.products] = worksheet;
            
            this.writeWorkbook(workbook);
            return productData;
        } catch (error) {
            console.error('Error adding product:', error);
            throw error;
        }
    }

    async updateProduct(productId, updateData) {
        try {
            const workbook = this.readWorkbook();
            const products = await this.getProducts();
            
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                return null;
            }
            
            products[productIndex] = { ...products[productIndex], ...updateData };
            
            const worksheet = this.jsonToWorksheet(products);
            workbook.Sheets[this.worksheets.products] = worksheet;
            
            this.writeWorkbook(workbook);
            return products[productIndex];
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    }

    async updateProductStock(productId, stockChange, isDecrement = false) {
        try {
            const workbook = this.readWorkbook();
            const products = await this.getProducts();
            
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                return null;
            }
            
            const currentStock = parseInt(products[productIndex].stock) || 0;
            const newStock = isDecrement ? 
                Math.max(0, currentStock + stockChange) : // stockChange is negative for decrement
                Math.max(0, stockChange); // stockChange is the new value
            
            products[productIndex].stock = newStock;
            products[productIndex].updatedAt = new Date().toISOString();
            
            const worksheet = this.jsonToWorksheet(products);
            workbook.Sheets[this.worksheets.products] = worksheet;
            
            this.writeWorkbook(workbook);
            return products[productIndex];
        } catch (error) {
            console.error('Error updating product stock:', error);
            throw error;
        }
    }

    async deleteProduct(productId) {
        try {
            const workbook = this.readWorkbook();
            const products = await this.getProducts();
            
            const productIndex = products.findIndex(p => p.id === productId);
            if (productIndex === -1) {
                return null;
            }
            
            products.splice(productIndex, 1);
            
            const worksheet = this.jsonToWorksheet(products);
            workbook.Sheets[this.worksheets.products] = worksheet;
            
            this.writeWorkbook(workbook);
            return true;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    }

    // Customers methods
    async getCustomers() {
        try {
            const workbook = this.readWorkbook();
            const worksheet = workbook.Sheets[this.worksheets.customers];
            return this.worksheetToJson(worksheet);
        } catch (error) {
            console.error('Error getting customers:', error);
            return [];
        }
    }

    async addCustomer(customerData) {
        try {
            const workbook = this.readWorkbook();
            const customers = await this.getCustomers();
            
            customers.push(customerData);
            
            const worksheet = this.jsonToWorksheet(customers);
            workbook.Sheets[this.worksheets.customers] = worksheet;
            
            this.writeWorkbook(workbook);
            return customerData;
        } catch (error) {
            console.error('Error adding customer:', error);
            throw error;
        }
    }

    async updateCustomer(customerId, updateData) {
        try {
            const workbook = this.readWorkbook();
            const customers = await this.getCustomers();
            
            const customerIndex = customers.findIndex(c => c.id === customerId);
            if (customerIndex === -1) {
                return null;
            }
            
            customers[customerIndex] = { ...customers[customerIndex], ...updateData };
            
            const worksheet = this.jsonToWorksheet(customers);
            workbook.Sheets[this.worksheets.customers] = worksheet;
            
            this.writeWorkbook(workbook);
            return customers[customerIndex];
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    async updateCustomerStats(customerId, saleTotal) {
        try {
            const workbook = this.readWorkbook();
            const customers = await this.getCustomers();
            
            const customerIndex = customers.findIndex(c => c.id === customerId);
            if (customerIndex === -1) {
                return null;
            }
            
            const customer = customers[customerIndex];
            customer.totalPurchases = (parseInt(customer.totalPurchases) || 0) + 1;
            customer.totalSpent = (parseFloat(customer.totalSpent) || 0) + saleTotal;
            customer.lastPurchase = new Date().toISOString().split('T')[0];
            customer.updatedAt = new Date().toISOString();
            
            const worksheet = this.jsonToWorksheet(customers);
            workbook.Sheets[this.worksheets.customers] = worksheet;
            
            this.writeWorkbook(workbook);
            return customer;
        } catch (error) {
            console.error('Error updating customer stats:', error);
            throw error;
        }
    }

    async deleteCustomer(customerId) {
        try {
            const workbook = this.readWorkbook();
            const customers = await this.getCustomers();
            
            const customerIndex = customers.findIndex(c => c.id === customerId);
            if (customerIndex === -1) {
                return null;
            }
            
            customers.splice(customerIndex, 1);
            
            const worksheet = this.jsonToWorksheet(customers);
            workbook.Sheets[this.worksheets.customers] = worksheet;
            
            this.writeWorkbook(workbook);
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }

    // Sales methods
    async getSales() {
        try {
            const workbook = this.readWorkbook();
            const salesWorksheet = workbook.Sheets[this.worksheets.sales];
            const saleItemsWorksheet = workbook.Sheets[this.worksheets.saleItems];
            
            const sales = this.worksheetToJson(salesWorksheet);
            const saleItems = this.worksheetToJson(saleItemsWorksheet);
            
            // Combine sales with their items
            const salesWithItems = sales.map(sale => {
                const items = saleItems.filter(item => item.saleId === sale.id);
                return { ...sale, items };
            });
            
            return salesWithItems;
        } catch (error) {
            console.error('Error getting sales:', error);
            return [];
        }
    }

    async addSale(saleData) {
        try {
            const workbook = this.readWorkbook();
            const sales = await this.getSales();
            const allSaleItems = this.worksheetToJson(workbook.Sheets[this.worksheets.saleItems]);
            
            // Add sale to sales worksheet
            const saleRecord = {
                id: saleData.id,
                customerId: saleData.customerId,
                customerName: saleData.customerName,
                total: saleData.total,
                date: saleData.date,
                createdAt: saleData.createdAt
            };
            
            sales.push(saleRecord);
            
            // Add sale items to sale items worksheet
            const newSaleItems = saleData.items.map(item => ({
                id: `${saleData.id}_${item.productId}`,
                saleId: saleData.id,
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity
            }));
            
            allSaleItems.push(...newSaleItems);
            
            // Update worksheets
            const salesWorksheet = this.jsonToWorksheet(sales.map(s => ({
                id: s.id,
                customerId: s.customerId,
                customerName: s.customerName,
                total: s.total,
                date: s.date,
                createdAt: s.createdAt
            })));
            workbook.Sheets[this.worksheets.sales] = salesWorksheet;
            
            const saleItemsWorksheet = this.jsonToWorksheet(allSaleItems);
            workbook.Sheets[this.worksheets.saleItems] = saleItemsWorksheet;
            
            this.writeWorkbook(workbook);
            return saleData;
        } catch (error) {
            console.error('Error adding sale:', error);
            throw error;
        }
    }

    // Utility methods
    async createBackup() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `backup_${timestamp}.xlsx`;
            const backupPath = path.join(this.backupDir, backupFileName);
            
            // Copy current file to backup
            fs.copyFileSync(this.filePath, backupPath);
            
            console.log('Backup created:', backupPath);
            return backupPath;
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async exportToExcel() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const exportFileName = `export_${timestamp}.xlsx`;
            const exportPath = path.join(this.dataDir, exportFileName);
            
            // Copy current file for export
            fs.copyFileSync(this.filePath, exportPath);
            
            return exportPath;
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    }

    async cleanup() {
        // Cleanup temporary files if needed
        console.log('Excel handler cleanup completed');
    }
}

module.exports = ExcelHandler;
