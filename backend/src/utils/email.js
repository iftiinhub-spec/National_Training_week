import nodemailer from 'nodemailer';
import { createHash } from 'node:crypto';
import SiteSettings from '../models/SiteSettings.js';
import { decryptSetting } from './settingsEncryption.js';
import { enqueueEmail } from '../services/emailQueue.js';

export const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');


// One palette for every message. Light values are inlined because mail clients strip embedded
// stylesheets in places; the dark equivalents live in the layout's media query.
const C = {
  green: '#176b3b',        // brand green on light surfaces, meets contrast on white
  greenDark: '#1da156',    // lifted for dark surfaces
  pageBg: '#ffffff',
  cardBg: '#ffffff',
  rule: '#d9e8df',         // pale green hairline
  heading: '#0f1a14',      // near-black with a green cast
  value: '#0f1a14',
  body: '#20342a',
  label: '#176b3b',        // labels carry the brand green instead of grey
  muted: '#2f4a3b',
  footerBg: '#ffffff',
};
const FONT = "Arial,'Helvetica Neue',Helvetica,sans-serif";

// Primary action. Left aligned so it reads as part of the message, not a floating banner.
export const emailButton = (label, href) => href ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px 0 4px"><tr><td class="email-button" bgcolor="${C.green}" style="border-radius:7px;background:${C.green}"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 26px;color:#ffffff!important;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:.1px">${escapeHtml(label)}</a></td></tr></table>` : '';

// Label above value on its own line. A two-column grid forces long session titles into a narrow
// well and wraps them badly, which is what made the old card read like a table dump.
export const emailInfoCard = (rows) => {
  const visibleRows = rows.filter(([, value]) => value);
  if (!visibleRows.length) return '';
  const cells = visibleRows.map(([label, value]) => `<tr><td class="email-row" style="padding:8px 0"><div class="email-info-label" style="font-size:12px;font-weight:700;color:${C.label}">${escapeHtml(label)}</div><div class="email-info-value" style="margin-top:2px;font-size:15px;line-height:1.4;font-weight:600;word-break:break-word;color:${C.value}">${escapeHtml(value)}</div></td></tr>`).join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-info" style="margin:18px 0 6px;border-top:1px solid ${C.rule}">${cells}</table>`;
};

// Supporting instruction, rendered as ordinary body text rather than a boxed callout. It carries
// no inline colour so it inherits the dark-mode override applied to .email-content.
export const emailNote = (content) => `<p style="margin:14px 0 0;font-size:15px;line-height:1.6">${content}</p>`;

// Shared row style for the digest emails, which list several sessions or certificates.
export const emailList = (items) => {
  const visible = (items || []).filter((item) => item && item.title);
  if (!visible.length) return '';
  const cells = visible.map(({ title, meta }) => `<tr><td class="email-row" style="padding:9px 0"><div class="email-info-value" style="font-size:15px;font-weight:700;line-height:1.4;word-break:break-word;color:${C.value}">${escapeHtml(title)}</div>${meta ? `<div class="email-info-label" style="margin-top:4px;font-size:13px;line-height:1.5;font-weight:400;color:${C.label}">${escapeHtml(meta)}</div>` : ''}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-info" style="margin:16px 0 6px;border-top:1px solid ${C.rule}">${cells}</table>`;
};

export const emailLayout = ({ eyebrow = 'Official communication', title, preview, body, sensitive = false }) => {
  // `sensitive` marks the two emails that actually carry a private access link. A warning shown
  // on every message gets tuned out, so it is reserved for the ones where sharing has a cost.
  const footerNote = sensitive
    ? 'This email contains a private access link intended only for you. Please do not forward or share it.'
    : 'This is an automated message \u2014 there is no need to reply.';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(title)}</title><style>:root{color-scheme:light dark;supported-color-schemes:light dark}@media (prefers-color-scheme:dark){.email-page{background:#12150f!important}.email-card{background:#12150f!important}.email-title,.email-heading{color:#f2f5f3!important}.email-eyebrow{color:#34d399!important}.email-content{color:#cfe0d6!important}.email-info,.email-row{border-color:#274a37!important}.email-info-label{color:#34d399!important}.email-info-value{color:#f2f5f3!important}.email-footer{background:#12150f!important;border-color:#274a37!important;color:#9dc0ad!important}.email-footer strong{color:#f2f5f3!important}.email-button,.email-button a{background:#1da156!important;color:#ffffff!important}.email-link{color:#34d399!important}}[data-ogsc] .email-page{background:#12150f!important}[data-ogsc] .email-card{background:#12150f!important}[data-ogsc] .email-title,[data-ogsc] .email-heading{color:#f2f5f3!important}[data-ogsc] .email-eyebrow{color:#34d399!important}[data-ogsc] .email-content{color:#cfe0d6!important}[data-ogsc] .email-info,[data-ogsc] .email-row{border-color:#274a37!important}[data-ogsc] .email-info-label{color:#34d399!important}[data-ogsc] .email-info-value{color:#f2f5f3!important}[data-ogsc] .email-footer{background:#12150f!important;border-color:#274a37!important;color:#9dc0ad!important}[data-ogsc] .email-footer strong{color:#f2f5f3!important}[data-ogsc] .email-button,[data-ogsc] .email-button a{background:#1da156!important;color:#ffffff!important}[data-ogsc] .email-link{color:#34d399!important}@media only screen and (max-width:620px){.email-outer{padding:12px 6px!important}.email-pad{padding-left:18px!important;padding-right:18px!important}.email-title{font-size:20px!important;line-height:1.24!important}.email-content{font-size:15px!important;line-height:1.55!important}.email-info-value{font-size:14px!important}.email-button a{display:block!important;text-align:center!important}}</style></head><body class="email-page" bgcolor="${C.pageBg}" style="margin:0;padding:0;background:${C.pageBg};font-family:${FONT};color:${C.value};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;width:100%"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preview || title)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-page email-outer" bgcolor="${C.pageBg}" style="background:${C.pageBg};padding:20px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" bgcolor="${C.cardBg}" style="max-width:600px;background:${C.cardBg}"><tr><td class="email-heading email-pad" style="padding:26px 32px 0"><div class="email-eyebrow" style="font-size:12px;font-weight:700;color:${C.green}">${escapeHtml(eyebrow)}</div><h1 class="email-title" style="margin:8px 0 0;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;letter-spacing:-.3px;color:${C.heading}">${escapeHtml(title)}</h1></td></tr><tr><td class="email-content email-pad" style="padding:14px 32px 24px;font-size:15px;line-height:1.6;color:${C.body}">${body}</td></tr><tr><td class="email-footer email-pad" style="padding:26px 32px 22px;background:${C.footerBg};font-size:12px;line-height:1.6;color:${C.muted}"><strong style="color:#1a2620">National Training Week</strong> &middot; Hormuud University<br>${footerNote}</td></tr></table></td></tr></table></body></html>`;
};

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

export const deliverEmailNow = async ({ to, subject, html, text }) => {
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
    const info = await pooledTransporter.sendMail({ from, replyTo: settings?.replyToEmail || undefined, to: Array.isArray(to) ? to.join(', ') : to, subject, html, text: text || html.replace(/<[^>]*>/g, '') });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// Features persist messages first; only the controlled outbox worker contacts SMTP.
export const sendEmail = (message) => enqueueEmail(message);

export const closeEmailTransporter = () => {
  pooledTransporter?.close();
  pooledTransporter = null;
  pooledTransportKey = '';
  settingsCache = { value: null, expiresAt: 0 };
};

export const sendInvitationEmail = ({ to, trainingTitle, eventName, meetingUrl, meetingId, passcode, startTime, platform, notes }) => {
  const platformNames = { zoom: 'Zoom', google_meet: 'Google Meet', teams: 'Microsoft Teams', other: 'Online' };
  return sendEmail({ to, category: 'invitation', expiresAt: startTime || null, subject: `Invitation: ${trainingTitle} — National Training Week`, html: emailLayout({ sensitive: true, title: 'Your training invitation', preview: `Join ${trainingTitle}`, body: `<p style="margin-top:0">You are invited to attend the following expert-led session.</p>${emailInfoCard([['Training', trainingTitle], ['Event', eventName], ['Date and time', startTime ? new Date(startTime).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', dateStyle: 'medium', timeStyle: 'short', hour12: true }) : ''], ['Platform', platformNames[platform] || platform], ['Meeting ID', meetingId], ['Passcode', passcode]])}${emailButton('Join the live session', meetingUrl)}${notes ? emailNote(`<strong>Joining notes:</strong> ${escapeHtml(notes)}`) : ''}<p>Keep this email available for the session. The meeting link is intended for registered attendees.</p>` }) });
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
  return sendEmail({ to, category: type, expiresAt: type === 'cancellation' ? null : (startTime || null), subject: `${label}: ${trainingTitle}`, html: emailLayout({ eyebrow: label, title: trainingTitle, preview: `${label}: ${trainingTitle}`, body: `<p style="margin-top:0"><strong>${escapeHtml(timingMessage)}</strong></p>${emailInfoCard([['Training', trainingTitle], ['Scheduled start', formattedStart], ...(type === 'reminder' ? [['Time remaining', timingMessage.replace(/^The session (starts|is starting) /, '').replace(/\.$/, '')]] : [])])}<p>Open your participant portal for the latest schedule and access information. For security, meeting access is not included in reminder emails.</p>` }) });
};

export const sendReminderDigestEmail = ({ to, recipientName, dateKey, sessions }) => {
  const validSessions = (sessions || []).filter((session) => session?.trainingTitle && session?.startTime && new Date(session.startTime) > new Date());
  if (!validSessions.length) return Promise.resolve({ success: false, queued: false, error: 'No future sessions were available for the reminder summary.' });
  const rows = validSessions
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map((session) => ({ title: session.trainingTitle, meta: new Date(session.startTime).toLocaleString('en-US', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'short', hour12: true }) }));
  const latestStart = new Date(Math.max(...validSessions.map((session) => new Date(session.startTime).getTime())));
  const count = validSessions.length;
  return sendEmail({
    to,
    category: 'reminder',
    subject: count === 1 ? `Upcoming session: ${validSessions[0].trainingTitle}` : `Your schedule: ${count} upcoming training sessions`,
    dedupeKey: `daily-reminder:${dateKey}:${String(to).trim().toLowerCase()}`,
    expiresAt: latestStart,
    html: emailLayout({
      eyebrow: 'Upcoming schedule',
      title: count === 1 ? 'Your session is coming up' : 'Your upcoming training schedule',
      preview: `You have ${count} upcoming training ${count === 1 ? 'session' : 'sessions'}.`,
      body: `<p style="margin-top:0">Hello ${escapeHtml(recipientName || 'Participant')},</p><p>This single summary replaces separate reminder messages for each session.</p>${emailList(rows)}${emailButton('View my schedule', `${process.env.FRONTEND_URL}/portal/trainings`)}<p>Open the portal for the latest schedule and access information.</p>`,
    }),
  });
};

export const sendCertificateIssuedEmail = ({ to, participantName, trainingTitle, certificateId, verifyUrl, portalUrl, relatedModel, relatedId, dedupeKey }) => sendEmail({
  to,
  category: 'certificate',
  relatedModel,
  relatedId,
  dedupeKey,
  subject: `Your certificate is ready: ${trainingTitle}`,
  html: emailLayout({ eyebrow: 'Verified achievement', title: 'Your certificate is ready', preview: `Certificate issued for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>Congratulations. Your attendance and completion have been verified, and your official certificate is now available.</p>${emailInfoCard([['Training', trainingTitle], ['Certificate ID', certificateId]])}${emailButton('View and download certificate', portalUrl)}<p style="font-size:13px">Public verification: <a class="email-link" href="${escapeHtml(verifyUrl)}" style="color:#176b3b">${escapeHtml(verifyUrl)}</a></p>` }),
});

export const sendTrainerCertificateIssuedEmail = ({ to, trainerName, trainingTitle, certificateId, verifyUrl, portalUrl, relatedModel, relatedId, dedupeKey }) => sendEmail({
  to,
  category: 'certificate',
  relatedModel,
  relatedId,
  dedupeKey,
  subject: `Certificate of Appreciation: ${trainingTitle}`,
  html: emailLayout({ eyebrow: 'Trainer recognition', title: 'Your Certificate of Appreciation is ready', preview: `Thank you for delivering ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(trainerName || 'Trainer')},</p><p>Thank you for sharing your expertise during National Training Week. Your session has been completed, and your official Certificate of Appreciation is now available.</p>${emailInfoCard([['Session', trainingTitle], ['Certificate ID', certificateId]])}${emailButton('View and download certificate', portalUrl)}<p style="font-size:13px">Public verification: <a class="email-link" href="${escapeHtml(verifyUrl)}" style="color:#176b3b">${escapeHtml(verifyUrl)}</a></p>` }),
});
