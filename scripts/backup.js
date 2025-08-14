const ExcelHandler = require('../handlers/excelHandler');
const GoogleSheetsHandler = require('../handlers/googleSheetsHandler');
const fs = require('fs');
const path = require('path');

async function createBackup() {
    console.log('🔄 Iniciando proceso de backup...\n');

    const useGoogleSheets = process.env.USE_GOOGLE_SHEETS === 'true';
    
    try {
        let dataHandler;
        let backupResult;

        if (useGoogleSheets) {
            console.log('📊 Usando Google Sheets como fuente de datos');
            dataHandler = new GoogleSheetsHandler();
            await dataHandler.initialize();
            backupResult = await dataHandler.createBackup();
        } else {
            console.log('📄 Usando Excel como fuente de datos');
            dataHandler = new ExcelHandler('./data/cafe_data.xlsx');
            await dataHandler.initialize();
            backupResult = await dataHandler.createBackup();
        }

        console.log('✅ Backup creado exitosamente!');
        console.log('📁 Ubicación:', backupResult);
        
        // Crear backup adicional con timestamp más legible
        if (!useGoogleSheets) {
            const readableBackup = await createReadableBackup();
            console.log('📁 Backup adicional:', readableBackup);
        }

        // Mostrar estadísticas del backup
        await showBackupStats(dataHandler);

        // Limpiar backups antiguos
        if (!useGoogleSheets) {
            await cleanupOldBackups();
        }

    } catch (error) {
        console.error('❌ Error al crear backup:', error.message);
        process.exit(1);
    }
}

async function createReadableBackup() {
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
        
        const backupFileName = `backup_${dateStr}_${timeStr}.xlsx`;
        const backupPath = path.join('./data/backups', backupFileName);
        
        // Copiar archivo actual
        const sourcePath = './data/cafe_data.xlsx';
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, backupPath);
            return backupPath;
        }
        
        return null;
    } catch (error) {
        console.error('Error al crear backup legible:', error.message);
        return null;
    }
}

async function showBackupStats(dataHandler) {
    try {
        console.log('\n📊 Estadísticas del backup:');
        console.log('═'.repeat(40));
        
        const [products, customers, sales] = await Promise.all([
            dataHandler.getProducts(),
            dataHandler.getCustomers(),
            dataHandler.getSales()
        ]);

        console.log(`📦 Productos respaldados: ${products.length}`);
        console.log(`👥 Clientes respaldados: ${customers.length}`);
        console.log(`💰 Ventas respaldadas: ${sales.length}`);

        if (sales.length > 0) {
            const totalSales = sales.reduce((sum, sale) => sum + (parseFloat(sale.total) || 0), 0);
            console.log(`💵 Valor total de ventas: $${totalSales.toLocaleString()}`);
        }

        // Productos con stock bajo
        const lowStock = products.filter(p => (parseInt(p.stock) || 0) <= (parseInt(p.minStock) || 5));
        if (lowStock.length > 0) {
            console.log(`⚠️  Productos con stock bajo: ${lowStock.length}`);
        }

        console.log('═'.repeat(40));
        
    } catch (error) {
        console.error('Error al mostrar estadísticas:', error.message);
    }
}

async function cleanupOldBackups() {
    try {
        const backupDir = './data/backups';
        if (!fs.existsSync(backupDir)) {
            return;
        }

        const files = fs.readdirSync(backupDir);
        const backupFiles = files.filter(file => file.startsWith('backup_') && file.endsWith('.xlsx'));
        
        // Mantener solo los 10 backups más recientes
        if (backupFiles.length > 10) {
            const sortedFiles = backupFiles
                .map(file => ({
                    name: file,
                    path: path.join(backupDir, file),
                    mtime: fs.statSync(path.join(backupDir, file)).mtime
                }))
                .sort((a, b) => b.mtime - a.mtime);

            const filesToDelete = sortedFiles.slice(10);
            
            for (const file of filesToDelete) {
                fs.unlinkSync(file.path);
                console.log(`🗑️  Backup antiguo eliminado: ${file.name}`);
            }
            
            console.log(`🧹 Limpieza completada. Eliminados ${filesToDelete.length} backups antiguos.`);
        }
        
    } catch (error) {
        console.error('Error al limpiar backups antiguos:', error.message);
    }
}

async function listBackups() {
    console.log('📋 Listando backups disponibles...\n');
    
    const backupDir = './data/backups';
    if (!fs.existsSync(backupDir)) {
        console.log('❌ No se encontró la carpeta de backups');
        return;
    }

    const files = fs.readdirSync(backupDir);
    const backupFiles = files
        .filter(file => file.startsWith('backup_') && file.endsWith('.xlsx'))
        .map(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                size: (stats.size / 1024).toFixed(2) + ' KB',
                date: stats.mtime.toLocaleString('es-ES')
            };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (backupFiles.length === 0) {
        console.log('📂 No hay backups disponibles');
        return;
    }

    console.log('Backups disponibles:');
    console.log('═'.repeat(80));
    console.log('Archivo'.padEnd(35), 'Tamaño'.padEnd(12), 'Fecha de creación');
    console.log('─'.repeat(80));
    
    backupFiles.forEach(backup => {
        console.log(
            backup.name.padEnd(35),
            backup.size.padEnd(12),
            backup.date
        );
    });
    
    console.log('═'.repeat(80));
    console.log(`Total: ${backupFiles.length} backup(s)`);
}

async function restoreBackup(backupFileName) {
    console.log(`🔄 Restaurando backup: ${backupFileName}...\n`);
    
    const backupPath = path.join('./data/backups', backupFileName);
    const currentPath = './data/cafe_data.xlsx';
    
    if (!fs.existsSync(backupPath)) {
        console.error('❌ Error: Archivo de backup no encontrado');
        return;
    }

    try {
        // Crear backup del archivo actual antes de restaurar
        if (fs.existsSync(currentPath)) {
            const timestampedBackup = await createReadableBackup();
            console.log(`💾 Archivo actual respaldado en: ${timestampedBackup}`);
        }

        // Restaurar el backup
        fs.copyFileSync(backupPath, currentPath);
        
        console.log('✅ Backup restaurado exitosamente!');
        console.log('🔄 Reinicia la aplicación para ver los cambios');
        
    } catch (error) {
        console.error('❌ Error al restaurar backup:', error.message);
    }
}

// Procesar argumentos de línea de comandos
const args = process.argv.slice(2);
const command = args[0];

async function main() {
    switch (command) {
        case 'create':
        case 'backup':
            await createBackup();
            break;
        case 'list':
            await listBackups();
            break;
        case 'restore':
            const fileName = args[1];
            if (!fileName) {
                console.error('❌ Error: Especifica el nombre del archivo a restaurar');
                console.log('Uso: node scripts/backup.js restore nombre_archivo.xlsx');
                process.exit(1);
            }
            await restoreBackup(fileName);
            break;
        case 'cleanup':
            await cleanupOldBackups();
            console.log('✅ Limpieza de backups completada');
            break;
        default:
            console.log('📋 Comandos disponibles:');
            console.log('  create/backup  - Crear un nuevo backup');
            console.log('  list          - Listar backups disponibles');
            console.log('  restore       - Restaurar un backup específico');
            console.log('  cleanup       - Limpiar backups antiguos');
            console.log('');
            console.log('Ejemplos:');
            console.log('  node scripts/backup.js create');
            console.log('  node scripts/backup.js list');
            console.log('  node scripts/backup.js restore backup_2024-01-15_10-30-00.xlsx');
            console.log('  node scripts/backup.js cleanup');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    cleanupOldBackups
};
