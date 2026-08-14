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

export const generateCertificatePDF = async ({
  participantName,
  trainingTitle,
  eventName,
  issuedDate,
  certificateId,
  verifyUrl,
}) => new Promise(async (resolve, reject) => {
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
    const muted = '#59635d';
    const pale = '#f2faf5';

    doc.rect(0, 0, width, height).fill('#ffffff');

    // Formal academic frame with subtle corner details.
    doc.rect(18, 18, width - 36, height - 36).lineWidth(1.8).stroke(black);
    doc.rect(26, 26, width - 52, height - 52).lineWidth(0.8).stroke(green);
    doc.rect(27, 27, width - 54, 7).fill(green);
    doc.rect(27, height - 34, width - 54, 7).fill(green);
    const corner = 34;
    [[38, 47], [width - 38, 47], [38, height - 47], [width - 38, height - 47]].forEach(([x, y], index) => {
      const directionX = index % 2 === 0 ? 1 : -1;
      const directionY = index < 2 ? 1 : -1;
      doc.moveTo(x, y).lineTo(x + (corner * directionX), y).lineWidth(2).stroke(brightGreen);
      doc.moveTo(x, y).lineTo(x, y + (corner * directionY)).lineWidth(2).stroke(brightGreen);
    });

    const universityLogoPath = resolveAsset(null, 'assets/hu-official-logo.png');
    const ntwLogoPath = resolveAsset(process.env.CERTIFICATE_NTW_LOGO_PATH, '../frontend/public/Logo ntw full og.png');
    if (universityLogoPath) doc.image(universityLogoPath, 61, 48, { fit: [74, 64], align: 'center', valign: 'center' });
    if (ntwLogoPath) doc.image(ntwLogoPath, width - 190, 53, { fit: [128, 52], align: 'center', valign: 'center' });

    doc.fillColor(green).font('Helvetica-Bold').fontSize(19)
      .text('NATIONAL TRAINING WEEK', 205, 56, { width: width - 410, align: 'center', characterSpacing: 1.15 });
    doc.fillColor(muted).font('Helvetica').fontSize(8.5)
      .text('OFFICIAL LEARNING CREDENTIAL', 205, 84, { width: width - 410, align: 'center', characterSpacing: 1.45 });
    doc.moveTo(252, 107).lineTo(width - 252, 107).lineWidth(1).stroke(green);

    doc.fillColor(green).font('Helvetica-Bold').fontSize(8.5)
      .text('THIS OFFICIAL CERTIFICATE IS PRESENTED TO', 100, 137, { width: width - 200, align: 'center', characterSpacing: 1.45 });
    doc.fillColor(black).font('Times-Bold').fontSize(33)
      .text('Certificate of Completion', 100, 158, { width: width - 200, align: 'center' });

    const safeName = participantName || 'Participant Name';
    const nameSize = safeName.length > 38 ? 25 : 30;
    const nameX = 120;
    const nameWidth = width - 240;
    doc.fillColor(green).font('Times-Bold').fontSize(nameSize)
      .text(safeName, nameX, 220, { width: nameWidth, align: 'center' });
    const measuredName = Math.min(doc.widthOfString(safeName), width - 360);
    const nameCenter = nameX + (nameWidth / 2);
    doc.moveTo(nameCenter - (measuredName / 2), 261)
      .lineTo(nameCenter + (measuredName / 2), 261)
      .lineWidth(1.2).stroke(brightGreen);

    doc.fillColor(black).font('Helvetica').fontSize(11.5)
      .text('has successfully completed the following training session and fulfilled its participation requirements.', 130, 280, { width: width - 260, align: 'center', lineGap: 3 });

    // The completed session is the central achievement record.
    const panelX = 145;
    const panelWidth = width - 290;
    doc.roundedRect(panelX, 329, panelWidth, 86, 8).fillAndStroke(pale, '#c9e3d3');
    doc.rect(panelX, 329, 7, 86).fill(brightGreen);
    doc.fillColor(green).font('Helvetica-Bold').fontSize(8)
      .text('TRAINING COMPLETED', panelX + 27, 345, { width: panelWidth - 54, align: 'center', characterSpacing: 1.35 });
    doc.fillColor(black).font('Helvetica-Bold').fontSize(16)
      .text(trainingTitle || 'Training Session', panelX + 28, 365, { width: panelWidth - 56, align: 'center' });
    doc.fillColor(muted).font('Helvetica').fontSize(9.5)
      .text(eventName || 'National Training Week', panelX + 28, 392, { width: panelWidth - 56, align: 'center' });

    const dateValue = new Date(issuedDate || Date.now());
    const formattedDate = Number.isNaN(dateValue.getTime())
      ? ''
      : dateValue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    doc.fillColor(green).font('Helvetica-Bold').fontSize(7.8)
      .text('DATE OF ISSUE', 105, 447, { width: 190, align: 'center', characterSpacing: 1 });
    doc.fillColor(black).font('Helvetica').fontSize(9.5)
      .text(formattedDate, 105, 462, { width: 190, align: 'center' });
    doc.fillColor(muted).fontSize(7.3)
      .text(`Certificate ID: ${certificateId || ''}`, 87, 484, { width: 226, align: 'center' });

    const signaturePath = resolveAsset(settings?.certificateSignature || process.env.CERTIFICATE_SIGNATURE_PATH, 'assets/signature.png');
    const signX = (width / 2) - 88;
    if (signaturePath) doc.image(signaturePath, signX + 15, 431, { fit: [146, 42], align: 'center', valign: 'center' });
    doc.moveTo(signX, 476).lineTo(signX + 176, 476).lineWidth(0.8).stroke(black);
    doc.fillColor(black).font('Helvetica-Bold').fontSize(8.5)
      .text(settings?.certificateSignatoryName || process.env.CERTIFICATE_SIGNATORY_NAME || 'Authorized Signatory', signX, 482, { width: 176, align: 'center' });
    doc.fillColor(muted).font('Helvetica').fontSize(7.5)
      .text(settings?.certificateSignatoryTitle || process.env.CERTIFICATE_SIGNATORY_TITLE || 'National Training Week', signX, 495, { width: 176, align: 'center' });

    if (verifyUrl) {
      const qrBuffer = await generateQRBuffer(verifyUrl);
      const qrX = width - 192;
      doc.image(qrBuffer, qrX, 438, { width: 66, height: 66 });
      doc.fillColor(green).font('Helvetica-Bold').fontSize(6.8)
        .text('SCAN TO VERIFY', qrX - 5, 508, { width: 76, align: 'center', characterSpacing: 0.35 });
    }

    doc.fillColor(green).font('Helvetica-Bold').fontSize(7.3)
      .text('KNOWLEDGE  •  PARTICIPATION  •  ACHIEVEMENT', 110, height - 56, { width: width - 220, align: 'center', characterSpacing: 1.25 });

    doc.end();
  } catch (error) {
    reject(error);
  }
});
