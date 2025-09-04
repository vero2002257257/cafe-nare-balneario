const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const jsonPath = path.join(__dirname, '..', 'productos_inventario.json');

async function migrateJsonIds() {
    try {
        // Leer el archivo JSON
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        // Hacer backup del archivo original
        const backupPath = path.join(__dirname, '..', 'data', 'backups', `productos_inventario_backup_${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

        // Convertir IDs a UUID
        data.products = data.products.map(product => {
            // Si el ID no parece ser un UUID, generar uno nuevo
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(product.id)) {
                product.id = uuidv4();
            }
            return product;
        });

        // Guardar el archivo actualizado
        fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

        console.log('Migración del archivo JSON completada con éxito');
        console.log('Backup guardado en:', backupPath);
    } catch (error) {
        console.error('Error durante la migración del JSON:', error);
    }
}

// Ejecutar la migración
migrateJsonIds();
