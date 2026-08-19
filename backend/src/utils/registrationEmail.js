import { emailButton, emailInfoCard, emailLayout, escapeHtml, sendEmail } from './email.js';

const formatTime12 = (value) => {
  const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return value || '';
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

export const sendRegistrationStatusEmail = ({ to, participantName, trainingTitle, status, date, startTime }) => {
  const approved = status === 'approved';
  const title = approved ? 'Your registration is approved' : 'Registration received';
  const message = approved
    ? 'Your registration has been approved. You can now open My Trainings in your participant portal. Meeting access will appear there when the moderator releases it.'
    : 'Your request is safely recorded and is waiting for administrator review. We will notify you when its status changes.';
  return sendEmail({
    to,
    subject: `${title}: ${trainingTitle}`,
    html: emailLayout({ eyebrow: approved ? 'Place confirmed' : 'Pending review', title, preview: `${title} for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>${message}</p>${emailInfoCard([['Training', trainingTitle], ['Date', date ? new Date(date).toLocaleDateString() : ''], ['Start time', formatTime12(startTime)], ['Status', approved ? 'Approved' : 'Pending approval']])}${emailButton('View my trainings', `${process.env.FRONTEND_URL}/portal/trainings`)}` }),
  });
};
