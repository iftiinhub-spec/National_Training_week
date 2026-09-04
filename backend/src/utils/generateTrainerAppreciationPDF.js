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
      .text('WITH GRATITUDE, THIS CERTIFICATE IS PROUDLY PRESENTED TO', 145, 151, { width: width - 200, align: 'center', characterSpacing: 1.45 });

    const safeName = trainerName || 'Trainer Name';
    const nameX = 150;
    const nameWidth = width - 210;
    // Size the name to the width it actually occupies. Character count is a poor proxy: an
    // all-uppercase name is far wider than a mixed-case one of the same length, which is how a
    // 21-character name ended up wrapping through the rule beneath it.
    let nameSize = 42;
    for (const candidate of [42, 36, 31, 27, 24, 21, 18]) {
      nameSize = candidate;
      doc.font('Times-Bold').fontSize(candidate);
      if (doc.widthOfString(safeName) <= nameWidth) break;
    }
    doc.fillColor(green).font('Times-Bold').fontSize(nameSize)
      .text(safeName, nameX, 184, { width: nameWidth, align: 'center' });
    const nameHeight = doc.heightOfString(safeName, { width: nameWidth, align: 'center' });
    // The rule follows the name down instead of sitting at a fixed y, so a name that still
    // needs two lines is underlined beneath itself rather than through itself.
    // Hold the original position for names that fit, so existing certificates are unchanged;
    // only a name tall enough to reach it pushes the rule down.
    const underlineY = Math.min(Math.max(250, 184 + nameHeight + 10), 264);
    const measuredName = Math.min(doc.widthOfString(safeName), nameWidth, width - 300);
    const nameCenter = nameX + (nameWidth / 2);
    doc.moveTo(nameCenter - (measuredName / 2), underlineY).lineTo(nameCenter + (measuredName / 2), underlineY).lineWidth(1.3).stroke(brightGreen);

    doc.fillColor(black).font('Helvetica').fontSize(12)
      .text('In recognition of your exceptional contribution as a Trainer, and in appreciation of the expertise, dedication, and inspiration you shared with our learning community.', 170, 274, { width: width - 240, align: 'center', lineGap: 4 });

    // Session recognition panel with a strong editorial hierarchy.
    const panelTop = 354;
    const titleText = trainingTitle || 'Training Session';
    const eventText = eventName || 'National Training Week';
    const textOptions = { width: width - 288 };
    const titleY = 384;
    const gap = 3;
    // The signature image starts at 439, so the panel has to stop short of it.
    const maxPanelBottom = 432;

    doc.font('Helvetica').fontSize(9.5);
    const eventHeight = doc.heightOfString(eventText, textOptions);

    // A long session title wraps onto a second line. Both rows used to be drawn at
    // fixed y positions 23pt apart, so a wrapped title ran straight through the
    // event name. Measure the title instead, and only shrink it when even the
    // taller panel could not hold it.
    let titleSize = 14.5;
    let titleHeight = 0;
    for (const size of [14.5, 13, 11.5, 10]) {
      titleSize = size;
      doc.font('Helvetica-Bold').fontSize(size);
      titleHeight = doc.heightOfString(titleText, textOptions);
      if (titleY + titleHeight + gap + eventHeight + 8 <= maxPanelBottom) break;
    }
    // An unreasonably long title is clipped rather than allowed to escape the panel.
    titleHeight = Math.min(titleHeight, maxPanelBottom - 8 - eventHeight - gap - titleY);

    // Holding the event name at its original y keeps single-line titles - the
    // overwhelming majority - rendering exactly as they always have.
    const eventY = Math.max(407, titleY + titleHeight + gap);
    const panelHeight = Math.max(74, eventY + eventHeight + 8 - panelTop);

    doc.roundedRect(166, panelTop, width - 236, panelHeight, 10).fillAndStroke(pale, '#c9e3d3');
    doc.rect(166, panelTop, 7, panelHeight).fill(brightGreen);
    doc.fillColor(green).font('Helvetica-Bold').fontSize(8)
      .text('SESSION DELIVERED', 192, 368, { width: width - 288, characterSpacing: 1.3 });
    doc.fillColor(black).font('Helvetica-Bold').fontSize(titleSize)
      .text(titleText, 192, titleY, { ...textOptions, height: titleHeight, ellipsis: true });
    doc.fillColor(muted).font('Helvetica').fontSize(9.5)
      .text(eventText, 192, eventY, textOptions);

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
