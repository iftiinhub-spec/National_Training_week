import nodemailer from 'nodemailer';
import SiteSettings from '../models/SiteSettings.js';
import { decryptSetting } from './settingsEncryption.js';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export const emailButton = (label, href) => href ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px auto"><tr><td style="border-radius:10px;background:#1a6b3c"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 24px;color:#fff;text-decoration:none;font-weight:700;font-size:14px">${escapeHtml(label)}</a></td></tr></table>` : '';

export const emailInfoCard = (rows) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;background:#f8fafc;border-left:4px solid #1a6b3c;border-radius:10px"><tr><td style="padding:17px 18px">${rows.filter(([, value]) => value).map(([label, value]) => `<div style="margin:4px 0"><strong style="color:#111827">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</div>`).join('')}</td></tr></table>`;

export const emailLayout = ({ eyebrow = 'National Training Week', title, preview, body }) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head><body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden"><tr><td style="background:#1a6b3c;padding:28px 32px;color:#fff"><div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#bbf7d0">${escapeHtml(eyebrow)}</div><h1 style="margin:9px 0 0;font-size:26px;line-height:1.25">${escapeHtml(title)}</h1></td></tr><tr><td style="padding:30px 32px;font-size:15px;line-height:1.7;color:#475569">${body}</td></tr><tr><td style="border-top:1px solid #e5e7eb;padding:20px 32px;font-size:12px;line-height:1.6;color:#64748b">National Training Week<br>This is an automated service message.</td></tr></table></td></tr></table></body></html>`;

const createTransporter = ({ user, pass }) => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
  auth: { user, pass },
});

export const sendEmail = async ({ to, subject, html, text }) => {
  let transporter;
  try {
    const settings = await SiteSettings.findOne({ key: 'global' }).select('emailSenderName replyToEmail smtpUser +smtpPassEncrypted').lean().catch(() => null);
    const senderAddress = settings?.smtpUser || process.env.SMTP_USER;
    let senderPassword = process.env.SMTP_PASS;
    if (settings?.smtpPassEncrypted) {
      try { senderPassword = decryptSetting(settings.smtpPassEncrypted); } catch { throw new Error('Saved email credential could not be decrypted. Re-enter the App Password in Admin Settings.'); }
    }
    transporter = createTransporter({ user: senderAddress, pass: senderPassword });
    const from = settings?.emailSenderName && senderAddress
      ? `"${settings.emailSenderName.replaceAll('"', '')}" <${senderAddress}>`
      : process.env.EMAIL_FROM;
    const info = await transporter.sendMail({ from, replyTo: settings?.replyToEmail || undefined, to: Array.isArray(to) ? to.join(', ') : to, subject, html, text: text || html.replace(/<[^>]*>/g, '') });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  } finally { transporter?.close(); }
};

export const sendInvitationEmail = ({ to, trainingTitle, eventName, meetingUrl, meetingId, passcode, startTime, platform, notes }) => {
  const platformNames = { zoom: 'Zoom', google_meet: 'Google Meet', teams: 'Microsoft Teams', other: 'Online' };
  return sendEmail({ to, subject: `Invitation: ${trainingTitle} — National Training Week`, html: emailLayout({ title: 'Your training invitation', preview: `Join ${trainingTitle}`, body: `<p style="margin-top:0">You are invited to attend the following expert-led session.</p>${emailInfoCard([['Training', trainingTitle], ['Event', eventName], ['Date and time', startTime ? new Date(startTime).toLocaleString() : ''], ['Platform', platformNames[platform] || platform], ['Meeting ID', meetingId], ['Passcode', passcode]])}${emailButton('Join the live session', meetingUrl)}${notes ? `<p style="background:#fefce8;border-radius:10px;padding:14px"><strong>Joining notes:</strong> ${escapeHtml(notes)}</p>` : ''}<p>Keep this email available for the session. The meeting link is intended for registered attendees.</p>` }) });
};

export const sendReminderEmail = ({ to, trainingTitle, startTime, meetingUrl, type = 'reminder' }) => {
  const labels = { reminder: 'Session reminder', schedule_change: 'Schedule change', cancellation: 'Cancellation notice' };
  const label = labels[type] || 'Session notice';
  return sendEmail({ to, subject: `${label}: ${trainingTitle}`, html: emailLayout({ eyebrow: label, title: trainingTitle, preview: `${label}: ${trainingTitle}`, body: `<p style="margin-top:0">${type === 'reminder' ? 'Your training session is approaching.' : 'There is an update to your training session.'}</p>${emailInfoCard([['Training', trainingTitle], ['Date and time', startTime ? new Date(startTime).toLocaleString() : '']])}${emailButton('Open meeting', meetingUrl)}<p>Please check your participant portal for the latest information.</p>` }) });
};

export const sendCertificateIssuedEmail = ({ to, participantName, trainingTitle, certificateId, verifyUrl, portalUrl }) => sendEmail({
  to,
  subject: `Your certificate is ready: ${trainingTitle}`,
  html: emailLayout({ eyebrow: 'Verified achievement', title: 'Your certificate is ready', preview: `Certificate issued for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>Congratulations. Your attendance and completion have been verified, and your official certificate is now available.</p>${emailInfoCard([['Training', trainingTitle], ['Certificate ID', certificateId]])}${emailButton('View and download certificate', portalUrl)}<p style="font-size:13px">Public verification: <a href="${escapeHtml(verifyUrl)}" style="color:#1a6b3c">${escapeHtml(verifyUrl)}</a></p>` }),
});
