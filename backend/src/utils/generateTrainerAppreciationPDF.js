import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { generateQRBuffer } from './qrGenerator.js';
import SiteSettings from '../models/SiteSettings.js';

const resolveAsset = (configuredPath, fallback) => {
  const candidate = configuredPath || fallback;
  if (!candidate) return null;
  const resolved = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
  return fs.existsSync(resolved) ? resolved : null;
};

export const generateTrainerAppreciationPDF = async ({ trainerName, trainingTitle, eventName, issuedDate, certificateId, verifyUrl }) => new Promise(async (resolve, reject) => {
  try {
    const settings = await SiteSettings.findOne({ key: 'global' }).lean().catch(() => null);
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const width = doc.page.width;
    const height = doc.page.height;
    const green = '#176b3b';
    const brightGreen = '#1da156';
    const black = '#111111';
    const pale = '#f2faf5';
    const muted = '#5b665f';

    doc.rect(0, 0, width, height).fill('#ffffff');

    // Premium asymmetric frame: a distinctive trainer award, not a completion certificate.
    doc.rect(18, 18, width - 36, height - 36).lineWidth(1.8).stroke(black);
    doc.rect(25, 25, width - 50, height - 50).lineWidth(0.8).stroke(green);
    doc.rect(26, 26, 88, height - 52).fill(green);
    doc.rect(34, 34, 4, height - 68).fill('#ffffff');

    // Quiet geometric detailing on the green ribbon.
    doc.save().opacity(0.20).lineWidth(1).strokeColor('#ffffff');
    for (let y = 72; y < height - 70; y += 68) {
      doc.polygon([70, y], [96, y + 26], [70, y + 52], [44, y + 26]).stroke();
      doc.polygon([70, y + 10], [86, y + 26], [70, y + 42], [54, y + 26]).stroke();
    }
    doc.restore();

    const universityLogoPath = resolveAsset(null, 'assets/hu-official-logo.png');
    const ntwLogoPath = resolveAsset(process.env.CERTIFICATE_NTW_LOGO_PATH, '../frontend/public/Logo ntw full og.png');

    // Keep both official logos unframed and directly on the certificate canvas.
    if (universityLogoPath) doc.image(universityLogoPath, 144, 49, { fit: [66, 60], align: 'center', valign: 'center' });
    if (ntwLogoPath) doc.image(ntwLogoPath, width - 208, 52, { fit: [140, 52], align: 'center', valign: 'center' });

    doc.fillColor(green).font('Helvetica-Bold').fontSize(18)
      .text('NATIONAL TRAINING WEEK', 245, 57, { width: width - 485, align: 'center', characterSpacing: 1.1 });
    doc.fillColor(muted).font('Helvetica').fontSize(8.5)
      .text('RECOGNITION OF TRAINING EXCELLENCE', 245, 84, { width: width - 485, align: 'center', characterSpacing: 1.2 });
    doc.moveTo(244, 106).lineTo(width - 244, 106).lineWidth(1).stroke(green);

    doc.fillColor(green).font('Helvetica-Bold').fontSize(8.5)
      .text('WITH GRATITUDE, WE PRESENT THIS', 145, 137, { width: width - 200, align: 'center', characterSpacing: 1.7 });
    doc.fillColor(black).font('Times-Bold').fontSize(31)
      .text('Certificate of Appreciation', 145, 157, { width: width - 200, align: 'center' });

    doc.fillColor(muted).font('Helvetica').fontSize(11)
      .text('to', 145, 208, { width: width - 200, align: 'center' });

    const safeName = trainerName || 'Trainer Name';
    const nameSize = safeName.length > 34 ? 25 : 30;
    const nameX = 150;
    const nameWidth = width - 210;
    doc.fillColor(green).font('Times-Bold').fontSize(nameSize)
      .text(safeName, nameX, 228, { width: nameWidth, align: 'center' });
    const measuredName = Math.min(doc.widthOfString(safeName), width - 340);
    const nameCenter = nameX + (nameWidth / 2);
    doc.moveTo(nameCenter - (measuredName / 2), 270).lineTo(nameCenter + (measuredName / 2), 270).lineWidth(1.3).stroke(brightGreen);

    doc.fillColor(black).font('Helvetica').fontSize(12)
      .text('In recognition of your exceptional contribution as a Trainer, and in appreciation of the expertise, dedication, and inspiration you shared with our learning community.', 170, 289, { width: width - 240, align: 'center', lineGap: 4 });

    // Session recognition panel with a strong editorial hierarchy.
    doc.roundedRect(166, 354, width - 236, 74, 10).fillAndStroke(pale, '#c9e3d3');
    doc.rect(166, 354, 7, 74).fill(brightGreen);
    doc.fillColor(green).font('Helvetica-Bold').fontSize(8)
      .text('SESSION DELIVERED', 192, 368, { width: width - 288, characterSpacing: 1.3 });
    doc.fillColor(black).font('Helvetica-Bold').fontSize(14.5)
      .text(trainingTitle || 'Training Session', 192, 384, { width: width - 288 });
    doc.fillColor(muted).font('Helvetica').fontSize(9.5)
      .text(eventName || 'National Training Week', 192, 407, { width: width - 288 });

    const formattedDate = new Date(issuedDate || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fillColor(green).font('Helvetica-Bold').fontSize(8)
      .text('AWARDED ON', 148, 452, { width: 156, align: 'center', characterSpacing: 1 });
    doc.fillColor(black).font('Helvetica').fontSize(9.5)
      .text(formattedDate, 148, 467, { width: 156, align: 'center' });
    doc.fillColor(muted).fontSize(7.5)
      .text(`Certificate ID: ${certificateId}`, 130, 489, { width: 192, align: 'center' });

    const signaturePath = resolveAsset(settings?.certificateSignature || process.env.CERTIFICATE_SIGNATURE_PATH, 'assets/signature.png');
    const signX = width / 2 - 88;
    if (signaturePath) doc.image(signaturePath, signX + 15, 439, { fit: [146, 42], align: 'center', valign: 'center' });
    doc.moveTo(signX, 482).lineTo(signX + 176, 482).lineWidth(0.8).stroke(black);
    doc.fillColor(black).font('Helvetica-Bold').fontSize(8.5)
      .text(settings?.certificateSignatoryName || process.env.CERTIFICATE_SIGNATORY_NAME || 'Authorized Signatory', signX, 488, { width: 176, align: 'center' });
    doc.fillColor(muted).font('Helvetica').fontSize(7.5)
      .text(settings?.certificateSignatoryTitle || process.env.CERTIFICATE_SIGNATORY_TITLE || 'National Training Week', signX, 501, { width: 176, align: 'center' });

    if (verifyUrl) {
      const qrBuffer = await generateQRBuffer(verifyUrl);
      const qrX = width - 173;
      doc.image(qrBuffer, qrX, 451, { width: 62, height: 62 });
      doc.fillColor(green).font('Helvetica-Bold').fontSize(6.8)
        .text('VERIFY', qrX, 516, { width: 62, align: 'center' });
    }

    doc.fillColor(green).font('Helvetica-Bold').fontSize(7.5)
      .text('EXCELLENCE IN KNOWLEDGE SHARING', 138, height - 54, { width: width - 190, align: 'center', characterSpacing: 1.5 });

    doc.end();
  } catch (error) {
    reject(error);
  }
});
