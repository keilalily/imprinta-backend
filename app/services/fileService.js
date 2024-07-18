const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

exports.processUpload = async (originalname, tempFilePath) => {
  let pdfPath = tempFilePath;

  if (originalname.endsWith('.docx') || originalname.endsWith('.pptx')) {
    pdfPath = path.join('uploads', originalname.replace(path.extname(originalname), '.pdf'));
    const fileBuffer = await fs.readFile(tempFilePath);
    const pdfBuffer = await new Promise((resolve, reject) => {
      libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
        if (err) return reject(err);
        resolve(done);
      });
    });
    await fs.writeFile(pdfPath, pdfBuffer);
  }

  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  await fs.unlink(tempFilePath);

  const responseData = { fileName: originalname, pageCount, pdfBytes: pdfBytes.toString('base64') };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(responseData));
    }
  });

  return responseData;
};
