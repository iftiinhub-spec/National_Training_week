import nodemailer from 'nodemailer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';
import SiteSettings from '../models/SiteSettings.js';
import EmailSuppression from '../models/EmailSuppression.js';
import { decryptSetting } from './settingsEncryption.js';
import { isPermanentRecipientFailure } from './emailFailure.js';

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export const emailButton = (label, href) => href ? `<table role="presentation" align="center" cellspacing="0" cellpadding="0" style="margin:28px auto;text-align:center"><tr><td class="email-button" bgcolor="#1da156" style="border-radius:8px;background:#1da156"><a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 24px;color:#ffffff!important;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.1px">${escapeHtml(label)} &nbsp;&#8594;</a></td></tr></table>` : '';

export const emailInfoCard = (rows) => {
  const visibleRows = rows.filter(([, value]) => value);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-info" style="margin:24px 0;border-collapse:separate;border:1px solid #dddddd;border-radius:10px;overflow:hidden">${visibleRows.map(([label, value], index) => `<tr><td class="email-info-label" style="width:34%;padding:12px 16px;background:#f7f7f7;border-bottom:${index === visibleRows.length - 1 ? '0' : '1px solid #e5e5e5'};color:#111111;font-size:13px;font-weight:700">${escapeHtml(label)}</td><td class="email-info-value" style="padding:12px 16px;background:#ffffff;border-bottom:${index === visibleRows.length - 1 ? '0' : '1px solid #e5e5e5'};color:#333333;font-size:14px">${escapeHtml(value)}</td></tr>`).join('')}</table>`;
};

export const emailLayout = ({ eyebrow = 'Official communication', title, preview, body }) => {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(title)}</title><style>:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){.email-page{background:#121212!important}.email-card{background:#121212!important;border-color:#333333!important}.email-logo-cell{background:#121212!important}.email-heading,.email-heading strong{color:#ffffff!important}.email-content{color:#dddddd!important}.email-info{border-color:#444444!important}.email-info-label{background:#1c1c1c!important;color:#ffffff!important;border-color:#444444!important}.email-info-value{background:#121212!important;color:#dddddd!important;border-color:#444444!important}.email-footer{background:#1c1c1c!important;color:#bdbdbd!important;border-color:#444444!important}.email-footer strong{color:#ffffff!important}.email-caption{color:#999999!important}.email-button,.email-button a{background:#1da156!important;color:#ffffff!important}}[data-ogsc] .email-page{background:#121212!important}[data-ogsc] .email-card{background:#121212!important;border-color:#333333!important}[data-ogsc] .email-logo-cell{background:#121212!important}[data-ogsc] .email-heading,[data-ogsc] .email-heading strong{color:#ffffff!important}[data-ogsc] .email-content{color:#dddddd!important}[data-ogsc] .email-info{border-color:#444444!important}[data-ogsc] .email-info-label{background:#1c1c1c!important;color:#ffffff!important;border-color:#444444!important}[data-ogsc] .email-info-value{background:#121212!important;color:#dddddd!important;border-color:#444444!important}[data-ogsc] .email-footer{background:#1c1c1c!important;color:#bdbdbd!important;border-color:#444444!important}[data-ogsc] .email-footer strong{color:#ffffff!important}</style></head><body class="email-page" bgcolor="#f4f4f4" style="margin:0;background:#f4f4f4;font-family:'Inter Variable','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111111"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preview || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-page" bgcolor="#f4f4f4" style="background:#f4f4f4;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" bgcolor="#ffffff" style="max-width:620px;background:#ffffff;border:1px solid #dddddd;border-radius:14px;overflow:hidden"><tr><td class="email-logo-cell" align="center" bgcolor="#121212" style="padding:24px 32px;background:#121212"><img src="cid:ntw-logo" width="150" alt="Hormuud University and National Training Week" style="display:block;width:150px;max-width:100%;height:auto;border:0;margin:0 auto"></td></tr><tr><td class="email-heading" style="padding:34px 32px 8px;color:#111111"><div style="font-size:11px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;color:#1da156">${escapeHtml(eyebrow)}</div><h1 style="margin:10px 0 0;color:inherit;font-family:'Inter Variable','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:29px;line-height:1.25;font-weight:700">${escapeHtml(title)}</h1><div style="margin-top:18px;width:48px;height:3px;background:#1da156"></div></td></tr><tr><td class="email-content" style="padding:20px 32px 34px;font-size:15px;line-height:1.75;color:#333333">${body}</td></tr><tr><td class="email-footer" style="border-top:1px solid #dddddd;padding:22px 32px;background:#f7f7f7;font-size:12px;line-height:1.7;color:#555555"><strong style="color:#111111">National Training Week</strong><br>Official automated communication. Please do not share private meeting or account links.</td></tr></table><div class="email-caption" style="padding:16px 12px 0;color:#777777;font-size:11px;line-height:1.5">National Training Week Management System</div></td></tr></table></body></html>`;
};

const emailLogoPath = fileURLToPath(new URL('../../../frontend/public/logo-dark.png', import.meta.url));

const isRelayTransport = () => process.env.EMAIL_TRANSPORT === 'smtp-relay';
let pooledTransporter = null;
let pooledTransportKey = '';
let settingsCache = { value: null, expiresAt: 0 };

const getEmailSettings = async () => {
  if (settingsCache.expiresAt > Date.now()) return settingsCache.value;
  const value = await SiteSettings.findOne({ key: 'global' })
    .select('emailSenderName replyToEmail smtpUser +smtpPassEncrypted')
    .lean()
    .catch(() => null);
  settingsCache = { value, expiresAt: Date.now() + 30_000 };
  return value;
};

const createTransporter = ({ user, pass } = {}) => {
  const options = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: process.env.SMTP_REQUIRE_TLS === 'true',
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    pool: true,
    maxConnections: Math.max(1, Number(process.env.SMTP_MAX_CONNECTIONS) || 3),
    maxMessages: Math.max(1, Number(process.env.SMTP_MAX_MESSAGES_PER_CONNECTION) || 100),
    rateDelta: 1_000,
    rateLimit: Math.max(1, Number(process.env.SMTP_RATE_LIMIT_PER_SECOND) || 5),
  };
  // Temporary compatibility switch for SMTP servers with an invalid certificate.
  // Remove this setting as soon as the mail server certificate is renewed.
  if (process.env.SMTP_ALLOW_INVALID_CERT === 'true') {
    options.tls = { rejectUnauthorized: false };
  }
  if (!isRelayTransport()) options.auth = { user, pass };
  return nodemailer.createTransport(options);
};

export const sendEmail = async ({ to, subject, html, text }) => {
  if (process.env.EMAIL_DELIVERY_MODE === 'disabled') {
    return { success: true, messageId: `disabled-${Date.now()}` };
  }
  const recipients = [...new Set((Array.isArray(to) ? to : [to])
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase()))];
  if (!recipients.length) return { success: false, permanent: true, error: 'No valid email recipient was provided.' };

  let suppressed = [];
  try {
    suppressed = await EmailSuppression.find({ email: { $in: recipients } }).select('email reason').lean();
  } catch (error) {
    console.error('Email suppression lookup error:', error.message);
  }
  const suppressedEmails = new Set(suppressed.map(({ email }) => email));
  const allowedRecipients = recipients.filter((email) => !suppressedEmails.has(email));
  if (!allowedRecipients.length) {
    return { success: false, permanent: true, suppressed: true, error: 'Recipient is suppressed after a permanent delivery failure.' };
  }

  try {
    const settings = await getEmailSettings();
    const relayTransport = isRelayTransport();
    const senderAddress = relayTransport ? '' : (settings?.smtpUser || process.env.SMTP_USER);
    let senderPassword = relayTransport ? '' : process.env.SMTP_PASS;
    if (!relayTransport && settings?.smtpPassEncrypted) {
      try { senderPassword = decryptSetting(settings.smtpPassEncrypted); } catch { throw new Error('Saved email credential could not be decrypted. Re-enter the App Password in Admin Settings.'); }
    }
    const transportKey = createHash('sha256').update(JSON.stringify({
      relayTransport,
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      requireTLS: process.env.SMTP_REQUIRE_TLS,
      senderAddress,
      senderPassword,
    })).digest('hex');
    if (!pooledTransporter || pooledTransportKey !== transportKey) {
      pooledTransporter?.close();
      pooledTransporter = createTransporter({ user: senderAddress, pass: senderPassword });
      pooledTransportKey = transportKey;
    }
    const from = !relayTransport && settings?.emailSenderName && senderAddress
      ? `"${settings.emailSenderName.replaceAll('"', '')}" <${senderAddress}>`
      : process.env.EMAIL_FROM;
    const attachments = fs.existsSync(emailLogoPath) ? [{ filename: 'hormuud-ntw-logo.png', path: emailLogoPath, cid: 'ntw-logo' }] : [];
    const info = await pooledTransporter.sendMail({ from, replyTo: settings?.replyToEmail || undefined, to: allowedRecipients.join(', '), subject, html, text: text || html.replace(/<[^>]*>/g, ''), attachments });
    return { success: true, messageId: info.messageId, suppressedRecipients: [...suppressedEmails] };
  } catch (error) {
    console.error('Email send error:', error.message);
    const permanent = isPermanentRecipientFailure(error);
    if (permanent) {
      const rejected = Array.isArray(error.rejected)
        ? error.rejected.map((email) => String(email).trim().toLowerCase())
        : allowedRecipients;
      await Promise.all(rejected.map((email) => EmailSuppression.updateOne(
        { email },
        { $set: { reason: String(error.response || error.message || 'Permanent recipient rejection').slice(0, 500), smtpCode: Number(error.responseCode) || null, source: 'smtp', suppressedAt: new Date() } },
        { upsert: true },
      ).catch((suppressionError) => console.error('Email suppression write error:', suppressionError.message))));
    }
    return { success: false, permanent, error: error.message };
  }
};

export const closeEmailTransporter = () => {
  pooledTransporter?.close();
  pooledTransporter = null;
  pooledTransportKey = '';
  settingsCache = { value: null, expiresAt: 0 };
};

export const sendInvitationEmail = ({ to, trainingTitle, eventName, meetingUrl, meetingId, passcode, startTime, platform, notes }) => {
  const platformNames = { zoom: 'Zoom', google_meet: 'Google Meet', teams: 'Microsoft Teams', other: 'Online' };
  return sendEmail({ to, subject: `Invitation: ${trainingTitle} — National Training Week`, html: emailLayout({ title: 'Your training invitation', preview: `Join ${trainingTitle}`, body: `<p style="margin-top:0">You are invited to attend the following expert-led session.</p>${emailInfoCard([['Training', trainingTitle], ['Event', eventName], ['Date and time', startTime ? new Date(startTime).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short', hour12: true }) : ''], ['Platform', platformNames[platform] || platform], ['Meeting ID', meetingId], ['Passcode', passcode]])}${emailButton('Join the live session', meetingUrl)}${notes ? `<p style="background:#fefce8;border-radius:10px;padding:14px"><strong>Joining notes:</strong> ${escapeHtml(notes)}</p>` : ''}<p>Keep this email available for the session. The meeting link is intended for registered attendees.</p>` }) });
};

const formatRemainingTime = (startTime) => {
  const milliseconds = new Date(startTime).getTime() - Date.now();
  if (!Number.isFinite(milliseconds)) return 'The session schedule is available in your participant portal.';
  if (milliseconds <= 0) return 'The session has already started.';
  const totalMinutes = Math.ceil(milliseconds / 60_000);
  if (totalMinutes <= 1) return 'The session is starting now.';
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days === 1 && hours === 0) return 'The session starts tomorrow.';
  if (days > 0) return `The session starts in ${days} day${days === 1 ? '' : 's'}${hours ? ` and ${hours} hour${hours === 1 ? '' : 's'}` : ''}.`;
  if (hours > 0) return `The session starts in ${hours} hour${hours === 1 ? '' : 's'}${minutes ? ` and ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}.`;
  return `The session starts in ${minutes} minutes.`;
};

export const sendReminderEmail = ({ to, trainingTitle, startTime, type = 'reminder' }) => {
  const labels = { reminder: 'Session reminder', schedule_change: 'Schedule change', cancellation: 'Cancellation notice' };
  const label = labels[type] || 'Session notice';
  const timingMessage = type === 'reminder' ? formatRemainingTime(startTime) : 'There is an update to your training session.';
  const formattedStart = startTime ? new Date(startTime).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short', hour12: true }) : '';
  return sendEmail({ to, subject: `${label}: ${trainingTitle}`, html: emailLayout({ eyebrow: label, title: trainingTitle, preview: `${label}: ${trainingTitle}`, body: `<p style="margin-top:0"><strong>${escapeHtml(timingMessage)}</strong></p>${emailInfoCard([['Training', trainingTitle], ['Scheduled start', formattedStart], ...(type === 'reminder' ? [['Time remaining', timingMessage.replace(/^The session (starts|is starting) /, '').replace(/\.$/, '')]] : [])])}<p>Open your participant portal for the latest schedule and access information. For security, meeting access is not included in reminder emails.</p>` }) });
};

export const sendCertificateIssuedEmail = ({ to, participantName, trainingTitle, certificateId, verifyUrl, portalUrl }) => sendEmail({
  to,
  subject: `Your certificate is ready: ${trainingTitle}`,
  html: emailLayout({ eyebrow: 'Verified achievement', title: 'Your certificate is ready', preview: `Certificate issued for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>Congratulations. Your attendance and completion have been verified, and your official certificate is now available.</p>${emailInfoCard([['Training', trainingTitle], ['Certificate ID', certificateId]])}${emailButton('View and download certificate', portalUrl)}<p style="font-size:13px">Public verification: <a href="${escapeHtml(verifyUrl)}" style="color:#1a6b3c">${escapeHtml(verifyUrl)}</a></p>` }),
});

export const sendTrainerCertificateIssuedEmail = ({ to, trainerName, trainingTitle, certificateId, verifyUrl, portalUrl }) => sendEmail({
  to,
  subject: `Certificate of Appreciation: ${trainingTitle}`,
  html: emailLayout({ eyebrow: 'Trainer recognition', title: 'Your Certificate of Appreciation is ready', preview: `Thank you for delivering ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(trainerName || 'Trainer')},</p><p>Thank you for sharing your expertise during National Training Week. Your session has been completed, and your official Certificate of Appreciation is now available.</p>${emailInfoCard([['Session', trainingTitle], ['Certificate ID', certificateId]])}${emailButton('View and download certificate', portalUrl)}<p style="font-size:13px">Public verification: <a href="${escapeHtml(verifyUrl)}" style="color:#1a6b3c">${escapeHtml(verifyUrl)}</a></p>` }),
});
