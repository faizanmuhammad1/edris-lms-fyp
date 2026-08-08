const fs = require('fs');

async function testPdfJs() {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    console.log(pdfjsLib.getDocument);
}
testPdfJs();
