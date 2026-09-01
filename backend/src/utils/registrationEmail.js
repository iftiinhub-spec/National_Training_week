import { emailButton, emailInfoCard, emailLayout, escapeHtml, sendEmail } from './email.js';
import { queueApprovalDigest } from '../services/approvalEmailDigest.js';

const formatTime12 = (value) => {
  const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return value || '';
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const sendRegistrationStatusEmail = ({ to, participantName, trainingId, trainingTitle, status, date, startTime }) => {
  const approved = status === 'approved';
  if (approved) return queueApprovalDigest({ to, participantName, trainingId, trainingTitle, date, startTime });
  const title = approved ? 'Your registration is approved' : 'Registration received';
  const message = approved
    ? 'Your registration has been approved. You can now open My Trainings in your participant portal. Meeting access will appear there when the moderator releases it.'
    : 'Your request is safely recorded and is waiting for administrator review. We will notify you when its status changes.';
  return sendEmail({
    to,
    category: 'application_received',
    subject: `${title}: ${trainingTitle}`,
    html: emailLayout({ eyebrow: approved ? 'Place confirmed' : 'Pending review', title, preview: `${title} for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>${message}</p>${emailInfoCard([['Training', trainingTitle], ['Date', date ? new Date(date).toLocaleDateString() : ''], ['Start time', formatTime12(startTime)], ['Status', approved ? 'Approved' : 'Pending approval']])}${emailButton('View my trainings', `${process.env.FRONTEND_URL}/portal/trainings`)}` }),
  });
};

export const sendRegistrationAnnouncementEmail = ({ to, participantName, trainingTitle, subject, message }) => sendEmail({
  to,
  category: 'announcement',
  subject,
  html: emailLayout({
    eyebrow: 'Session update',
    title: subject,
    preview: `${subject}: ${trainingTitle}`,
    body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>${emailInfoCard([['Training', trainingTitle]])}${emailButton('View my trainings', `${process.env.FRONTEND_URL}/portal/trainings`)}`,
  }),
});
