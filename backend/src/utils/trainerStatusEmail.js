import { emailButton, emailInfoCard, emailLayout, escapeHtml, sendEmail } from './email.js';

const portalUrl = () => `${process.env.FRONTEND_URL || ''}/signin`;

export const sendTrainerApplicationReceivedEmail = ({ to, trainerName }) => sendEmail({
  to,
  category: 'application_received',
  subject: 'Your National Training Week trainer application was received',
  html: emailLayout({
    eyebrow: 'Trainer application received',
    title: 'Your application is under review',
    preview: 'Your trainer application has been submitted for administrator review.',
    body: `<p style="margin-top:0">Hello ${escapeHtml(trainerName || 'Trainer')},</p><p>Thank you for applying to be a National Training Week trainer. Your application has been received and is now pending review by our team.</p>${emailInfoCard([['Account status', 'Pending review']])}<p>We will notify you by email once your application has been reviewed.</p>`,
  }),
});

export const sendAdminNewTrainerApplicationEmail = ({ trainerName, trainerEmail }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return Promise.resolve({ success: true, messageId: 'skipped-no-admin-email' });
  return sendEmail({
    to: adminEmail,
    category: 'application_received',
    subject: 'New trainer application awaiting review',
    html: emailLayout({
      eyebrow: 'Admin notification',
      title: 'A new trainer application needs review',
      preview: 'A new trainer application was submitted.',
      body: `<p style="margin-top:0">A new trainer application was submitted and is waiting for review.</p>${emailInfoCard([['Applicant', trainerName || 'Trainer'], ['Email', trainerEmail || '']])}${emailButton('Review trainer applications', `${process.env.FRONTEND_URL || ''}/admin/trainers`)}`,
    }),
  });
};

export const sendTrainerApprovedEmail = ({ to, trainerName }) => sendEmail({
  to,
  category: 'approval',
  subject: 'Your National Training Week trainer account is approved',
  html: emailLayout({
    eyebrow: 'Trainer access approved',
    title: 'Your trainer portal is ready',
    preview: 'Your trainer application has been approved.',
    body: `<p style="margin-top:0">Hello ${escapeHtml(trainerName || 'Trainer')},</p><p>Your trainer application has been reviewed and approved. You can now sign in to the trainer portal using the email and password you submitted during registration.</p>${emailInfoCard([['Account status', 'Approved'], ['Portal', 'Trainer portal']])}${emailButton('Sign in to trainer portal', portalUrl())}<p>If you cannot sign in, use the password reset option on the sign-in page.</p>`,
  }),
});

export const sendTrainerRejectedEmail = ({ to, trainerName, reason }) => sendEmail({
  to,
  category: 'rejection',
  subject: 'National Training Week trainer application update',
  html: emailLayout({
    eyebrow: 'Trainer application update',
    title: 'Your application was reviewed',
    preview: 'Your trainer application status has been updated.',
    body: `<p style="margin-top:0">Hello ${escapeHtml(trainerName || 'Trainer')},</p><p>Thank you for applying to be a National Training Week trainer. After review, your application was not approved at this time.</p>${emailInfoCard([['Account status', 'Rejected'], ['Review note', reason || 'No additional note provided']])}<p>You may contact the organizing team if you need more information.</p>`,
  }),
});
