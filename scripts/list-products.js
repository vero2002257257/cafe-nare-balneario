const XLSX = require('xlsx');
const path = require('path');

const excelPath = path.join(__dirname, '..', 'data', 'cafe_data.xlsx');

function listProducts() {
    try {
        const workbook = XLSX.readFile(excelPath);
        const productsSheet = workbook.Sheets['Productos'];
        const products = XLSX.utils.sheet_to_json(productsSheet);
        
        console.log('Lista de productos:');
        console.log(JSON.stringify(products, null, 2));
    } catch (error) {
        console.error('Error al leer productos:', error);
    }
}

listProducts();
