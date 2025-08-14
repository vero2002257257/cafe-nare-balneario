const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Setup script para configurar la autenticación con Google Sheets
async function setupGoogleAuth() {
    console.log('🔧 Configurando autenticación con Google Sheets...\n');

    const credentialsPath = './config/google-credentials.json';
    const tokenPath = './config/google-token.json';

    // Verificar que existe el archivo de credenciales
    if (!fs.existsSync(credentialsPath)) {
        console.error('❌ Error: No se encontró el archivo google-credentials.json en la carpeta config/');
        console.log('\n📋 Pasos para obtener las credenciales:');
        console.log('1. Ve a https://console.cloud.google.com/');
        console.log('2. Crea un proyecto o selecciona uno existente');
        console.log('3. Habilita la API de Google Sheets');
        console.log('4. Crea credenciales OAuth 2.0');
        console.log('5. Descarga el archivo JSON y renómbralo a google-credentials.json');
        console.log('6. Colócalo en la carpeta config/\n');
        process.exit(1);
    }

    try {
        // Leer credenciales
        const credentials = JSON.parse(fs.readFileSync(credentialsPath));
        const { client_secret, client_id, redirect_uris } = credentials.web || credentials.installed;

        if (!client_secret || !client_id || !redirect_uris) {
            throw new Error('Formato de credenciales inválido');
        }

        // Configurar OAuth2
        const oAuth2Client = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris[0]
        );

        // Definir scopes
        const SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ];

        // Generar URL de autorización
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });

        console.log('🌐 Abre esta URL en tu navegador para autorizar la aplicación:');
        console.log('\x1b[36m%s\x1b[0m', authUrl);
        console.log('');

        // Solicitar código de autorización
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const code = await new Promise((resolve) => {
            rl.question('✏️  Introduce el código de autorización: ', (code) => {
                rl.close();
                resolve(code);
            });
        });

        // Intercambiar código por token
        console.log('\n🔄 Intercambiando código por token...');
        const { tokens } = await oAuth2Client.getToken(code);
        
        // Guardar token
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        
        console.log('✅ Token guardado correctamente en:', tokenPath);
        console.log('✅ Configuración de Google Sheets completada!');
        
        // Verificar configuración
        console.log('\n🧪 Probando conexión...');
        await testConnection(tokens, client_id, client_secret, redirect_uris[0]);

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    }
}

async function testConnection(tokens, clientId, clientSecret, redirectUri) {
    try {
        const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        oAuth2Client.setCredentials(tokens);
        
        const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
        
        // Crear un spreadsheet de prueba
        const response = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: 'Test - Café Nare System'
                }
            }
        });
        
        const spreadsheetId = response.data.spreadsheetId;
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
        
        console.log('✅ Conexión exitosa!');
        console.log('📄 Spreadsheet de prueba creado:', spreadsheetUrl);
        console.log('\n📋 Para usar este spreadsheet en la aplicación:');
        console.log('1. Copia este ID:', spreadsheetId);
        console.log('2. Agrégalo a tu archivo .env como GOOGLE_SPREADSHEET_ID');
        console.log('3. O úsalo para crear tu propio spreadsheet de datos\n');
        
        // Eliminar spreadsheet de prueba
        console.log('🗑️  ¿Deseas eliminar el spreadsheet de prueba? (y/n)');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const deleteTest = await new Promise((resolve) => {
            rl.question('', (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });

        if (deleteTest) {
            const drive = google.drive({ version: 'v3', auth: oAuth2Client });
            await drive.files.delete({ fileId: spreadsheetId });
            console.log('✅ Spreadsheet de prueba eliminado');
        }

    } catch (error) {
        console.error('❌ Error al probar la conexión:', error.message);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    setupGoogleAuth().catch(console.error);
}

module.exports = { setupGoogleAuth };
