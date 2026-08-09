import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQRBuffer } from './qrGenerator.js';

const resolveAsset = (configuredPath, fallback) => {
  const candidate = configuredPath || fallback;
  if (!candidate) return null;
  const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
  return fs.existsSync(resolved) ? resolved : null;
};

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

      // Clean academic canvas using the system palette only.
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');

      // Decorative border
      doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(2).stroke('#111111');
      doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56)
        .lineWidth(1).stroke('#1a6b3c');

      doc.rect(28, 28, doc.page.width - 56, 10).fill('#1a6b3c');

      // Official program logo
      const logoPath = resolveAsset(process.env.CERTIFICATE_LOGO_PATH, '../frontend/public/logo.png');
      if (logoPath) doc.image(logoPath, 58, 50, { fit: [100, 58], align: 'left', valign: 'center' });

      // Header
      doc.fillColor('#1a6b3c')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('NATIONAL TRAINING WEEK', 0, 64, { align: 'center' });

      doc.fillColor('#111111')
        .fontSize(11)
        .font('Helvetica')
        .text('Official Certificate Program', 0, 95, { align: 'center' });

      // Divider line
      doc.moveTo(80, 125).lineTo(doc.page.width - 80, 125).lineWidth(1.5).stroke('#1a6b3c');

      // Certificate title
      doc.fillColor('#111111')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('CERTIFICATE OF COMPLETION', 0, 145, { align: 'center' });

      // Body text
      doc.fillColor('#111111')
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

      doc.fillColor('#111111')
        .fontSize(13)
        .font('Helvetica')
        .text('has successfully completed the training session', 0, 263, { align: 'center' });

      // Training title
      doc.fillColor('#111111')
        .fontSize(17)
        .font('Helvetica-Bold')
        .text(trainingTitle, 80, 285, { align: 'center', width: doc.page.width - 160 });

      doc.fillColor('#111111')
        .fontSize(12)
        .font('Helvetica')
        .text(`${eventName}`, 0, 325, { align: 'center' });

      // Date and Certificate ID
      const formattedDate = new Date(issuedDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      });

      doc.fillColor('#111111')
        .fontSize(10)
        .text(`Issued: ${formattedDate}`, 80, 360)
        .text(`Certificate ID: ${certificateId}`, 80, 375);

      // Dedicated verification block, positioned clear of dividers and signatures.
      if (verifyUrl) {
        const qrBuffer = await generateQRBuffer(verifyUrl);
        const qrX = doc.page.width - 174;
        doc.roundedRect(qrX - 10, 342, 118, 132, 8).lineWidth(1).stroke('#1a6b3c');
        doc.image(qrBuffer, qrX, 350, { width: 98, height: 98 });
        doc.fillColor('#1a6b3c').font('Helvetica-Bold').fontSize(8)
          .text('SCAN TO VERIFY', qrX - 4, 453, { width: 106, align: 'center' });
      }

      // Bottom divider stops before the verification block.
      doc.moveTo(80, 412).lineTo(doc.page.width - 205, 412).lineWidth(1).stroke('#1a6b3c');

      // Optional transparent PNG signature. A line is shown until one is configured.
      const signaturePath = resolveAsset(process.env.CERTIFICATE_SIGNATURE_PATH, 'assets/signature.png');
      if (signaturePath) doc.image(signaturePath, 96, 414, { fit: [145, 48], align: 'center', valign: 'center' });
      doc.moveTo(92, 466).lineTo(248, 466).lineWidth(0.8).stroke('#111111');
      doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9)
        .text(process.env.CERTIFICATE_SIGNATORY_NAME || 'Authorized Signatory', 92, 471, { width: 156, align: 'center' })
        .font('Helvetica').fontSize(8)
        .text(process.env.CERTIFICATE_SIGNATORY_TITLE || 'National Training Week', 92, 484, { width: 156, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
