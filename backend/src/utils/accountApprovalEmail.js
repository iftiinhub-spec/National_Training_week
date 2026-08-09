import { emailButton, emailInfoCard, emailLayout, sendEmail } from './email.js';

export const sendAccountStatusEmail = ({ to, participantName, status }) => {
  const approved = status === 'approved';
  const rejected = status === 'rejected';
  const title = approved
    ? 'Your participant account is approved'
    : rejected
      ? 'Update on your participant account request'
      : 'Participant registration received';
  const message = approved
    ? 'Your National Training Week participant account has been approved. You can now sign in, browse sessions, and submit training registration requests.'
    : rejected
      ? 'Your National Training Week participant account request was not approved. Please contact support if you believe this needs review.'
      : 'Your participant account request has been received and is waiting for administrator approval. You cannot sign in yet. We will email you when your account is approved.';
  return sendEmail({
    to,
    subject: title,
    html: emailLayout({ eyebrow: approved ? 'Account approved' : rejected ? 'Account update' : 'Pending approval', title, preview: message, body: `<p style="margin-top:0">Hello ${participantName || 'Participant'},</p><p>${message}</p>${emailInfoCard([['Account status', approved ? 'Approved' : rejected ? 'Not approved' : 'Pending approval']])}${approved ? emailButton('Sign in to participant portal', `${process.env.FRONTEND_URL}/signin`) : ''}` }),
  });
};
