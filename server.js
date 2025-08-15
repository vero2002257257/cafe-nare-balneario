// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');

// Import data handlers
const ExcelHandler = require('./handlers/excelHandler');
const GoogleSheetsHandler = require('./handlers/googleSheetsHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('./'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'), false);
        }
    }
});

// Initialize data handlers
const excelHandler = new ExcelHandler('./data/cafe_data.xlsx');
const googleSheetsHandler = new GoogleSheetsHandler();

// Function to get local IP address
function getLocalIP() {
    const os = require('os');
    const nets = os.networkInterfaces();
    
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Choose data handler based on environment variable or default to Excel
const useGoogleSheets = process.env.USE_GOOGLE_SHEETS === 'true';
const dataHandler = useGoogleSheets ? googleSheetsHandler : excelHandler;

console.log(`Using ${useGoogleSheets ? 'Google Sheets' : 'Excel'} as data storage`);

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        dataSource: useGoogleSheets ? 'Google Sheets' : 'Excel'
    });
});

// Products Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await dataHandler.getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const products = await dataHandler.getProducts();
        const product = products.find(p => p.id === req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error getting product:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const productData = {
            id: uuidv4(),
            name: req.body.name,
            description: req.body.description || '',
            category: req.body.category,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            minStock: parseInt(req.body.minStock) || 5,
            image: req.file ? `/uploads/${req.file.filename}` : null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!productData.name || !productData.category || !productData.price || productData.stock === undefined) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        const result = await dataHandler.addProduct(productData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;
        const updateData = {
            name: req.body.name,
            description: req.body.description || '',
            category: req.body.category,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            minStock: parseInt(req.body.minStock) || 5,
            updatedAt: new Date().toISOString()
        };

        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`;
        }

        const result = await dataHandler.updateProduct(productId, updateData);
        
        if (!result) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

app.put('/api/products/:id/stock', async (req, res) => {
    try {
        const productId = req.params.id;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({ error: 'Stock inválido' });
        }

        const result = await dataHandler.updateProductStock(productId, parseInt(stock));
        
        if (!result) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await dataHandler.deleteProduct(productId);
        
        if (!result) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// Customers Routes
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await dataHandler.getCustomers();
        res.json(customers);
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({ error: 'Error al obtener clientes' });
    }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        const customers = await dataHandler.getCustomers();
        const customer = customers.find(c => c.id === req.params.id);
        
        if (!customer) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(customer);
    } catch (error) {
        console.error('Error getting customer:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const customerData = {
            id: uuidv4(),
            name: req.body.name,
            email: req.body.email || '',
            phone: req.body.phone || '',
            totalPurchases: 0,
            totalSpent: 0,
            lastPurchase: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validate required fields
        if (!customerData.name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await dataHandler.addCustomer(customerData);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const updateData = {
            name: req.body.name,
            email: req.body.email || '',
            phone: req.body.phone || '',
            updatedAt: new Date().toISOString()
        };

        const result = await dataHandler.updateCustomer(customerId, updateData);
        
        if (!result) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        const customerId = req.params.id;
        const result = await dataHandler.deleteCustomer(customerId);
        
        if (!result) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// Sales Routes
app.get('/api/sales', async (req, res) => {
    try {
        const sales = await dataHandler.getSales();
        res.json(sales);
    } catch (error) {
        console.error('Error getting sales:', error);
        res.status(500).json({ error: 'Error al obtener ventas' });
    }
});

app.get('/api/sales/:id', async (req, res) => {
    try {
        const sales = await dataHandler.getSales();
        const sale = sales.find(s => s.id === req.params.id);
        
        if (!sale) {
            return res.status(404).json({ error: 'Venta no encontrada' });
        }
        
        res.json(sale);
    } catch (error) {
        console.error('Error getting sale:', error);
        res.status(500).json({ error: 'Error al obtener venta' });
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        const { customerId, customerName, items } = req.body;

        // Validate sale data
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'La venta debe tener al menos un producto' });
        }

        // Calculate total
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const saleData = {
            id: uuidv4(),
            customerId: customerId || null,
            customerName: customerName || 'Cliente General',
            items: items,
            total: total,
            date: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };

        // Process the sale
        const result = await dataHandler.addSale(saleData);

        // Update product stock
        for (const item of items) {
            await dataHandler.updateProductStock(item.productId, -item.quantity, true); // Decrease stock
        }

        // Update customer stats if applicable
        if (customerId) {
            await dataHandler.updateCustomerStats(customerId, total);
        }

        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Error al procesar venta' });
    }
});

// Reports Routes
app.get('/api/reports/dashboard', async (req, res) => {
    try {
        const [products, customers, sales] = await Promise.all([
            dataHandler.getProducts(),
            dataHandler.getCustomers(),
            dataHandler.getSales()
        ]);

        const today = new Date().toDateString();
        const todaySales = sales.filter(sale => 
            new Date(sale.date).toDateString() === today
        );

        const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const lowStockProducts = products.filter(product => product.stock <= product.minStock);

        const dashboard = {
            todaySales: todayTotal,
            totalProducts: products.length,
            lowStockItems: lowStockProducts.length,
            totalCustomers: customers.length,
            recentSales: sales.slice(-5).reverse(),
            lowStockProducts: lowStockProducts
        };

        res.json(dashboard);
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({ error: 'Error al obtener datos del dashboard' });
    }
});

app.get('/api/reports/sales', async (req, res) => {
    try {
        const { startDate, endDate, customerId } = req.query;
        let sales = await dataHandler.getSales();

        // Filter by date range
        if (startDate) {
            sales = sales.filter(sale => new Date(sale.date) >= new Date(startDate));
        }
        if (endDate) {
            sales = sales.filter(sale => new Date(sale.date) <= new Date(endDate));
        }

        // Filter by customer
        if (customerId) {
            sales = sales.filter(sale => sale.customerId === customerId);
        }

        const total = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = sales.length;
        const averageTicket = totalTransactions > 0 ? total / totalTransactions : 0;

        res.json({
            sales,
            summary: {
                total,
                totalTransactions,
                averageTicket
            }
        });
    } catch (error) {
        console.error('Error getting sales report:', error);
        res.status(500).json({ error: 'Error al generar reporte de ventas' });
    }
});

// Export data routes
app.get('/api/export/excel', async (req, res) => {
    try {
        console.log('Export Excel requested');
        
        // Get all data
        const [products, customers, sales] = await Promise.all([
            dataHandler.getProducts(),
            dataHandler.getCustomers(),
            dataHandler.getSales()
        ]);

        // Create workbook
        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();

        // Create worksheets
        const productsWS = XLSX.utils.json_to_sheet(products);
        const customersWS = XLSX.utils.json_to_sheet(customers);
        
        // Flatten sales data for Excel
        const salesFlat = sales.map(sale => ({
            id: sale.id,
            date: sale.date,
            customerId: sale.customerId,
            customerName: sale.customerName,
            total: sale.total,
            items: sale.items.map(item => `${item.productName} (${item.quantity})`).join(', ')
        }));
        const salesWS = XLSX.utils.json_to_sheet(salesFlat);

        // Add worksheets to workbook
        XLSX.utils.book_append_sheet(workbook, productsWS, 'Productos');
        XLSX.utils.book_append_sheet(workbook, customersWS, 'Clientes');
        XLSX.utils.book_append_sheet(workbook, salesWS, 'Ventas');

        // Generate buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set headers
        const filename = `cafe_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);

        // Send buffer
        res.send(buffer);
        
        console.log('Excel export completed successfully');
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ error: 'Error al exportar a Excel: ' + error.message });
    }
});

// Loyverse API Proxy
app.post('/api/loyverse/receipt', async (req, res) => {
    try {
        const { accessToken, storeId, saleData, customerData } = req.body;
        
        if (!accessToken) {
            return res.status(400).json({ error: 'Access token requerido' });
        }
        
        // Formato de orden para Loyverse API
        const loyverseOrder = {
            store_id: storeId || undefined,
            customer_id: customerData ? customerData.loyverseId : null,
            customer: customerData ? {
                name: customerData.name,
                email: customerData.email || '',
                phone_number: customerData.phone || ''
            } : null,
            line_items: saleData.items.map((item, index) => ({
                quantity: item.quantity,
                item_name: item.productName,
                // Generar UUID válido para variant_id (requerido por Loyverse)
                variant_id: uuidv4(),
                cost: Math.round(item.price * 100), // Loyverse usa centavos
                price: Math.round(item.price * 100),
                line_note: item.description || '',
                taxes: [] // Sin impuestos por ahora
            })),
            payment_types: [{
                name: 'Efectivo',
                amount: Math.round(saleData.total * 100) // En centavos
            }],
            note: `Venta desde Café Nare - ${new Date().toLocaleString('es-CO')}`,
            source: 'API'
        };
        
        console.log('=== ENVIANDO A LOYVERSE ===');
        console.log('AccessToken (primeros 10 chars):', accessToken.substring(0, 10) + '...');
        console.log('StoreId:', storeId);
        console.log('Datos enviados:', JSON.stringify(loyverseOrder, null, 2));
        
        const response = await fetch('https://api.loyverse.com/v1.0/receipts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loyverseOrder)
        });
        
        const responseText = await response.text();
        console.log('=== RESPUESTA DE LOYVERSE ===');
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        console.log('Body:', responseText);
        
        if (response.ok) {
            const result = JSON.parse(responseText);
            res.json({
                success: true,
                receipt_number: result.receipt_number,
                message: 'Recibo creado en Loyverse exitosamente'
            });
        } else {
            console.error('Error de Loyverse:', response.status, responseText);
            res.status(response.status).json({ 
                error: `Error Loyverse: ${response.status}`,
                details: responseText
            });
        }
    } catch (error) {
        console.error('Error en proxy Loyverse:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Backup routes
app.post('/api/backup', async (req, res) => {
    try {
        const backupPath = await dataHandler.createBackup();
        res.json({ 
            message: 'Backup creado correctamente',
            path: backupPath,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Error al crear backup' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Archivo demasiado grande (máximo 5MB)' });
        }
    }
    
    console.error('Unhandled error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Serve the main app for any other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize data storage and start server
async function startServer() {
    try {
        await dataHandler.initialize();
        console.log('Data handler initialized successfully');
        
        app.listen(PORT, '0.0.0.0', () => {
            const localIP = getLocalIP();
            console.log(`🚀 Servidor iniciado exitosamente:`);
            console.log(`📱 Acceso local: http://localhost:${PORT}`);
            console.log(`🌐 Acceso en red: http://${localIP}:${PORT}`);
            console.log(`📊 Base de datos: ${useGoogleSheets ? 'Google Sheets' : 'Excel'}`);
            console.log(`\n📲 Para acceder desde celular/tablet:`);
            console.log(`   1. Conectar a la misma WiFi`);
            console.log(`   2. Abrir navegador`);
            console.log(`   3. Ir a: http://${localIP}:${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await dataHandler.cleanup();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await dataHandler.cleanup();
    process.exit(0);
});

startServer();

module.exports = app;
