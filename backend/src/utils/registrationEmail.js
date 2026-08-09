import { emailButton, emailInfoCard, emailLayout, sendEmail } from './email.js';

export const sendRegistrationStatusEmail = ({ to, participantName, trainingTitle, status, date, startTime }) => {
  const approved = status === 'approved';
  const title = approved ? 'Your registration is approved' : 'Registration received';
  const message = approved
    ? 'Your registration has been approved. You can now open My Trainings in your participant portal. Meeting access will appear there when the moderator releases it.'
    : 'Your request is safely recorded and is waiting for administrator review. We will notify you when its status changes.';
  return sendEmail({
    to,
    subject: `${title}: ${trainingTitle}`,
    html: emailLayout({ eyebrow: approved ? 'Place confirmed' : 'Pending review', title, preview: `${title} for ${trainingTitle}`, body: `<p style="margin-top:0">Hello ${participantName || 'Participant'},</p><p>${message}</p>${emailInfoCard([['Training', trainingTitle], ['Date', date ? new Date(date).toLocaleDateString() : ''], ['Start time', startTime], ['Status', approved ? 'Approved' : 'Pending approval']])}${emailButton('View my trainings', `${process.env.FRONTEND_URL}/portal/trainings`)}` }),
  });
};
