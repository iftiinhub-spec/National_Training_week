import { emailButton, emailInfoCard, emailLayout, escapeHtml, sendEmail } from './email.js';

export const sendWelcomeEmail = ({ to, participantName }) => sendEmail({
  to,
  subject: 'Welcome to National Training Week',
  html: emailLayout({
    eyebrow: 'Welcome to the learning portal',
    title: 'Your participant account is ready',
    preview: 'Welcome to National Training Week. You can sign in now.',
    body: `<p style="margin-top:0">Hello ${escapeHtml(participantName || 'Participant')},</p><p>Welcome to National Training Week. Your participant account has been created successfully and is ready to use.</p>${emailInfoCard([['Account status', 'Active'], ['Training registration', 'Approval required for each session']])}<p>You can sign in now, explore the published training sessions, and request a place in the sessions you want to attend.</p>${emailButton('Sign in to participant portal', `${process.env.FRONTEND_URL}/signin`)}`,
  }),
});
