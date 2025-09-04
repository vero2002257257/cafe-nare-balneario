const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const excelPath = path.join(__dirname, '..', 'data', 'cafe_data.xlsx');

// Función para migrar los IDs
async function migrateIds() {
    try {
        // Leer el archivo Excel
        const workbook = XLSX.readFile(excelPath);
        const productsSheet = workbook.Sheets['Productos'];
        const products = XLSX.utils.sheet_to_json(productsSheet);
        
        // Mapear los viejos IDs a nuevos UUIDs
        const idMapping = {};
        const updatedProducts = products.map(product => {
            // Si el ID no parece ser un UUID, generar uno nuevo
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id)) {
                const oldId = product.id;
                const newId = uuidv4();
                idMapping[oldId] = newId;
                product.id = newId;
            }
            return product;
        });

        // Actualizar las referencias en la hoja de DetalleVentas
        const saleItemsSheet = workbook.Sheets['DetalleVentas'];
        const saleItems = XLSX.utils.sheet_to_json(saleItemsSheet);
        const updatedSaleItems = saleItems.map(item => {
            if (idMapping[item.productId]) {
                item.productId = idMapping[item.productId];
            }
            return item;
        });

        // Guardar los productos actualizados
        const newProductsSheet = XLSX.utils.json_to_sheet(updatedProducts);
        workbook.Sheets['Productos'] = newProductsSheet;

        // Guardar los detalles de venta actualizados
        const newSaleItemsSheet = XLSX.utils.json_to_sheet(updatedSaleItems);
        workbook.Sheets['DetalleVentas'] = newSaleItemsSheet;

        // Hacer backup del archivo original
        const backupPath = path.join(__dirname, '..', 'data', 'backups', `cafe_data_backup_${Date.now()}.xlsx`);
        fs.copyFileSync(excelPath, backupPath);

        // Guardar el archivo actualizado
        XLSX.writeFile(workbook, excelPath);

        console.log('Migración completada con éxito');
        console.log('ID mappings:', idMapping);
        console.log('Backup guardado en:', backupPath);
    } catch (error) {
        console.error('Error durante la migración:', error);
    }
}

// Ejecutar la migración
migrateIds();
