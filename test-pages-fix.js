const PDFDocument = require('pdfkit');

const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });

doc.text('Page 1', 50, 50);
doc.addPage();
doc.text('Page 2', 50, 50);

const range = doc.bufferedPageRange();
const totalPages = range.count;

console.log('Total pages before footer:', totalPages);

for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    
    // Disable bottom margin temporarily
    const originalMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    
    doc.fontSize(7).font('Helvetica').fillColor('#AAAAAA');
    doc.text(
        `Documento generado digitalmente`,
        50, 780, { align: 'center', width: 495 }
    );
    doc.text(
        `Página ${i + 1} de ${totalPages}`,
        50, 790, { align: 'center', width: 495 }
    );
    
    // Restore bottom margin
    doc.page.margins.bottom = originalMargin;
}

console.log('Total pages after footer:', doc.bufferedPageRange().count);

doc.end();
