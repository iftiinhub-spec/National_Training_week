import PDFDocument from 'pdfkit';
import { generateQRBuffer } from './qrGenerator.js';

export const generateCertificatePDF = async ({
  participantName,
  trainingTitle,
  eventName,
  issuedDate,
  certificateId,
  verifyUrl,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 60, right: 60 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Background color
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#fafafa');

      // Decorative border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(3).stroke('#1a6b3c');
      doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .lineWidth(1).stroke('#3b82c4');

      // Header
      doc.fillColor('#1a6b3c')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('HORMUUD UNIVERSITY', 0, 60, { align: 'center' });

      doc.fillColor('#3b82c4')
        .fontSize(14)
        .font('Helvetica')
        .text('National Training Week', 0, 96, { align: 'center' });

      // Divider line
      doc.moveTo(80, 125).lineTo(doc.page.width - 80, 125).lineWidth(1.5).stroke('#1a6b3c');

      // Certificate title
      doc.fillColor('#333')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 145, { align: 'center' });

      // Body text
      doc.fillColor('#555')
        .fontSize(13)
        .font('Helvetica')
        .text('This is to certify that', 0, 195, { align: 'center' });

      // Participant name
      doc.fillColor('#1a6b3c')
        .fontSize(26)
        .font('Helvetica-Bold')
        .text(participantName, 0, 218, { align: 'center' });

      // Underline for name
      const nameWidth = doc.widthOfString(participantName, { fontSize: 26 });
      const nameX = (doc.page.width - nameWidth) / 2;
      doc.moveTo(nameX, 252).lineTo(nameX + nameWidth, 252).lineWidth(1).stroke('#1a6b3c');

      doc.fillColor('#555')
        .fontSize(13)
        .font('Helvetica')
        .text('has successfully completed the training session', 0, 263, { align: 'center' });

      // Training title
      doc.fillColor('#222')
        .fontSize(17)
        .font('Helvetica-Bold')
        .text(`"${trainingTitle}"`, 80, 285, { align: 'center', width: doc.page.width - 160 });

      doc.fillColor('#555')
        .fontSize(12)
        .font('Helvetica')
        .text(`${eventName}`, 0, 325, { align: 'center' });

      // Date and Certificate ID
      const formattedDate = new Date(issuedDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      doc.fillColor('#777')
        .fontSize(10)
        .text(`Issued: ${formattedDate}`, 80, 360)
        .text(`Certificate ID: ${certificateId}`, 80, 375);

      // QR code
      if (verifyUrl) {
        const qrBuffer = await generateQRBuffer(verifyUrl);
        doc.image(qrBuffer, doc.page.width - 160, 340, { width: 90, height: 90 });
        doc.fillColor('#999').fontSize(8)
          .text('Scan to verify', doc.page.width - 165, 432, { width: 100, align: 'center' });
      }

      // Bottom divider
      doc.moveTo(80, 415).lineTo(doc.page.width - 80, 415).lineWidth(1).stroke('#ddd');

      // Signature line
      doc.fillColor('#555').fontSize(10)
        .text('_________________________', 100, 425)
        .text('Authorized Signature', 110, 445)
        .text('Hormuud University', 108, 458);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
