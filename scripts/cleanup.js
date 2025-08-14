const fs = require('fs');
const path = require('path');

async function cleanupUploads() {
    console.log('🧹 Iniciando limpieza de archivos de uploads...\n');
    
    const uploadDir = './uploads';
    
    if (!fs.existsSync(uploadDir)) {
        console.log('📂 La carpeta uploads no existe, no hay nada que limpiar');
        return;
    }

    try {
        const files = fs.readdirSync(uploadDir);
        
        if (files.length === 0) {
            console.log('📂 La carpeta uploads está vacía');
            return;
        }

        console.log(`📁 Encontrados ${files.length} archivos en uploads/`);
        
        // Filtrar solo archivos de imagen
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext);
        });

        if (imageFiles.length === 0) {
            console.log('🖼️  No se encontraron archivos de imagen para limpiar');
            return;
        }

        // Obtener información de cada archivo
        const fileInfo = imageFiles.map(file => {
            const filePath = path.join(uploadDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                age: Date.now() - stats.mtime.getTime()
            };
        });

        // Mostrar resumen
        const totalSize = fileInfo.reduce((sum, file) => sum + file.size, 0);
        console.log(`📊 Resumen de archivos de imagen:`);
        console.log(`   Total: ${imageFiles.length} archivos`);
        console.log(`   Tamaño total: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
        
        // Identificar archivos antiguos (más de 30 días)
        const thirtyDaysAgo = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
        const oldFiles = fileInfo.filter(file => file.age > thirtyDaysAgo);
        
        if (oldFiles.length > 0) {
            console.log(`\n⏰ Archivos antiguos (más de 30 días): ${oldFiles.length}`);
            oldFiles.forEach(file => {
                console.log(`   📄 ${file.name} - ${(file.size / 1024).toFixed(1)} KB - ${file.modified.toLocaleDateString()}`);
            });
        }

        // Identificar archivos grandes (más de 5MB)
        const largeFiles = fileInfo.filter(file => file.size > 5 * 1024 * 1024);
        
        if (largeFiles.length > 0) {
            console.log(`\n📏 Archivos grandes (más de 5MB): ${largeFiles.length}`);
            largeFiles.forEach(file => {
                console.log(`   📄 ${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            });
        }

        // Verificar archivos huérfanos (sin referencias en la base de datos)
        const orphanFiles = await findOrphanFiles(fileInfo);
        
        if (orphanFiles.length > 0) {
            console.log(`\n🔍 Archivos huérfanos (sin referencias): ${orphanFiles.length}`);
            orphanFiles.forEach(file => {
                console.log(`   📄 ${file.name} - ${(file.size / 1024).toFixed(1)} KB`);
            });
        }

        // Preguntar qué acción tomar
        console.log('\n🔧 Opciones de limpieza disponibles:');
        console.log('1. Eliminar archivos antiguos (más de 30 días)');
        console.log('2. Eliminar archivos huérfanos');
        console.log('3. Eliminar archivos grandes (más de 5MB)');
        console.log('4. Limpiar todo (excepto archivos referenciados)');
        console.log('5. Solo mostrar información (no eliminar nada)');
        
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error.message);
    }
}

async function findOrphanFiles(fileInfo) {
    try {
        // Intentar cargar datos para verificar referencias
        const ExcelHandler = require('../handlers/excelHandler');
        const dataHandler = new ExcelHandler('./data/cafe_data.xlsx');
        
        if (!fs.existsSync('./data/cafe_data.xlsx')) {
            console.log('⚠️  Archivo de datos no encontrado, no se pueden verificar huérfanos');
            return [];
        }

        await dataHandler.initialize();
        const products = await dataHandler.getProducts();
        
        // Obtener todas las imágenes referenciadas
        const referencedImages = products
            .filter(product => product.image)
            .map(product => product.image.replace('/uploads/', ''))
            .filter(Boolean);

        // Encontrar archivos no referenciados
        const orphanFiles = fileInfo.filter(file => !referencedImages.includes(file.name));
        
        return orphanFiles;
        
    } catch (error) {
        console.log('⚠️  No se pudo verificar archivos huérfanos:', error.message);
        return [];
    }
}

async function deleteFiles(filesToDelete, reason) {
    if (filesToDelete.length === 0) {
        console.log(`ℹ️  No hay archivos para eliminar (${reason})`);
        return;
    }

    console.log(`\n🗑️  Eliminando ${filesToDelete.length} archivos (${reason})...`);
    
    let deletedCount = 0;
    let deletedSize = 0;
    
    for (const file of filesToDelete) {
        try {
            fs.unlinkSync(file.path);
            deletedCount++;
            deletedSize += file.size;
            console.log(`   ✅ ${file.name}`);
        } catch (error) {
            console.log(`   ❌ Error eliminando ${file.name}: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Resumen de eliminación:`);
    console.log(`   Archivos eliminados: ${deletedCount}/${filesToDelete.length}`);
    console.log(`   Espacio liberado: ${(deletedSize / 1024 / 1024).toFixed(2)} MB`);
}

async function cleanupLogs() {
    console.log('\n📝 Limpiando archivos de log...');
    
    const logFiles = ['./logs', './data/logs', './error.log', './access.log'];
    let cleanedLogs = 0;
    
    for (const logPath of logFiles) {
        if (fs.existsSync(logPath)) {
            try {
                if (fs.statSync(logPath).isDirectory()) {
                    const files = fs.readdirSync(logPath);
                    for (const file of files) {
                        if (file.endsWith('.log')) {
                            fs.unlinkSync(path.join(logPath, file));
                            cleanedLogs++;
                        }
                    }
                } else {
                    fs.unlinkSync(logPath);
                    cleanedLogs++;
                }
            } catch (error) {
                console.log(`⚠️  Error limpiando ${logPath}: ${error.message}`);
            }
        }
    }
    
    if (cleanedLogs > 0) {
        console.log(`✅ Eliminados ${cleanedLogs} archivos de log`);
    } else {
        console.log('ℹ️  No se encontraron archivos de log para limpiar');
    }
}

async function cleanupTemp() {
    console.log('\n🗂️  Limpiando archivos temporales...');
    
    const tempPaths = ['./tmp', './temp', './data/temp'];
    let cleanedTemp = 0;
    
    for (const tempPath of tempPaths) {
        if (fs.existsSync(tempPath)) {
            try {
                const files = fs.readdirSync(tempPath);
                for (const file of files) {
                    fs.unlinkSync(path.join(tempPath, file));
                    cleanedTemp++;
                }
            } catch (error) {
                console.log(`⚠️  Error limpiando ${tempPath}: ${error.message}`);
            }
        }
    }
    
    if (cleanedTemp > 0) {
        console.log(`✅ Eliminados ${cleanedTemp} archivos temporales`);
    } else {
        console.log('ℹ️  No se encontraron archivos temporales para limpiar');
    }
}

async function optimizeImages() {
    console.log('\n🖼️  Analizando optimización de imágenes...');
    
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
        console.log('📂 No hay carpeta de uploads para optimizar');
        return;
    }

    const files = fs.readdirSync(uploadDir);
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });

    if (imageFiles.length === 0) {
        console.log('🖼️  No se encontraron imágenes para analizar');
        return;
    }

    let totalOriginalSize = 0;
    let largeImages = [];

    for (const file of imageFiles) {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        totalOriginalSize += stats.size;
        
        if (stats.size > 1024 * 1024) { // Más de 1MB
            largeImages.push({
                name: file,
                size: stats.size,
                sizeMB: (stats.size / 1024 / 1024).toFixed(2)
            });
        }
    }

    console.log(`📊 Análisis de imágenes:`);
    console.log(`   Total imágenes: ${imageFiles.length}`);
    console.log(`   Tamaño total: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Promedio por imagen: ${(totalOriginalSize / imageFiles.length / 1024).toFixed(1)} KB`);

    if (largeImages.length > 0) {
        console.log(`\n📏 Imágenes grandes (más de 1MB): ${largeImages.length}`);
        largeImages.forEach(img => {
            console.log(`   📄 ${img.name} - ${img.sizeMB} MB`);
        });
        console.log('\n💡 Considera optimizar estas imágenes para mejorar el rendimiento');
    }
}

// Función principal
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🧹 Sistema de Limpieza - Café Nare Balneario\n');

    switch (command) {
        case 'uploads':
            await cleanupUploads();
            break;
        case 'logs':
            await cleanupLogs();
            break;
        case 'temp':
            await cleanupTemp();
            break;
        case 'images':
            await optimizeImages();
            break;
        case 'all':
            await cleanupUploads();
            await cleanupLogs();
            await cleanupTemp();
            await optimizeImages();
            break;
        default:
            console.log('📋 Comandos disponibles:');
            console.log('  uploads  - Limpiar archivos de uploads');
            console.log('  logs     - Limpiar archivos de log');
            console.log('  temp     - Limpiar archivos temporales');
            console.log('  images   - Analizar optimización de imágenes');
            console.log('  all      - Ejecutar todas las limpiezas');
            console.log('');
            console.log('Ejemplos:');
            console.log('  node scripts/cleanup.js uploads');
            console.log('  node scripts/cleanup.js all');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    cleanupUploads,
    cleanupLogs,
    cleanupTemp,
    optimizeImages
};
