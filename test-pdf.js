const { generarPDFContrato } = require('./server/services/pdfService');
const fs = require('fs');

async function run() {
    const contrato = {
        titulo_contrato: 'Test Contrato',
        fecha_creacion: new Date().toISOString(),
        estado: 'Firmado',
        cliente_nombre: 'John Doe',
        cliente_numero: '12345678',
        email_cliente: 'john@example.com'
    };
    
    // Generar un bloque largo de texto estático para simular páginas
    const bloques = [];
    for (let i = 0; i < 50; i++) {
        bloques.push({
            tipo: 'texto_estatico',
            contenido: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10)
        });
    }

    const firmaBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAADUlEQVQIHWP4v5ThPwAG7wKklwQ/bwAAAABJRU5ErkJggg==';

    try {
        const buffer = await generarPDFContrato({
            contrato,
            bloques,
            datos: {},
            firmaBase64,
            nombreEmpresa: 'Test Corp'
        });
        fs.writeFileSync('test_output.pdf', buffer);
        console.log('PDF generado exitosamente. Size:', buffer.length);
    } catch (e) {
        console.error('Error:', e);
    }
}

run();
